import createWhisper from "ngraph.cw";

import createGraph from "./createGraph";
function cw(nodes, links){
    const g = createGraph(nodes, links);
    var whisper = createWhisper(g);
    var requiredChangeRate = 0; // 0 is complete convergence
    while (whisper.getChangeRate() > requiredChangeRate) {
        whisper.step();
    }
    return nodes.map(n => whisper.getClass(n.id));
}

function louvain(nodes, links){
    const g = createGraph(nodes, links);
    var clusters = detectClusters(g);
    return nodes.map(n=>clusters.getClass(n.id));
}

export {cw, louvain};