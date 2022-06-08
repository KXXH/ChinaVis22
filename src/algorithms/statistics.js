import centrality from "ngraph.centrality";
import { bin } from "d3";
import _ from "lodash"

function getIndustry(s){
    const industries = "ABCDEFGHI".split("");
    return industries.filter(i=>s.includes(i));
}

function count_by_field(g, fieldFn){
    const count={};
    g.forEachNode(n => {
        const industries = fieldFn(n);
        industries.forEach(i => {
            let c = count[i] ?? 0;
            count[i] = ++c;
        })
    })
    return count
}

function industry_count(g){
    return count_by_field(g, n=>getIndustry(n.data.industry))
}

function type_count(g){
    return count_by_field(g, n=>[n.data.type]);
}

function degree_count(g){
    const degreeCentrality = centrality.degree(g);
    return degreeCentrality;
}

function degree_bin(degree){
    const values = _.values(degree);
    return bin()(values);
}

function node_stat(g){
    const degree = degree_count(g);
    return {
        count:{
            byIndustry: industry_count(g),
            byDegree: degree_bin(degree),
            byType: type_count(g)
        },
        degree
    }
}

export {degree_count, industry_count, node_stat}
