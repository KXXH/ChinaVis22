<template>
    <div class="flex flex-col">
        <legend-vue />
        <div class="flex mx-2 border">
            <n-statistic label="Nodes" class="m-2 flex-1">
                <n-number-animation :from="0" :to="node_count" />
            </n-statistic>
            <n-statistic label="Links" class="m-2 flex-1">
                <n-number-animation :from="0" :to="link_count" />
            </n-statistic>
        </div>
        <div class="border m-2" h="100px">
            <histogram-vue :x="Array.from(stats.count.byDegree.values()).map(v => v.x0) ?? []" :y="histData"
                @brush="handleBrush" />
        </div>
        <!-- <div class="grid grid-cols-[1fr,1fr]"> -->
        <div class="border m-2 p-2 h-150px">
            <pie-vue class="h-full" :industry="industry" :type="type" />
        </div>
        <div class="border m-2 h-150px p-2 text-center">
            <egg-vue 
                v-if="view.selectedNodes.size>0" 
                :a="jump"
                class="h-full" 
            />
            <n-empty
                v-else
                style="margin: auto 0px"
                description="Use 3-jump search to get jump imfomation."
            ></n-empty>
        <!-- </div> -->
        </div>



    </div>
</template>

<script setup>
import { NNumberAnimation, NStatistic, NEmpty } from "naive-ui"
import LegendVue from './Legend.vue';
import { useCounter } from '@vueuse/core'
import HistogramVue from './Charts/Histogram.vue';
import pieVue from './Charts/pie.vue';
import eggVue from "./Charts/egg.vue"
import { computed, ref, watchEffect } from 'vue';
import { node_stat } from "../../algorithms/statistics";
import { viewStore } from "../../store/view";
import _ from "lodash"

const view = viewStore();
const props = defineProps(["graph"]);
const emits = defineEmits(["select"]);
const g = computed(() => props.graph);
const stats = computed(() => {
    return node_stat(g.value);
})
const histData = computed(() => {
    return _(stats.value.count.byDegree).toPairs().sortBy(i => i[0]).map(i => i[1].length).value()
});
function handleBrush(e) {
    const [x0, x1] = e;
    const nodes = new Map(_(stats.value.degree).toPairs().filter(([k, v]) => {
        return v >= x0 && v <= x1;
    }).map(([k, v]) => [k, props.graph.getNode(k)]).value());
    // console.log(nodes,_(stats.value.degree).toPairs().filter(([k, v])=>{
    //     return v>=x0&&v<=x1;
    // }).map(([k,v])=>[k, graph.getNode(k)]).value())
    emits("select", nodes)
}
const industry = computed(() => { return stats.value.count.byIndustry })
const type = computed(() => { return stats.value.count.byType })
const node_count = computed(() => {
    let c = 0;
    props.graph.forEachNode(() => {
        c++;
    });
    return c
})
const link_count = computed(() => {
    let c = 0;
    props.graph.forEachLink(() => {
        c++;
    });
    return c
})

const jump = computed(()=>{
    const res = [0,0,0];
    res[-1]=0;
    view.selectedNodes.forEach(v=>{
        let level = (v.level??3)>2?-1:v.level;
        res[level]++;
    })
    console.log("jump", res)
    return res.slice(0,3);
})

</script>