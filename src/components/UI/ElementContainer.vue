<template>
    <div class="flex flex-col border shadow-md">
        <div class="flex-1" bg="white">
            <slot></slot>
        </div>
    </div>

</template>

<script setup>
const props=defineProps({
    title: String
})

</script>