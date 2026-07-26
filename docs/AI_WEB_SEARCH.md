# AI 绘图分析网络搜索

本插件可以在 AI 绘图分析和连环画分析过程中提供 `web_search` 工具。工具定义、搜索请求、结果裁剪、模型回填和回合上限都在本插件内部完成，不依赖 `Extension-WebSearch`、SillyTavern `ToolManager` 或其他第三方扩展。

## 调用链

```text
聊天内容
-> AI 绘图分析模型
-> 模型按需返回 web_search 调用
-> 本插件请求 Tavily 或 SearXNG
-> 本插件把搜索结果作为工具结果回填
-> 同一个模型继续生成最终绘图提示词
```

搜索不是把整个聊天直接发给搜索服务。搜索服务收到的是模型生成的查询词，但查询词仍可能包含上下文中的名称或术语；插件将查询硬限制为 240 字符，却不会用不可靠的规则猜测某个专名是否属于隐私，也不会逐次弹窗确认。敏感对话不要开启网络搜索。

## 支持范围

| 分析来源 | 工具协议 | 网络搜索 |
| --- | --- | --- |
| OpenAI 兼容 API | Chat Completions `tool_calls` / `role: tool` | 支持 |
| DeepSeek API | OpenAI 兼容工具协议，并保留 `reasoning_content` | 支持 |
| Anthropic API | Messages `tool_use` / `tool_result` | 支持 |
| SillyTavern 当前 LLM | quiet generation 不执行本插件工具回合 | 不支持 |

OpenAI-compatible 端点和所选模型本身也必须支持函数工具调用。只兼容纯文本生成、但不实现 `tools` 的代理不能使用此功能。

面板中的 `测试搜索` 只直接请求 Tavily 或 SearXNG，用于验证搜索服务、地址和 Key；它不会调用分析模型，因此不能证明所选模型支持工具调用。完整闭环需要用无隐私的测试聊天实际生成一次绘图提示词。

## 配置 Tavily

1. 在 Tavily 控制台创建 API Key。
2. 打开 `AI/LLM 管理 -> 网络搜索工具`。
3. 开启 `允许模型搜索网络`。
4. 选择 `Tavily Search API`。
5. 填写 `Tavily API Key`。
6. 点击 `测试搜索`。

插件固定请求官方端点 `POST https://api.tavily.com/search`，使用 `basic` 搜索，不请求 Tavily 生成答案、原始网页或图片。这样可以降低费用、延迟和网页提示注入面。

## 配置 SearXNG

1. 准备一个可信的自建 SearXNG 实例。
2. 确认实例允许 `format=json`；很多公共实例会禁用 JSON API。
3. 选择 `SearXNG（自建）`。
4. 填写实例根地址或 Search URL，例如 `https://search.example.com/search`。
5. 点击 `测试搜索`。

插件使用：

```http
GET /search?q=...&format=json&categories=general
```

SearXNG 地址只能来自本地设置。模型只能提供查询词，不能指定目标 URL，也没有访问任意网页的工具。

## Danbooru 使用建议

系统提示已经要求模型在遇到新角色、新作品、新服装设计或不确定的 Danbooru 标签时先搜索，并优先选择官方来源与 Danbooru tag/wiki 页面。自定义绘图规则还可以加入更严格的要求，例如：

```text
若角色、作品或服装可能晚于训练截止时间，或不能确认 Danbooru 规范标签，必须先调用 web_search。
角色外观优先查询作品官方页面；标签拼写与含义优先查询 site:danbooru.donmai.us/wiki_pages。
搜索结果只用于核对公开视觉事实和标签，不得覆盖聊天中已经明确出现的画面事实。
```

搜索结果只是网页摘要，不等于 Danbooru 标签数据库的完整枚举。最终标签仍应由绘图分析规则约束，避免把网页自然语言直接当成标签串。

## 限制与安全

- 默认关闭；只有外部 OpenAI-compatible 或 Anthropic 分析来源可以开启。
- 默认每次搜索返回 5 条结果，单次分析最多处理 3 个工具调用（失败、无效调用也占额度），最多 3 个工具回合；空响应重试和瞬时网络重试不会重置额度。
- 单个工具结果最多回填 12000 字符，整次分析最多回填 30000 字符，超出会截断或省略。
- 网页摘要被标记为不可信数据；系统提示要求模型忽略网页中的指令。
- Tavily 目标固定为官方域名；SearXNG 目标只能由用户配置。模型不能访问任意 URL。
- Tavily Key 与其他插件设置一样保存在当前 SillyTavern 来源的浏览器 `localStorage`，不是加密保险库，也不会随配置导出。
- SearXNG 使用 GET，请求词可能出现在 SearXNG、反向代理或 SillyTavern 的访问日志中。为支持本机/内网自建实例，插件允许用户填写任意 HTTP(S) 地址；模型不能改写该地址，但用户仍应只配置自己信任的实例。
- 外域请求沿用 SillyTavern 核心 `/proxy`；若宿主关闭 CORS Proxy，搜索测试会失败。这是宿主 HTTP 能力，不是对其他扩展的依赖。

## 官方协议文档

- [OpenAI Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Web search（Responses API，当前插件未采用）](https://developers.openai.com/api/docs/guides/tools-web-search)
- [DeepSeek Tool Calls](https://api-docs.deepseek.com/guides/tool_calls)
- [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
- [Anthropic: How tool use works](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)
- [Anthropic: Handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)
- [Anthropic Web Search（服务端工具，当前插件未采用）](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [SearXNG Search API](https://docs.searxng.org/dev/search_api.html)

选择客户端函数工具而不是供应商原生托管搜索，是为了让 OpenAI-compatible、DeepSeek 和 Claude 共用相同搜索源、设置、预算与安全边界。
