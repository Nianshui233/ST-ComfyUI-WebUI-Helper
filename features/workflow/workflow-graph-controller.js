import { buildWorkflowGraph } from './workflow-graph.js';

export function createWorkflowGraphController({ showToast }) {
    let graph = null;

    function render(query = '') {
        const container = document.getElementById('workflow-node-view');
        if (!container || !graph) return;
        const term = String(query || '').trim().toLowerCase();
        const nodes = graph.nodes.filter(node => (
            !term || node.id.includes(term) || node.type.toLowerCase().includes(term) || node.title.toLowerCase().includes(term)
        ));
        container.replaceChildren();
        const summary = document.createElement('div');
        summary.className = 'workflow-node-summary';
        summary.textContent = `${graph.nodes.length} 个节点 · ${graph.edges.length} 条连接 · ${graph.outputs.length} 个输出端`;
        container.appendChild(summary);
        const list = document.createElement('div');
        list.className = 'workflow-node-list';
        for (const node of nodes) {
            const item = document.createElement('article');
            item.className = 'workflow-node-item';
            const dependencies = node.links.map(link => `#${link.sourceId}:${link.sourceOutput} → ${link.inputName}`);
            item.innerHTML = '<div class="workflow-node-id"></div><div class="workflow-node-copy"><b></b><span></span><small></small></div>';
            item.querySelector('.workflow-node-id').textContent = `#${node.id}`;
            item.querySelector('b').textContent = node.title;
            item.querySelector('span').textContent = node.type;
            item.querySelector('small').textContent = dependencies.length ? dependencies.join(' · ') : '无上游节点';
            list.appendChild(item);
        }
        container.appendChild(list);
        container.hidden = false;
    }

    function refresh() {
        const input = document.getElementById('comfyui-workflow');
        try {
            graph = buildWorkflowGraph(JSON.parse(input?.value || '{}'));
            render(document.getElementById('workflow-node-search')?.value);
        } catch (error) {
            showToast('error', `节点视图无法读取工作流：${error.message}`);
        }
    }

    function init() {
        document.getElementById('workflow-node-view-toggle')?.addEventListener('click', refresh);
        document.getElementById('workflow-node-search')?.addEventListener('input', event => render(event.target.value));
    }

    return { init, refresh };
}
