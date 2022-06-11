<template>
    <n-modal v-model:show="show">
        <n-card>
            Current community level: 
            <n-input-number
                v-model:value="view.communityLevel"
                @update:value="emits('update:level', $event)"
            />
        </n-card>
    </n-modal>
</template>

<script setup>
import { NModal, NCard, NInputNumber } from 'naive-ui';
import { viewStore } from '../../store/view';
import { useVModel } from '@vueuse/core'
const view = viewStore();
const props = defineProps(["show"])
const emits = defineEmits(["update:show", "update:level"]);
const show = useVModel(props, "show", emits);
</script>