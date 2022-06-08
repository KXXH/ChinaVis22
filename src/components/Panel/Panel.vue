<template>
    <div class="flex flex-col">
        <legend-vue />
        <div class="border m-2" h="100px">
            <histogram-vue :x="Array.from(stats.count.byDegree.keys()??[])" :y="histData" />
        </div>


    </div>
</template>

<script setup>
import LegendVue from './Legend.vue';
import HistogramVue from './Charts/Histogram.vue';
import { computed, ref } from 'vue';
import { node_stat } from "../../algorithms/statistics";
import _ from "lodash"

const props = defineProps(["graph"]);
const g = computed(() => props.graph);
const stats = computed(() => {
    return node_stat(g.value);
})
const histData = computed(() => {
    return _(stats.value.count.byDegree).toPairs().sortBy(i => i[0]).map(i => i[1].length).value()
});
const histData1 = computed(() => {
    return _(stats.value.count.byIndustry).toPairs().sortBy(i => i[0]).map(i => i[1]).value()
});
const histData2 = computed(() => {
    return _(stats.value.count.byType).toPairs().sortBy(i => i[0]).map(i => i[1]).value()
});

</script>