function neighbors(graph, nodes, id=n=>n.id) {
    const res = new Map(nodes);
    nodes.forEach(node => {
        graph.getLinks(id(node)).forEach(link => {
            res.set(link.toId, graph.getNode(link.toId).data);
            res.set(link.fromId, graph.getNode(link.fromId).data);
        });
    });
    return res;
}

export default neighbors;