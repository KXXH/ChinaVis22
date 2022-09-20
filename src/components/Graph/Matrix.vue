<template>

    <div style="color: #333;
  margin: 1em 2em 4em 2em;
  position: relative; " v-if="node_count < 1000">

        <div>
            <p>Order: <select id="order">
                    <option value="id">by Id</option>
                    <option value="count">by Frequency</option>
                    <!-- <option value="group">by Cluster</option> -->
                    <option value="leafOrder">by Leaf Order</option>
                    <!-- <option value="leafOrderDist">by Leaf Order over Distance Matrix</option> -->
                    <option value="barycenter">by Crossing Reduction</option>
                    <option value="rcm">by Bandwidth Reduction (RCM)</option>
                    <option value="spectral">Spectral</option>
                </select>
            </p>
            <p>Distance: <select id="distance">
                    <option value="manhattan" selected="true">Manhattan</option>
                    <option value="euclidean">Euclidean</option>
                    <option value="chebyshev">Chebyshev</option>
                    <option value="hamming">Hamming</option>
                    <option value="jaccard">Jaccard</option>
                    <option value="braycurtis">Braycurtis</option>
                </select>
            </p>

        </div>
        <div class="svgdiv">
        </div>

    </div>
    <div v-if="node_count >= 1000" style="max-width:300px;margin:400px auto;">
        <n-card title="当前节点过多">
            建议筛选后显示
        </n-card>

    </div>

</template>
<style>
@import url(http://fonts.googleapis.com/css?family=PT+Serif|PT+Serif:b|PT+Serif:i|PT+Sans|PT+Sans:b);

line {
    stroke: #fff;
}

text.notsee {
    fill: rgba(0, 0, 0, 0);

}

text.active {
    fill: rgba(0, 0, 0, 1);
    font-size: 120%;
}

rect.highlight {
    fill: none;
    stroke: red;
    stroke-width: 2;
}
</style>
<script setup>
import { min } from 'lodash';
import { NCard } from 'naive-ui';
import { onMounted, computed, toRaw, watch } from 'vue';
import { draw } from "./utils/matrix.js";
import { viewStore } from "../../store/view.js";
const emit=defineEmits(["brushMatrix"])
const props = defineProps(["graph"]);
const view = viewStore();
const node_count = computed(() => {
    return 100
    // return props.graph.getNodeCount();
})
function handleSelect(v){
    emit("brushMatrix",v)
}
console.log(node_count)
// if (node_count.value < 1000) {
//         view.matrixOn=true;
//     }
// else view.matrixOn=false;
onMounted(() => {
    // console.log(toRaw(g.value))
    if (node_count.value < 1000) {
        let newg = getmatrix(props.graph)
        draw(newg, 200,handleSelect);
    }

})
watch(node_count.value, () => {
    if (node_count.value < 1000) {
        let newg = getmatrix(props.graph)
        draw(newg, 200,handleSelect);
        // view.matrixOn=true;
    }
    // else view.matrixOn=false;
})
function getmatrix(g) {

    let nametoindex = {}
    let indextoname=[]
    let cnt = 0;
    g.forEachNode(function (node) {
        nametoindex[node.id] = cnt;
        indextoname.push(node)
        cnt++;
    });
    console.log(cnt)

    let dis = []
    for (let i = 0; i < cnt; i++) {
        let tmp = []
        for (let j = 0; j < cnt; j++)
            tmp.push(0)
        dis.push(tmp)
    }


    let RELATION_STRENGTH = {
        "r_cert": 3,
        "r_subdomain": 3,
        "r_request_jump": 3,
        "r_dns_a": 3,
        "r_whois_name": 2,
        "r_whois_email": 2,
        "r_whois_phone": 2,
        "r_cert_chain": 1,
        "r_cname": 1,
        "r_asn": 0,
        "r_cidr": 0
    }
    const dfs = (source, now, depth) => {
        if (depth <= 0) return;
        let edges = g.getLinks(now);
        for (let e of edges) {
            let nextn = e.data.source == now ? e.data.target : e.data.source;
            // console.log(nametoindex[nextn],nametoindex[source])
            dis[nametoindex[nextn]][nametoindex[source]] += depth;
            dis[nametoindex[source]][nametoindex[nextn]] += depth;
            let s = RELATION_STRENGTH[e.data.relation]
            let dd = {
                3: 1,
                2: 1,
                1: 2,
                0: 3
            }[s]
            dfs(source, nextn, depth - dd)
            // console.log(e.data)
        }
    }
    
    // function bfs(start){
    //     let q=new Array()
    //     q.push(start)
    //     while(q.length!=0){
    //         let now=
    //     }
    // }    
    g.forEachNode(function (node) {
        dfs(node.id, node.id, 3)
    });
    // console.log(dis)

    // let step=Math.ceil(cnt/num);//节点总数，采样后数目

    // let newdis=[]
    // let newnodes=[]
    // let newlinks=[]
    // for (let i = 0; i < cnt; i+=step) {
    //     let tmp=[]
    //     newnodes.push({"id":i/step})
    //     for (let j = 0; j < cnt; j+=step){
    //         let  newr=0;

    //         for (let ii=i;ii<Math.min(cnt,i+step);ii++){
    //             for(let jj=j;jj<Math.min(cnt,j+step);jj++)
    //             {
    //                 newr+=dis[ii][jj];
    //             }

    //         }
    //         newlinks.push({"source":i/step,"target":j/step,"value":newr/step})

    //         tmp.push(newr/step)
    //     }

    //     newdis.push(tmp)
    // }
    // console.log(newdis)
    // return {"nodes":newnodes,"links":newlinks};


    let nodes = []
    let links = []
    for (let i = 0; i < cnt; i++) {
        nodes.push({ "id":indextoname[i].id,"graphnode": indextoname[i] })
        for (let j = 0; j < cnt; j++) {
            links.push({ "source": i, "target": j, "value": dis[i][j] })
        }
    }
    console.log(nodes)
    return { "nodes": nodes, "links": links };
}
</script>