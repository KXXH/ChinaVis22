import detectClusters from "ngraph.louvain";
import coarsen from "ngraph.coarsen";

function louvain(g){
    return detectClusters(g)
}

function simplify(g){
    const clusters = louvain(g);
    var coarseGraph = coarsen(g, clusters);
    return coarseGraph;
}

export {simplify}