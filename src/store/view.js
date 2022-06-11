import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const viewStore = defineStore("view", {
    state: ()=>({
        nodeLinkOn:true,
        matrixOn:false,
        brushOn:false,
        selectedNodes: new Map(),
        communityLevel: 0,
        hoverNode:null,
        collections:[]
    })
})