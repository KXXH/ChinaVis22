import { defineStore } from 'pinia'

export const viewStore = defineStore("view", {
    state: ()=>({
        nodeLinkOn:true,
        matrixOn:true,
        brushOn:false,
        selectedNodes: new Map()
    })
})