<template>
    <node-link-vue 
        :nodes="nodes" :links="links" 
        :brush="false" :interactive="false" :lite="true"
        :color-map="colorMap" 
        :size-range="[5, 10]" :size="i => i.betweenness"

    />


</template>
<script setup>
import NodeLinkVue from '../Graph/NodeLink.vue';
import { computed, unref } from 'vue';
import getSubgraph from "ngraph.subgraph";
import createGraph from 'ngraph.graph';
import colorMap from '../../config/colormap';

const props = defineProps({
    nodes: {
        default: new Map()
    },
    og: {
        default: createGraph()
    }
})
const sg = computed(() => {
    return getSubgraph(new Set(props.nodes.keys()), unref(props.og));
})
const nodes = computed(() => {
    const res = [];
    sg.value.forEachNode(n => {
        res.push(n.data)
    });
    return res;
})
const links = computed(() => {
    const res = [];
    sg.value.forEachLink(n => {
        res.push({
            ...n,
            source: n.fromId,
            target: n.toId
        }
        )
    });
    return res;
})
</script>