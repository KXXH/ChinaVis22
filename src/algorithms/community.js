import createWhisper from "ngraph.cw";
import detectClusters from "ngraph.louvain"
import createGraph from "./createGraph";
function cw(nodes, links){
    const g = createGraph(nodes, links);
    var whisper = createWhisper(g);
    var requiredChangeRate = 0; // 0 is complete convergence
    while (whisper.getChangeRate() > requiredChangeRate) {
        whisper.step();
    }
    return whisper;
    // return nodes.map(n => whisper.getClass(n.id));
}

function louvain(nodes, links){
    let g = arguments[0];

    if(arguments.length==2){
        g = createGraph(nodes, links)
    }
    var clusters = detectClusters(g);
    return clusters;
    // return nodes.map(n=>clusters.getClass(n.id));
}

export {cw, louvain};