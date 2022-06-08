<template>
    <svg width="100%" height="100%" :viewBox="`${viewBox.x0} ${viewBox.y0} ${viewBox.width} ${viewBox.height}`" ref="el"
        class="select-none" preserveAspectRatio="none" @mousedown="handleBrushStart" @mousemove="handleBrush"
        @mouseup="handleBrushEnd">
        <g class="text-[10px]" ref="yaxis" text-anchor="end" :transform="`translate(${yaxis_width}, 0)`">
            <text class="fill-gray-600" v-for="v in scaleHeight.ticks(3)" x="0" :y="y(scaleHeight(v))" dy="2px">
                {{ format("~s")(v) }}
            </text>
        </g>
        <g>
            <line v-for="v in scaleHeight.ticks(3)" :x1="histogramBox.x0" :x2="histogramBox.x0 + histogramBox.width"
                :y1="y(scaleHeight(v))" :y2="y(scaleHeight(v))" class="stroke-gray-300" />
        </g>
        <g>
            <rect class="transition-all duration-1000" v-for="([xi, yi]) in _.zip(props.x, heights)" :x="x(xi)"
                :y="y(yi)" :width="histogramBox.width / heights.length" :height="yi" fill="#a5b8d7" />
        </g>

        <path class="stroke-[#4e73b0] fill-none" :d="lineD" />
        <OnClickOutside @trigger="">
            <rect class="fill-gray-400 opacity-50" v-if="brush.on" :x="Math.min(x(brush.x0), x(brush.x1))"
                :y="histogramBox.y0" :width="Math.abs(x(brush.x1) - x(brush.x0))" :height="histogramBox.height" />
        </OnClickOutside>


    </svg>
</template>

<script setup>
import { scaleLinear, scaleLog, range, line, format } from "d3";
import { computed, reactive, ref } from "vue";
import { useElementSize, useMounted, TransitionPresets, reactiveComputed, useElementBounding } from "@vueuse/core";
import { OnClickOutside } from '@vueuse/components'
import { kernelDensityEstimation } from 'simple-statistics'
import _ from "lodash";
const props = defineProps(["x", "y"]);
const isMounted = useMounted();
const el = ref();
const yaxis = ref();
const { width, height } = useElementBounding(el)
const { width: yaxis_width } = useElementSize(yaxis);
const viewBox = reactiveComputed(() => ({
    x0: 0,
    y0: 0,
    width: width.value,
    height: height.value
}))

const p = 2;
const histogramBox = reactiveComputed(() => ({
    x0: yaxis_width.value + p,
    y0: 10,
    width: width.value - 10 - p - yaxis_width.value,
    height: height.value - 10 * 2
}))

let brush = reactive({
    on: false,
    show: false,
    x0: 0,
    x1: 0
});

function handleBrushStart(e) {
    brush.on = true;
    brush.show = true;
    console.log(e);
    brush.x0 = x.value.invert(e.offsetX);
}

function handleBrush(e) {
    brush.x1 = x.value.invert(e.offsetX)
}

function handleBrushEnd(e) {
    brush.on = false;
}

const scaleHeight = computed(() => {
    const max = Math.max(...props.y)
    const min = Math.min(...props.y)
    return scaleLog().domain([1, max + 1]).range([0, histogramBox.height]);
})

const y = computed(() => {
    return scaleLinear()
        .domain([0, histogramBox.height])
        .range([histogramBox.height + histogramBox.y0, histogramBox.y0])
})

const x = computed(() => {
    const l = props.x[props.x.length - 1];
    return scaleLinear().domain([0, l]).range([histogramBox.x0, histogramBox.x0 + histogramBox.width - (histogramBox.width / heights.value.length)]);
})

const heights = computed(() => {
    if (!isMounted.value) {
        return props.y.map(() => 0)
    }
    return props.y.map((n) => scaleHeight.value(n + 1));
})
const kde = computed(() => {
    return kernelDensityEstimation(heights.value, "gaussian", 3);
})
const lineD = computed(() => {
    if (heights.value.length < 2) return ""
    const scale = scaleLog().domain([0.001, 1]).range([0, histogramBox.height])
    return line()(range(0, heights.value.length, .1).map(i => [x.value(i), y.value(scale(kde.value(i)))]));
})

</script>