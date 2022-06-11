<template>
    <div class="flex flex-col">
        <legend-vue />
        <div class="border m-2" h="100px">
            <histogram-vue :x="Array.from(stats.count.byDegree.values()).map(v => v.x0) ?? []" :y="histData"
                @brush="handleBrush" />
        </div>
        <div class="flex w-full mx-1">
            <n-statistic label="Nodes" class="m-2 flex-1">
                <n-number-animation :from="0" :to="node_count" />
            </n-statistic>
            <n-statistic label="Links" class="m-2 flex-1">
                <n-number-animation :from="0" :to="link_count" />
            </n-statistic>
        </div>

    </div>
</template>

<script setup>
import { NNumberAnimation, NStatistic } from "naive-ui"
import LegendVue from './Legend.vue';
import { useCounter } from '@vueuse/core'
import HistogramVue from './Charts/Histogram.vue';
import { computed, ref, watchEffect } from 'vue';
import { node_stat } from "../../algorithms/statistics";
import _ from "lodash"

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
</script>