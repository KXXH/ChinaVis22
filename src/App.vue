<script setup>
import { ref, watch, computed, shallowRef, shallowReadonly, shallowReactive, toRaw } from "vue";
import { useMagicKeys, useMouse } from '@vueuse/core'
import { NConfigProvider, NScrollbar } from "naive-ui";
import { viewStore } from "./store/view";
import getSubgraph from "ngraph.subgraph"


import ElementContainerVue from "./components/UI/ElementContainer.vue";

import MenuBar from "./components/Menu/MenuBar.vue";
import NodeLink from "./components/Graph/NodeLink.vue";
import Matrix from "./components/Graph/Matrix.vue";
import Panel from "./components/Panel/Panel.vue";
import Subgraph from "./components/Motif/Subgraph.vue";

import data from "./assets/graph.json";

import color from "./config/colormap.js"
import ColorGenerator from "./algorithms/colorGenerator";
import createGraph from "./algorithms/createGraph";
import neighbors from "./algorithms/neighbors";
import { extend_graph } from "./algorithms/neighbors";
import { node_stat } from "./algorithms/statistics";
import { simplify } from './algorithms/simplify';
import { louvain } from "./algorithms/community";
import TooltipVue from "./components/Graph/Tooltip.vue";

import coarsen from "ngraph.coarsen";

import _ from "lodash";
import communityColor from "./utils/communityColor";

// const colorFn = ref(color);

const { x: mouseX, y: mouseY } = useMouse();

document.onkeydown = (e) => {
  if (e.ctrlKey || e.altKey) {
    e.preventDefault();

  }
}

const rdata = shallowReactive({
  links: _.clone(data.links),
  nodes: _.clone(data.nodes),
});

const view_store = viewStore();
const nodelinkGraph = ref(null);
const subgraphs = [
  1, 2, 3,
]

let g = shallowRef(createGraph(data.nodes, data.links, n => n.id, l => l.source, l => l.target));
function updateG(nodes, links) {
  console.log("update g")
  // g.value = createGraph(nodes, links, n => n.id, l => l.source.id, l => l.target.id)
}

function handleNeighbor() {
  view_store.selectedNodes = nodelinkGraph.value.forceSelect(neighbors(g.value, view_store.selectedNodes))
}

function handlePanelSelect(v) {
  view_store.selectedNodes = nodelinkGraph.value.forceSelect(v)
}

function handleSearch(v){
  view_store.selectedNodes = nodelinkGraph.value.forceSelect(v);
}

function handleAddCollection(){
  if(view_store.selectedNodes.size==0) return;
  view_store.collections.push({
    nodes:view_store.selectedNodes,
    og: _.clone(g)
  })
}
function handleAddCollectionByTooltip(){
  const sg = view_store.hoverNode?.node?.subgraph;
  const nodes = new Map();
  sg.forEachNode((n)=>{
    nodes.set(n.id,n);
  });
  view_store.collections.push({
    nodes,
    og:_.clone(g)
  })
}
function handleReset(){
  rdata.nodes = data.nodes;
  rdata.links = data.links;
}
function handleClear(){
  rdata.nodes = [];
  rdata.links = [];
}
const { Ctrl_E, Ctrl_R } = useMagicKeys();
watch(Ctrl_E, v => {
  if (v) {
    handleNeighbor()
  }
})
watch(Ctrl_R, v => {
  if (v) {
    view_store.selectedNodes = nodelinkGraph.value.forceSelect(extend_graph(g.value, view_store.selectedNodes))
  }
})

const sg = computed(() => {
  if (!view_store.selectedNodes.size) {
    return _.clone(g.value);
  }
  return getSubgraph(new Set(view_store.selectedNodes.keys()), g.value);
})

const cc = new communityColor(_.clone(g.value));
let simplifyFlag = false;
let simplifyLevel = 0;
function handleSimplify() {
  // if(simplifyFlag){
  //   simplifyFlag = false;
  //   rdata.nodes = data.nodes;
  //   rdata.links = data.links;
  //   return;
  // }
  // simplifyFlag = true;
  // const g = createGraph(rdata.nodes, rdata.links, n => n.id, l => l.source, l => l.target);
  // let sg = simplify(g);
  let sg = cc.simplify(++simplifyLevel);

  // sg = simplify(sg);
  const ns = [];
  const ls = [];
  sg.forEachNode(n => {
    n.subgraph = getSubgraph(n.data.leaf, g.value);
    ns.push(n)
  });
  sg.forEachLink(l => {
    ls.push({
      source: l.fromId,
      target: l.toId
    });
  });
  rdata.nodes = ns;
  rdata.links = ls;
}

// function handleCommunity(){
//   let c = louvain(gg[gg.length-1]);
//   gg.push(coarsen(gg[gg.length-1], c))
//   clusters.push(c)
//   colorFn.value = (n)=>{
//     console.log(n.id, getClass(0, n.id))
//     return cg.randomColor(getClass(0, n.id))
//   }

// }
const colorFn = computed(() => {
  return cc.colorMap(view_store.communityLevel);
})

watch(g, ()=>{
  console.log("g changed!")
})
</script>

<template>
  <n-config-provider>
    <div id="container">
      <tooltip-vue 
        class="absolute w-max h-min" 
        :style="{
          top: `${view_store?.hoverNode?.y-10}px`,
          left: `${view_store?.hoverNode?.x+20}px`,
        }" 
        @add-collection="handleAddCollectionByTooltip"
      />
      <header>
        <MenuBar w="1/1" class="border-b border-grey-400"       
          v-model:nodeLinkOn="view_store.nodeLinkOn"
          v-model:matrixOn="view_store.matrixOn" 
          v-model:brushOn="view_store.brushOn" 
          @neighbors="handleNeighbor"
          @simplify="handleSimplify"
          @search="handleSearch"
          @add-subgraph="handleAddCollection"
          @clear="handleClear"
          @reset="handleReset"
          :graph="g" 
        />
      </header>
      <div class="flex flex-1 gap-2" px="4" py="2">
        <Transition name="flex-left">
          <div v-if="view_store.nodeLinkOn" class="flex-4">
            <ElementContainerVue title="node-link" h="1/1">
              <NodeLink h="1/1" :color-map="colorFn" :nodes="rdata.nodes" :links="rdata.links"
                :brush="view_store.brushOn" :size="i => i.betweenness" :size-range="[5, 10]"
                v-model:selected-nodes="view_store.selectedNodes" @layout-done="updateG($event.nodes, $event.links)"
                ref="nodelinkGraph" />

            </ElementContainerVue>
          </div>
        </Transition>


        <Transition name="flex-left">
          <div v-if="view_store.matrixOn" class="flex-4">
            <ElementContainerVue title="node-link" h="1/1">
              <Matrix h="1/1" :graph="g"/>
            </ElementContainerVue>
          </div>
        </Transition>
        <div class="w-300px">
          <ElementContainerVue title="node-link" h="1/1">
            <Panel h="1/1" :graph="sg" @select="handlePanelSelect" />
          </ElementContainerVue>
        </div>
      </div>
      <div w="1/1" h="200px" px="4">
        <ElementContainerVue bg="white" title="Motif" h="1/1" px="5" py="2">
          <div
            class="flex flex-row flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400  scrollbar-thumb-rounded-full gap-2"
            h="1/1" w="1/1">
            <div class="rounded border" v-for="sg in view_store.collections" h="1/1">
              <Subgraph 
                class="min-w-200px" 
                h="1/1" 
                :og="sg.og"
                :nodes="sg.nodes"
              />
            </div>
          </div>
        </ElementContainerVue>
      </div>
    </div>
  </n-config-provider>

</template>


<style scoped>
#container {
  @apply flex h-98vh flex-col;
}

.flex-left-enter-active,
.flex-left-leave-active {
  @apply transition-all duration-500;
}

.flex-left-enter-from,
.flex-left-leave-to {
  flex: 0;
  @apply opacity-0;
}
</style>

<style>
body {
  @apply bg-gray-100;
}
</style>