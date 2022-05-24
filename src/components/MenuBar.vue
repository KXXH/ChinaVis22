<template>
    <n-menu :value="null" dropdown-placement="bottom-start" :options="menuOpt" mode="horizontal"/>
</template>

<script setup lang="jsx">
import {NMenu, NSwitch} from "naive-ui";
const menuOpt=[
    {
        label:"Node-Links",
        key:"nodelinks"
    },
    {
        label:"Matrix",
        ksy:"matrix"
    },
    {
        label:"SubGraph",
        key:"subgraph",
        children:[
            {
                label:"divide",
                key:"devide",
                children:[
                    {
                        label:"from selected nodes"
                    },
                    {
                        label:"from community detection"
                    }
                ]
            },
            {
                label:"merge",
                key:"merge",
                children:[
                    {
                        label:"from selected subgraphs"
                    }
                ]
            }
        ]
    },
    {
        label:"Select",
        children:[
            {
                label:"brush",
                key:"brush",
                extra: ()=><n-switch />
            },
            {
                label:"select neighbors",
                key:"select neighbors"
            },
            {
                label:"select 3-jump subgraph",
                key:"3jump"
            }
        ]
    },
    {
        label:"View",
        children:[
            {
                label:"simplify graph",
                key:"simplify"
            },
            {
                label:"maximum shown nodes",
                key:"maxNodes"
            }
        ]
    },
]

</script>