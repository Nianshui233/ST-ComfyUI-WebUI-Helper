const DEFAULT_MAX_TOOL_ROUNDS = 3;
const DEFAULT_MAX_TOOL_CALLS = 3;
const MAX_TOOL_RESULT_CHARACTERS = 12000;
const DEFAULT_MAX_TOOL_RESULTS_TOTAL_CHARACTERS = 30000;
const MAX_TOOL_RESULTS_TOTAL_CHARACTERS = 60000;

function clampPositiveInteger(value, fallback, maximum) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(maximum, parsed);
}

export function createAiToolBudget({
    maxRounds = DEFAULT_MAX_TOOL_ROUNDS,
    maxCalls = DEFAULT_MAX_TOOL_CALLS,
    maxResultCharacters = DEFAULT_MAX_TOOL_RESULTS_TOTAL_CHARACTERS,
} = {}) {
    return {
        maxRounds: clampPositiveInteger(maxRounds, DEFAULT_MAX_TOOL_ROUNDS, 5),
        maxCalls: clampPositiveInteger(maxCalls, DEFAULT_MAX_TOOL_CALLS, 8),
        maxResultCharacters: clampPositiveInteger(
            maxResultCharacters,
            DEFAULT_MAX_TOOL_RESULTS_TOTAL_CHARACTERS,
            MAX_TOOL_RESULTS_TOTAL_CHARACTERS,
        ),
        usedRounds: 0,
        usedCalls: 0,
        usedResultCharacters: 0,
    };
}

function normalizeToolBudget(budget, { maxRounds, maxCalls }) {
    if (!budget) return createAiToolBudget({ maxRounds, maxCalls });

    budget.maxRounds = clampPositiveInteger(
        budget.maxRounds ?? maxRounds,
        DEFAULT_MAX_TOOL_ROUNDS,
        5,
    );
    budget.maxCalls = clampPositiveInteger(
        budget.maxCalls ?? maxCalls,
        DEFAULT_MAX_TOOL_CALLS,
        8,
    );
    budget.maxResultCharacters = clampPositiveInteger(
        budget.maxResultCharacters,
        DEFAULT_MAX_TOOL_RESULTS_TOTAL_CHARACTERS,
        MAX_TOOL_RESULTS_TOTAL_CHARACTERS,
    );

    const usedRounds = Number.parseInt(budget.usedRounds, 10);
    const usedCalls = Number.parseInt(budget.usedCalls, 10);
    const usedResultCharacters = Number.parseInt(budget.usedResultCharacters, 10);
    budget.usedRounds = Number.isFinite(usedRounds) && usedRounds > 0 ? usedRounds : 0;
    budget.usedCalls = Number.isFinite(usedCalls) && usedCalls > 0 ? usedCalls : 0;
    budget.usedResultCharacters = Number.isFinite(usedResultCharacters) && usedResultCharacters > 0
        ? usedResultCharacters
        : 0;
    return budget;
}

function redactSensitiveText(value) {
    return String(value || '')
        .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
        .replace(/\b(?:tvly|sk)-[A-Za-z0-9_-]{8,}\b/g, '[REDACTED_KEY]');
}

function getSafeErrorMessage(error) {
    const message = redactSensitiveText(error?.message || error || 'unknown error').trim();
    return message.slice(0, 300) || 'unknown error';
}

function parseToolArguments(value) {
    let parsed = value;
    if (value === '' || value === undefined || value === null) {
        parsed = {};
    } else if (typeof value === 'string') {
        parsed = JSON.parse(value);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('工具参数必须是 JSON 对象');
    }
    return parsed;
}

function truncateText(text, maximum, marker) {
    if (text.length <= maximum) return text;
    if (maximum <= 0) return '';
    if (marker.length >= maximum) return marker.slice(0, maximum);
    return `${text.slice(0, maximum - marker.length)}${marker}`;
}

function serializeToolResult(value) {
    let text;
    if (typeof value === 'string') {
        text = value;
    } else {
        try {
            text = JSON.stringify(value);
        } catch {
            text = String(value ?? '');
        }
    }

    return truncateText(text, MAX_TOOL_RESULT_CHARACTERS, '\n[工具结果已截断]');
}

function applyToolResultBudget(results, budget) {
    return results.map(result => {
        const remaining = Math.max(0, budget.maxResultCharacters - budget.usedResultCharacters);
        if (remaining === 0) {
            return {
                ...result,
                content: '[工具结果已省略：本次分析的总回填额度已用尽]',
            };
        }

        const content = truncateText(
            result.content,
            remaining,
            '\n[工具结果已截断：本次分析的总回填额度已用尽]',
        );
        budget.usedResultCharacters += content.length;
        return { ...result, content };
    });
}

async function executeToolCall(call, {
    toolMap,
    toolContext,
    allowExecution,
    duplicate,
    logger,
}) {
    const id = String(call?.id ?? '');
    const name = String(call?.name || '').trim();
    if (!id.trim()) throw new Error('模型返回的工具调用缺少 id');
    if (!name) throw new Error(`工具调用 ${id} 缺少名称`);

    if (duplicate) {
        return {
            id,
            name,
            content: `Tool error: duplicate tool call id "${id}".`,
            isError: true,
        };
    }

    if (!allowExecution) {
        return {
            id,
            name,
            content: 'Tool error: the configured tool-call limit has been reached. Continue without another search.',
            isError: true,
        };
    }

    const tool = toolMap.get(name);
    if (!tool) {
        return {
            id,
            name,
            content: `Tool error: tool "${name}" is not available.`,
            isError: true,
        };
    }

    try {
        const args = parseToolArguments(call.arguments);
        const result = await tool.execute(args, toolContext);
        return {
            id,
            name,
            content: serializeToolResult(result),
            isError: false,
        };
    } catch (error) {
        const message = getSafeErrorMessage(error);
        logger.warn('[AI Gen] AI 绘图工具调用失败', { tool: name, error: message });
        return {
            id,
            name,
            content: `Tool error: ${message}`,
            isError: true,
        };
    }
}

export function getOpenAIToolDefinitions(tools) {
    return tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
        },
    }));
}

export function getAnthropicToolDefinitions(tools) {
    return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
    }));
}

export async function runAiToolLoop({
    messages,
    tools = [],
    maxRounds = DEFAULT_MAX_TOOL_ROUNDS,
    maxCalls = DEFAULT_MAX_TOOL_CALLS,
    requestCompletion,
    decodeResponse,
    appendToolResults,
    toolContext = {},
    budget = null,
    logger = console,
}) {
    const conversation = messages.map(message => structuredClone(message));
    const toolMap = new Map(tools.map(tool => [tool.name, tool]));
    const seenCallIds = new Set();
    const reasoningParts = [];
    const sharedBudget = normalizeToolBudget(budget, { maxRounds, maxCalls });
    const roundLimit = sharedBudget.maxRounds;
    const callLimit = sharedBudget.maxCalls;
    let processedCalls = 0;
    let toolRounds = 0;

    while (true) {
        const parsed = await requestCompletion(conversation);
        const decoded = decodeResponse(parsed);
        if (decoded.reasoning) reasoningParts.push(String(decoded.reasoning).trim());

        const calls = Array.isArray(decoded.toolCalls) ? decoded.toolCalls : [];
        if (!calls.length) {
            return {
                text: String(decoded.text || ''),
                reasoning: reasoningParts.filter(Boolean).join('\n'),
                parsed,
                toolCalls: processedCalls,
                toolRounds,
                toolResultCharacters: sharedBudget.usedResultCharacters,
            };
        }

        if (!tools.length) {
            throw new Error('模型请求了工具，但当前没有启用任何 AI 绘图工具');
        }
        if (sharedBudget.usedRounds >= roundLimit) {
            throw new Error(`AI 绘图工具调用超过 ${roundLimit} 个回合，已停止以避免无限循环`);
        }

        sharedBudget.usedRounds += 1;
        toolRounds += 1;
        const executionPlans = calls.map(call => {
            const id = String(call?.id ?? '');
            const hasId = !!id.trim();
            const duplicate = hasId && seenCallIds.has(id);
            if (hasId) seenCallIds.add(id);
            const withinBudget = sharedBudget.usedCalls < callLimit;
            if (withinBudget) {
                sharedBudget.usedCalls += 1;
                processedCalls += 1;
            }
            const allowExecution = withinBudget && !duplicate;
            return { call, allowExecution, duplicate };
        });

        const executedResults = await Promise.all(executionPlans.map(plan => executeToolCall(plan.call, {
            toolMap,
            toolContext,
            allowExecution: plan.allowExecution,
            duplicate: plan.duplicate,
            logger,
        })));
        const results = applyToolResultBudget(executedResults, sharedBudget);

        logger.info('[AI Gen] AI 绘图工具回合', {
            round: toolRounds,
            tools: calls.map(call => String(call?.name || 'unknown')),
            processedCalls,
            totalProcessedCalls: sharedBudget.usedCalls,
            totalResultCharacters: sharedBudget.usedResultCharacters,
            callLimit,
        });

        appendToolResults({
            messages: conversation,
            decoded,
            results,
        });
    }
}
