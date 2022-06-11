<template>

    <svg class="pie" viewBox="-100 -100 200 200" style="max-width:300px;margin:0px auto;" >
        <g v-for="g in [0,1]">
            <path v-for="i in datap[g].l" :d="datap[g].data.path[i]" :fill="c[i]" @mouseover="over($event,datap[g].data.text[i])" @mouseleave="leave($event)"/>
        </g>
        
        <text x="0" y="0" dy="7" font-size="18" text-anchor="middle">{{text}}</text>
    </svg>
</template>
<script setup>
import * as d3 from "d3";
import {ref,computed} from "vue";
import _ from "lodash"
const props = defineProps(["industry","type"]);
const emit=defineEmits(["selectindustry","selecttype"])
var data = computed(()=>{

    return [_(props.industry).toPairs().value(),_(props.type).toPairs().value()]
})
// var data1l=computed(()=>{
//     return (d3.range(data1.value.length));
// })

// console.log(data1)
// var data2 = [1, 1, 2, 3, 5, 8, 13, 21,4,1,10];

// var data2l=d3.range(data2.length);
function getpath(data,r){
    var arcs = d3.pie()(data.map(i=>i[1]));
    var arc = d3.arc().innerRadius(r).outerRadius(r+20).padAngle(0.01).padRadius(100);
    var p=arcs.map(i=>{return arc(i)})

    return {"path":p,"text":data.map(i=>i[0])};
}

var c=d3.schemeCategory10

let datap=computed(()=>{

return data.value.map((d,index)=>{ return {"data":getpath(d,(index+1)*40),"l":d3.range(d.length)}})
})
// let p2=ref(getpath(data2,40))

var text=ref();
function over($event,t){
    
    $event.target.setAttribute('fill-opacity','0.5');
    text.value=t
    if(t.length==1)
    emit("selectindustry",t)
    else emit("selecttype",t)
    
}
function leave($event){
    $event.target.setAttribute('fill-opacity','1');
    text.value=null
}
</script>