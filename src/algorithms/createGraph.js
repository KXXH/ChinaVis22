import createGraph from "ngraph.graph";

export default function cg(nodes, edges, id = n => n.id, source = n => n.source.id, target = n => n.target.id) {
    const graph = createGraph();
    nodes.forEach(node => {
        graph.addNode(id(node), node);
    });
    edges.forEach(edge => {
        graph.addLink(source(edge), target(edge), edge);
    });
    return graph;
}