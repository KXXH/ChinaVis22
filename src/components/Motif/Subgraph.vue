<template>
    <div class="flex">
        <node-link-vue 
            class="flex-1"
            :nodes="nodes" :links="links" 
            :brush="false" :interactive="false" :lite="true"
            :color-map="colorMap" 
            :size-range="[5, 10]" :size="i => i.betweenness"
        />
        <div class="flex flex-col h-full bg-gray-200">
            <n-button quaternary size="small" circle>
                <n-icon>
                    <IconAdd />
                </n-icon>
            </n-button>
            <n-button quaternary size="small" circle>
                <n-icon>
                    <IconRemove />
                </n-icon>
            </n-button>
        </div>

    </div>



</template>
<script setup>
import NodeLinkVue from '../Graph/NodeLink.vue';
import { computed, unref } from 'vue';
import getSubgraph from "ngraph.subgraph";
import createGraph from 'ngraph.graph';
import colorMap from '../../config/colormap';
import { NButton, NIcon } from 'naive-ui';
import IconAdd from "~icons/carbon/add";
import IconRemove from "~icons/carbon/trash-can"

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