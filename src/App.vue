<script setup>
import { ref } from "vue";
import { NConfigProvider, NScrollbar } from "naive-ui";
import { viewStore } from "./store/view";

import ElementContainerVue from "./components/UI/ElementContainer.vue";

import MenuBar from "./components/Menu/MenuBar.vue";
import NodeLink from "./components/Graph/NodeLink.vue";
import Matrix from "./components/Graph/Matrix.vue";
import Panel from "./components/Panel/Panel.vue";
import Subgraph from "./components/Motif/Subgraph.vue";

import data from "./assets/graph.json";

import color from "./config/colormap.js"

const view_store = viewStore();

const subgraphs = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
]

</script>

<template>
  <n-config-provider>
    <div id="container">
      <header>
        <MenuBar w="1/1" class="border-b border-grey-400" v-model:nodeLinkOn="view_store.nodeLinkOn"
          v-model:matrixOn="view_store.matrixOn" v-model:brushOn="view_store.brushOn" />
      </header>
      <div class="flex flex-1 gap-2" px="4" py="2">
        <Transition name="flex-left">
          <div v-if="view_store.nodeLinkOn" class="flex-3">
            <ElementContainerVue title="node-link" h="1/1">
              <NodeLink 
                h="1/1" 
                :color-map="color"
                :nodes="data.nodes" :links="data.links" 
                :brush="view_store.brushOn" 
                :size="i=>i.betweenness"
                :size-range="[5, 10]"
              />
            </ElementContainerVue>
          </div>
        </Transition>


        <Transition name="flex-left">
          <div v-if="view_store.matrixOn" class="flex-3">
            <ElementContainerVue title="node-link" h="1/1">
              <Matrix h="1/1" />
            </ElementContainerVue>
          </div>
        </Transition>
        <div class="flex-1">
          <ElementContainerVue title="node-link" h="1/1">
            <Panel h="1/1" />
          </ElementContainerVue>
        </div>
      </div>
      <div w="1/1" h="200px" px="4">
        <ElementContainerVue bg="white" title="Motif" h="1/1" px="5" py="2">
          <div
            class="flex flex-row flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400  scrollbar-thumb-rounded-full gap-2"
            h="1/1" w="1/1">
            <div class="rounded border" v-for="i in subgraphs" h="1/1">
              <Subgraph class="min-w-200px" h="1/1" />
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
.flex-left-leave-active{
  @apply transition-all duration-500;
}

.flex-left-enter-from,
.flex-left-leave-to{
  flex: 0;
  @apply opacity-0;
}
</style>

<style>


body {
  @apply bg-gray-100;
}
</style>