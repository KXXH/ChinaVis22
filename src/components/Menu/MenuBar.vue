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
        <menu-item-vue dropdown :dropdown-option="subgraphOpt">Subgraph</menu-item-vue>
        <menu-item-vue dropdown :dropdown-option="selectOpt" :on-select="handleSelect">Select</menu-item-vue>
        <menu-item-vue dropdown :dropdown-option="viewOpt">View</menu-item-vue>

        <n-input placeholder="Search" class="!w-200px flex-2" size="small" type="text" my="2px" :theme-overrides='{
            "borderFocus": "0px",
            "boxShadowFocus": "",
            "color": "#dbeafe"
        }'>
            <template #suffix>
                <n-icon>
                    <IconSearch />
                </n-icon>
            </template>
        </n-input>
        <div class="flex-1"></div>
    </div>
</template>

<script setup lang="jsx">
import { NInput, NIcon, NInputGroup, NSwitch, NSpace } from "naive-ui";
import MenuItemVue from "./MenuItem.vue";
import IconSearch from "~icons/fa/search";
import IconOK from "~icons/el/ok-sign";
import { ref } from "vue";
import { useVModel } from '@vueuse/core'

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
    }
})
const emits = defineEmits([
    "update:nodeLinkOn",
    "update:matrixOn",
    "update:brushOn",
    "neighbors"
])

const isNLOn = useVModel(props, "nodeLinkOn", emits);
const isMtxOn = useVModel(props, "matrixOn", emits);
const isBrushOn = useVModel(props, "brushOn", emits);

const subgraphOpt = [
    {
        label: "divide",
        key: "devide",
        children: [
            {
                label: "from selected nodes"
            },
            {
                label: "from community detection"
            }
        ]
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
const viewOpt = [
    {
        label: "simplify graph",
        key: "simplify"
    },
    {
        label: "maximum shown nodes",
        key: "maxNodes"
    },
    {
        label: "layer",
        key: "layer",
        children: [
            {
                label: "community detection",
                key: "community",
                children: [
                    {
                        label: "CW Algorithm",
                        key: "cw"
                    },
                    {
                        label: "Louvain Algorithm",
                        key: "louvain"
                    }
                ]
            },
            {
                label: "spatial clustering",
                key: "clustering",
                children: [
                    {
                        label: "DBSCAN Algorithm",
                        key: "dbscan"
                    }
                ]
            }
        ]
    }
];


</script>

<style scoped>
.menu-item-warp {
    @apply flex items-center gap-2;
}
</style>