import _ from "lodash";
import { toRaw } from "vue";
import {RELATION_STRENGTH} from "../config/node_and_links.js"

function mergeMap(maps) {
    return new Map(_.flatten(maps.map(m => Array.from(m.entries()))));
}

function neighbors_with_importance(graph, nodes, id = n => n.id, link_filter = l => true, importance = (l, n) => 0) {
    const res = {};
    nodes.forEach(node => {
        graph.getLinks(id(node)).forEach(link => {
            if(!link_filter(link)) return;
            const i = importance(link, node);
            const m = res[i] ?? (new Map());
            m.set(link.toId, graph.getNode(link.toId).data);
            m.set(link.fromId, graph.getNode(link.fromId).data);
            res[i] = m;
        });
    });
    
    return res;
}

function neighbors(graph, nodes, id = n => n.id, link_filter = l => true) {
    return neighbors_with_importance(graph, nodes, id, link_filter)[0]
}



function extend_graph(g, nodes) {
    const level0 = toRaw(nodes);
    const level1 = neighbors(g, nodes, n => n.id);
    const level2 = neighbors(g, level1, n => n.id, l => true, l => RELATION_STRENGTH[l.data.relation] > 0);
    const level3 = neighbors(g, level1, n => n.id, l => true, l => RELATION_STRENGTH[l.data.relation] > 1);
    return mergeMap([level0, level1, level2, level3]);
}

export default neighbors;
export {extend_graph};