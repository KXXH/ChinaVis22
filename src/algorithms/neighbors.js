function neighbors(graph, nodes, id=n=>n.id) {
    const res = new Set(nodes);
    nodes.forEach(node => {
        graph.getLinks(id(node)).forEach(link => {
            res.add(link.toId);
            res.add(link.fromId);
        });
    });
    return res;
}

export default neighbors;