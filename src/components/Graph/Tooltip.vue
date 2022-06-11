<template>
    <n-card v-if="view.hoverNode!=null">
        {{_.truncate(view.hoverNode.node.id, {
            length: 20
        })}}
        <node-link-vue 
            class="h-300px w-300px"
            v-if="view.hoverNode?.node?.subgraph"
            :nodes="nodes" :links="links"
            :brush="false"  :color-map="color"
            :size="i => i.betweenness" :size-range="[5, 10]"
            :interactive="false"
        />
    </n-card>

</template>

<script setup>
import { NCard } from 'naive-ui';
import { watch } from 'vue';
import { viewStore } from '../../store/view';
import { useMouse } from '@vueuse/core';
import NodeLinkVue from './NodeLink.vue';
import _ from "lodash";
import { computed } from '@vue/reactivity';
import color from "../../config/colormap";

const {x: mouseX, y: mouseY} = useMouse();

const view = viewStore();
// watch(()=>view.hoverNode, ()=>{
//     console.log(view.hoverNode, mouseX.value, mouseY.value)
// })
const nodes = computed(()=>{
    const res = [];
    const sg = view.hoverNode?.node?.subgraph;
    if(sg==null) return [];
    sg.forEachNode(n=>{
        res.push({
            ...n.data,
            gfx: null,
            selectedGfx:null
        })
    })
    return res;
})

const links = computed(()=>{
    const res = [];
    const sg = view.hoverNode?.node?.subgraph;
    if(sg==null) return [];
    sg.forEachLink(n=>{
        console.log(n)
        res.push({
            ...n.data,
            source: n.fromId,
            target:n.toId
        })
    })
    return res;
})
</script>