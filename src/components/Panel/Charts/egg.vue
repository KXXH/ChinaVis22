<template>
    <svg class="egg" viewBox="-100 -100 200 200" style="max-width:300px;margin:0px auto;">
        <path v-if="max!=0" v-for="i in [0, 1, 2]" :d="huan[i]" :fill="color[i]" />
        <path v-if="max==0" :d="circle" fill="rgb(255, 210, 152)" />
    </svg>
</template>
<script setup>
import * as d3 from "d3";
import { ref, computed, onMounted } from "vue";
const props = defineProps(["a"]);
// let a = [200, 39, 15];
// a=a.map(i=>i/a[0]*100)
let max = computed(() => {return Math.max(...props.a)});

let circle = computed(() => getpath([1], 0, 5))

const a = computed(() => {
    return props.a.map(i => i / max.value * 100)
})

function getpath(data, r1, r2) {
    var arcs = d3.pie()(data);
    var arc = d3.arc().innerRadius(r1).outerRadius(r2);
    var p = arcs.map(i => { return arc(i) })
    return p
}

let huan = computed(() => { return a.value.map(i => {  return getpath([1], 0, i) }) })
let color = ["rgb(251, 251, 235)", "rgb(251, 130, 30)", "rgb(255, 210, 152)"]

</script>