function isNodeLink(value) {
    return Array.isArray(value) && value.length >= 2 && /^\d+$/.test(String(value[0]));
}

function collectLinks(value, inputName, links = []) {
    if (isNodeLink(value)) {
        links.push({ sourceId: String(value[0]), sourceOutput: Number(value[1]) || 0, inputName });
        return links;
    }
    if (Array.isArray(value)) {
        value.forEach(item => collectLinks(item, inputName, links));
    }
    return links;
}

export function buildWorkflowGraph(workflow) {
    if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
        throw new Error('工作流必须是 ComfyUI API Format JSON 对象');
    }
    const nodes = Object.entries(workflow).map(([id, node]) => {
        const inputs = node?.inputs && typeof node.inputs === 'object' ? node.inputs : {};
        const links = Object.entries(inputs).flatMap(([name, value]) => collectLinks(value, name));
        return {
            id: String(id),
            type: String(node?.class_type || 'Unknown'),
            title: String(node?._meta?.title || node?.class_type || `Node ${id}`),
            inputCount: Object.keys(inputs).length,
            links,
        };
    });
    const nodeIds = new Set(nodes.map(node => node.id));
    const edges = nodes.flatMap(target => target.links.map(link => ({
        ...link,
        targetId: target.id,
        missingSource: !nodeIds.has(link.sourceId),
    })));
    const outgoing = new Set(edges.map(edge => edge.sourceId));
    return {
        nodes,
        edges,
        roots: nodes.filter(node => node.links.length === 0).map(node => node.id),
        outputs: nodes.filter(node => !outgoing.has(node.id)).map(node => node.id),
        missingLinks: edges.filter(edge => edge.missingSource),
    };
}
