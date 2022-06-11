<template>
    <!-- <n-menu :value="null" dropdown-placement="bottom-start" :options="menuOpt" mode="horizontal"/> -->
    <div class="flex flex-row gap-2" bg="main-600" px="3" py="1">
        <menu-item-vue @click="isNLOn = !isNLOn">
            <div class="menu-item-warp">
                <span>Node-Links</span>
                <div display="inline-block" :class="{ '!bg-green-500': isNLOn }"
                    class="rounded-full transition duration-500" bg="orange-500" w="10px" h="10px"></div>
            </div>
        </menu-item-vue>
        <menu-item-vue @click="isMtxOn = !isMtxOn">
            <div class="menu-item-warp">
                <span>Matrix</span>
                <div display="inline-block" :class="{ '!bg-green-500': isMtxOn }"
                    class="rounded-full transition duration-500" bg="orange-500" w="10px" h="10px"></div>
            </div>
        </menu-item-vue>
        <menu-item-vue :on-select="handleSubgraph" dropdown :dropdown-option="subgraphOpt">Subgraph</menu-item-vue>
        <menu-item-vue dropdown :dropdown-option="selectOpt" :on-select="handleSelect">Select</menu-item-vue>
        <menu-item-vue dropdown :on-select="handleView" :dropdown-option="viewOpt">
            View

        </menu-item-vue>


        <n-auto-complete 
        v-model:value="searchVal" 
        placeholder="Search" 
        class="!w-200px flex-2" s
        ize="small" 
        type="text" 
        my="2px" 
        :theme-overrides='{
            "borderFocus": "0px",
            "boxShadowFocus": "",
            "color": "#dbeafe"
        }'
        :options="searchOpts"
        @select="onSearchDone"
        >
            <template #suffix>
                <n-icon>
                    <IconSearch />
                </n-icon>
            </template>
        </n-auto-complete>
        <div class="flex-1"></div>
        <community-setting-vue 
            class="max-w-400px" 
            v-model:show="show"
        />
    </div>
</template>

<script setup lang="jsx">
import CommunitySettingVue from "./CommunitySetting.vue";

import { NInput, NIcon, NAutoComplete, NSwitch, NSpace, NText } from "naive-ui";
import MenuItemVue from "./MenuItem.vue";
import IconSearch from "~icons/fa/search";
import IconOK from "~icons/el/ok-sign";
import { computed, ref } from "vue";
import { useVModel } from '@vueuse/core'
import { viewStore } from '../../store/view';

const view = viewStore();
const searchVal = ref("");
const searchOpts = computed(()=>{
    const res=[];
    props.graph.forEachNode((n)=>{
        if(n.id.startsWith(searchVal.value)){
            res.push({
                label: n.id,
                value: n
            })
        }
    })
    return res
})

const show = ref(false);

const props = defineProps({
    nodeLinkOn: {
        type: Boolean,
        default: true
    },
    matrixOn: {
        type: Boolean,
        default: true
    },
    brushOn: {
        type: Boolean,
        default: false
    },
    graph:{
        required: false
    }
})
const emits = defineEmits([
    "update:nodeLinkOn",
    "update:matrixOn",
    "update:brushOn",
    "neighbors",
    "simplify",
    "community",
    "search",
    "addSubgraph",
    "clear",
    "reset"
])

function onSearchDone(v){
    emits("search", new Map([[v.id, v]]));
}

const isNLOn = useVModel(props, "nodeLinkOn", emits);
const isMtxOn = useVModel(props, "matrixOn", emits);
const isBrushOn = useVModel(props, "brushOn", emits);

const subgraphOpt = [
    {
        label: "add to collection",
        key: "add",
    },
    {
        label: "merge",
        key: "merge",
        children: [
            {
                label: "from selected subgraphs"
            }
        ]
    }
];

function handleSelect(key) {
    switch (key) {
        case "brush": isBrushOn.value = !isBrushOn.value; break;
        case "neighbors": emits("neighbors"); break;
    }
}
function handleView(key) {
    switch (key) {
        case "simplify": emits("simplify"); break;
        case "communityd": show.value=true; break;
        case "type": emits("color-type"); break;
        case "clear": emits("clear"); break;
        case "reset": emits("reset"); break;
    }
}
function handleSubgraph(key) {
    switch (key) {
        case "community": emits("community"); break;
        case "add": emits("addSubgraph"); break;
        
    }
}
const selectOpt = [
    {
        label: () => (
            <NSpace justify="space-between" class="items-center">
                brush
                {isBrushOn.value ? <NIcon color="#10b981"><IconOK /></NIcon> : <div></div>}
            </NSpace>
        ),
        key: "brush",
    },
    {
        label: "select neighbors",
        key: "neighbors"
    },
    {
        label: "select 3-jump subgraph",
        key: "3jump"
    }
];
const viewOpt = computed(() => ([
    {
        label: "simplify graph",
        key: "simplify"
    },
    {
        label: "reset",
        key: "reset"
    },
    {
        label:"clear",
        key:"clear"
    },
    {
        label: "color encoding",
        key: "color",
        children: [
            {
                label: "Community detection",
                key: "communityd",
            },
            {
                label: "Type",
                key: "type"
            }
        ]
    },
    {
        label: "size encoding",
        key: "size",
        children: [
            {
                label: "Between",
                key: "between"
            },
            {
                label: "Pagerank",
                key: "pagerank"
            }
        ]
    },
]));


</script>

<style scoped>
.menu-item-warp {
    @apply flex items-center gap-2;
}
</style>