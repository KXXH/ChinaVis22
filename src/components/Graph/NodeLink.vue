<template>
    <div ref="el" />
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from "vue";
import * as PIXI from 'pixi.js';
import { SVGPathNode, SVGScene } from "@pixi-essentials/svg";
import { Viewport } from 'pixi-viewport'
import { useElementBounding, watchOnce, TransitionPresets, useVModel } from '@vueuse/core';
import _ from "lodash";
import * as d3 from "d3";
import { useMagicKeys, logicOr } from '@vueuse/core'

import jDBSCAN from "jdbscan";
// import createGraph from "ngraph.graph";
import createGraph from "../../algorithms/createGraph.js";
import createWhisper from "ngraph.cw";
import detectClusters from "ngraph.louvain";
import useBrush from "./utils/brush.js";
import useForce from "./utils/force.js";

import { useTransition, transitionContainer } from "./utils/transition";

import { viewStore } from "../../store/view.js";
// import useNGForce from "./utils/ngraph-force.js";

const view = viewStore();

// basic settings

// node line width
const NodeLineWidth = 1.5;
// hull line width
const HullLineWidth = 3;
// black industry color
const BlackIndustryColor = 0xfb7185;


// setup layer opacity
const hullOpacity = d3.scaleLog()
    .domain([0.5, 2])
    .range([0.8, 0.1])
    .clamp(true);

const nodeLinkOpacity = d3.scalePow()
    .domain([0.0001, 2])
    .range([0.2, 1])
    .clamp(true);


//component setup
const el = ref();
const props = defineProps({
    nodes: {
        type: Array,
        default: []
    },
    links: {
        type: Array,
        default: []
    },
    colorMap: {
        type: Function,
        default: () => 0xff0000
    },
    size: {
        type: Function,
        default: () => 1
    },
    sizeRange: {
        type: Array
    },
    brush: Boolean,
    selectedNodes: {
        type: Map,
        default: () => new Map()
    },
    interactive:{
        type:Boolean,
        default:true
    },
    lite:{
        type:Boolean,
        default:false
    }
});
const emits = defineEmits(["update:selectedNodes", "layoutDone"]);
// const width = 400;
// const height = 400;
const { width, height } = useElementBounding(el);

// build graph
const graph = createGraph(props.nodes, props.links, n => n.id, l => l.source, l => l.target);

// pixi setup
const app = new PIXI.Application({
    width, height, backgroundColor: 0xffffff, resolution: window.devicePixelRatio || 1,
    antialias: true,
    autoDensity: true,
    forceCanvas: props.lite,
    resolution: window.devicePixelRatio
});

const c = d3.arc()({
    innerRadius: 0,
    outerRadius: 100,
    startAngle: 0,
    endAngle: Math.PI / 2
})
const svg = document.createElement("svg");
svg.setAttribute("viewBox", "0 0 100 100");
const pathNode = document.createElement("path");
pathNode.setAttribute("d", "M10 10 H 90 V 90 H 10 L 10 10");
pathNode.setAttribute("fill", "black");
// svg.append(pathNode)
(new SVGPathNode(pathNode)).render(app.renderer);
// console.log(svg)
// const path = new SVGScene(svg, new SVGSceneContext());



// viewport zoom and drag
const container = new Viewport({
    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})
// container.addChild(path)
const container2 = new Viewport({
    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})
const transition = new useTransition().container(app.stage);
// container2.alpha = 0
container
    .drag()
    .pinch()
    .wheel({
        smooth: 10,
        percent: 0.5
    })
    .decelerate()
// const container = new PIXI.Container();
let dragging = false;
container.on("drag-start", () => dragging = true);
container.on("drag-end", () => dragging = false);
app.stage.addChild(container);


const rect = new PIXI.Graphics()
rect.beginFill();
rect.drawRect(50, 50, 100, 100);
rect.endFill();
container2.addChild(rect);
// container2.zoomPercent(d);
const { t } = useMagicKeys();
let f = true;
const tc1 = new transitionContainer().container(container);
const tc2 = new transitionContainer().container(container2);
watch(t, () => {
    if (t.value || transition.transitionOn) return;
    if (f) {
        transition.transition(
            tc1, tc2
        )
    }
    else {
        transition.transition(
            tc2, tc1
        )
    }
    f = !f;
})

// three layers: node-link layer, circle layer, selection layer
// create layer
const nodeLinkLayer = new PIXI.Container();
nodeLinkLayer.alpha = nodeLinkOpacity(1);
const hullLayer = new PIXI.Container();
hullLayer.alpha = hullOpacity(1);

container.addChild(nodeLinkLayer);
container.addChild(hullLayer);


// brush
const { ctrl, alt } = useMagicKeys();  // ctrl: add nodes; alt: remove nodes

const selectedNodes = useVModel(props, "selectedNodes", emits);

// brush
let nodes = props.nodes.map(item => {
    let node = {
        ...item
    };
    // node.size = props.size(node)
    return node;
});

const size = computed(() => {
    return (n) => {
        if (n == null) return props.sizeRange[0];
        return d3.scaleLinear().domain([
            _(props.nodes).map(props.size).min(),
            _(props.nodes).map(props.size).max()
        ]).range(props.sizeRange)(n)
    }
    // return d3.scaleLinear().domain([
    //     _(props.nodes).map(props.size).min(),
    //     _(props.nodes).map(props.size).max()
    // ]).range(props.sizeRange)
})

function drawBrushNode(node) {
    node.selectGfx.lineStyle(NodeLineWidth, 0xFFFFFF);
    const level = node.level??3;
    const alpha = d3.scaleOrdinal()
        .domain([3, 2, 1, 0])
        .range([0x0000ff, 0x696aff, 0xb5b6fe, 0xeff1fd])
        // .range([0x000000, 0x0000ff, 0x00ff00, 0xff0000])
    // console.log("alpha", alpha(level))
    node.selectGfx.beginFill(alpha(level));
    node.selectGfx.drawCircle(0, 0, size.value(props.size(node)));
    node.selectGfx.position = new PIXI.Point(node.x, node.y)
}

container.on("mousedown", ()=>{
    if(!props.interactive) return;
    if(view.hoverNode?.lock){
        view.hoverNode = null;
    }
})

function drawForceNode(node, color) {
    const gfx = node.gfx;
    gfx.clear();
    gfx.interactive = props.interactive;
    gfx.on("mouseover", () => {
        if(view.hoverNode?.lock){
            return;
        }
        view.hoverNode = {
            x: container.transform.worldTransform.apply(new PIXI.Point(node.x, node.y)).x,
            y: container.transform.worldTransform.apply(new PIXI.Point(node.x, node.y)).y,
            lock:false,
            node: node
        }
    });
    gfx.on("click", ()=>{
        view.hoverNode.lock=true;
    })
    gfx.on("mouseout", ()=>{
        if(view.hoverNode==null||view.hoverNode.lock) return;
        view.hoverNode = null;
    })
    if (node.industry != "[]") {
        gfx.lineStyle(NodeLineWidth, 0xfb7185);
    }
    else {
        gfx.lineStyle(NodeLineWidth, 0xFFFFFF);
    }
    gfx.beginFill(color ?? props.colorMap(node));
    gfx.drawCircle(0, 0, size.value(props.size(node)));
}

const brush = new useBrush()
    .app(app)
    .container(container)
    .nodes(nodes)
    .r(n => size.value(props.size(n)))
    // .on("brushstart.1",()=>console.log("brushstart", brush))
    .on("enter.clear_level", n=>{
        n.level = null;
    })
    .on("exit.clear", n => {
        n.selectGfx.clear();
    })
    .on("forceEnter.draw", drawBrushNode)
    .on("forceExit.clear", n=>{
        n.selectGfx.clear()
    })

    .on("brushstart.change", () => {
        emits("update:selectedNodes", brush.selection)
    })
    .on(
        "brush.change",
        () => {
            emits("update:selectedNodes", brush.selection)
            brush.selection.forEach(drawBrushNode);
        }
    )
    .stop();

// watch(()=>view.selectedNodes, (newVal, oldVal)=>{
//     oldVal.forEach(n=>{
//         n.selectGfx.clear();
//     });
// })

watch(() => props.brush, () => {
    if (props.brush) {
        container.plugins.pause('drag')
        brush.start();
    }
    else {
        container.plugins.resume('drag')
        brush.stop();
    }
})

let lastPoint = null;
// container.on("mousemove", (e)=>{
//     if(lastPoint!=null){
//         drawForceNode(lastPoint);
//         lastPoint = null;
//     }
//     let { x, y } = e.data.global;
//     let {x:tx, y:ty} = container.transform.worldTransform.applyInverse(new PIXI.Point(x,y))
//     const node = brush.find(tx, ty, props.sizeRange[1]);
//     if(node==null) {
//         view.hoverNode = null;
//         return;
//     }
//     drawForceNode(node, 0x00ff00)
//     lastPoint = node;
//     view.hoverNode = {
//         node:node,
//         x: container.transform.worldTransform.apply(new PIXI.Point(node.x, node.y)).x,
//         y: container.transform.worldTransform.apply(new PIXI.Point(node.x, node.y)).y
//     };
// })

watch(alt, v => brush.alt(v));
watch(ctrl, v => brush.ctrl(v))

function forceExit(nodes){
    brush.unselect(nodes);
}

function forceSelect(nodes) {
    brush.select(nodes);
    return nodes;
}

let links = props.links.map(item => {
    let link = {
        ...item
    };
    return link;
})


const force = new useForce()
    .container(nodeLinkLayer)
    .nodes(nodes)
    .links(links)
    .drawCircle((gfx, node) => {
        drawForceNode(node);
    })
    .radius(n => size.value(props.size(n)))
    .on("tick.select", () => {
        brush.selection.forEach(n => {
            n.selectGfx.clear()
            drawForceNode(n);
        });
    })
    .on("end.cluster", handleForceStop)
    .on("end.quadtree", () => brush.quadtree(true))
    .on("end.emit", () => emits("layoutDone", { nodes, links }));


watch(() => props.colorMap, () => {
    nodes.forEach(n => drawForceNode(n))
})

function hullCenter(points) {
    return d3.polygonCentroid(points);
}
function minHullCircle(center, points) {
    let r = 0;
    for (const point of points) {
        r = Math.max(Math.sqrt((point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2), r);
    }
    return r;
}

function cluster_detect(nodes, links) {
    var whisper = createWhisper(graph);
    var requiredChangeRate = 0; // 0 is complete convergence
    while (whisper.getChangeRate() > requiredChangeRate) {
        whisper.step();
    }
    return nodes.map(n => whisper.getClass(n.id));
}

function handleForceStop() {

    // dbscan setup
    var dbscanner = jDBSCAN()
        .eps(60)
        .minPts(10)
        .distance('EUCLIDEAN')
        .data(nodes);
    var point_assignment_result = dbscanner();
    // var point_assignment_result = cluster_detect(nodes, links);
    // var cluster_centers = dbscanner.getClusters();
    // console.log(point_assignment_result, cluster_centers)
    // nodes.forEach((node, i) => {
    //     node.gfx.clear();
    //     node.gfx.lineStyle(1.5, 0xFFFFFF);
    //     node.gfx.beginFill(randomColor(point_assignment_result[i]));
    //     node.gfx.drawCircle(0, 0, calSize(node.size));
    //     node.gfx.position = new PIXI.Point(node.x, node.y);
    // })

    // group nodes by cluster id
    let clusters = _(nodes).map((node, i) => {
        node.class = point_assignment_result[i];
        return node;
    }).groupBy(n => n.class).value();

    // draw hull
    for (const cluster_id in clusters) {
        if (cluster_id == 0) continue;
        // caculate polygon hull
        const hull = d3.polygonHull(clusters[cluster_id].map(({ x, y }) => ([x, y])))
        if (hull == null) continue;
        // get polygon center
        const center = hullCenter(hull);
        // get the minimum outer circle
        const r = minHullCircle(center, hull);
        // each cluster is a container
        const group = new PIXI.Container();
        const gfx = new PIXI.Graphics();
        // gfx.beginFill(randomColor(cluster_id));

        clusters[cluster_id].gfx = group;
        clusters[cluster_id].hull = hull;
        clusters[cluster_id].circle = {
            center, r
        };
        clusters[cluster_id].count = _(clusters[cluster_id]).groupBy(i => i.type).mapValues(i => i.length).value();
        const total = _(clusters[cluster_id].count).values().sum();
        clusters[cluster_id].industry = clusters[cluster_id].filter(i => i.industry != '[]').length;
        // gfx.lineStyle(3, 0x4b5563);
        gfx.beginFill(0xe5e7eb);

        gfx.drawCircle(center[0], center[1], r);
        gfx.endFill();

        let startAngle = 0;
        for (const type in clusters[cluster_id].count) {
            gfx.lineStyle({
                width: Math.min(15, r),
                color: props.colorMap({ type }),
                join: PIXI.LINE_JOIN.ROUND
            });
            const dAngle = 2 * Math.PI * (clusters[cluster_id].count[type] / total)
            gfx.arc(...center, r, startAngle, startAngle + dAngle);
            startAngle += dAngle;
        }

        gfx.interactive = true;
        gfx.on("pointerup", e => {
            if (dragging || brush.brushing) return;


            const k = container.findFit(2 * r + 10, 2 * r + 10);
            container.animate({
                position: new PIXI.Point(center[0], center[1]),
                scale: k,
                callbackOnComplete: () => {
                    onZoom();
                    container.setChildIndex(hullLayer, 0);
                },
                ease: "easeInOutCubic"
            });
        })

        const gfx2 = new PIXI.Graphics()
        gfx2.lineStyle(0);
        gfx2.beginFill(BlackIndustryColor, 0.8);

        gfx2.drawCircle(center[0], center[1], r * (clusters[cluster_id].industry / clusters[cluster_id].length));
        gfx2.endFill();
        // gfx2.filters = [new PIXI.filters.BlurFilter()]

        group.addChild(gfx);
        group.addChild(gfx2);
        // hullLayer.addChild(group);
    }
}

// change layer opacity when zoom
const onZoom = () => {
    if(props.lite){
        return;
    }
    const k = container.transform.worldTransform.a;
    hullLayer.alpha = hullOpacity(k);
    nodeLinkLayer.alpha = nodeLinkOpacity(k);
    if (hullLayer.alpha == hullOpacity.range()[1]) {
        container.setChildIndex(hullLayer, 0);
    }
    else {
        container.setChildIndex(hullLayer, 1);
    }
    force.scale(k);
}

container.on("zoomed", onZoom)

// initial drawing
function initDraw() {
    // create canvas
    el.value.appendChild(app.view);
    app.resizeTo = el.value;
    const { height, width } = app.screen;
    container.resize(width, height)
    container2.resize(width, height)
    // simulation initial data
    force.width(width).height(height);
    force.simulation.alphaMin(0.01);
    force.start();
}

onMounted(() => {
    initDraw();
});

watch([() => props.nodes, () => props.links], () => {
    hullLayer.removeChildren(0);


    const addedNodes = _.differenceBy(props.nodes, force.nodes(), n => n.id);
    const deledNodes = _.differenceBy(force.nodes(), props.nodes, n => n.id);
    addedNodes.forEach(n => force.nodes().push(n));
    force.nodes(force.nodes());
    deledNodes.forEach(n => n.gfx.clear());
    _.pullAll(force.nodes(), deledNodes);


    const addedLinks = _.differenceBy(props.links, force.links(), l => l.source + l.target)
    const deledLinks = _.differenceBy(force.links(), props.links, l => l.source + l.target)
    addedLinks.forEach(l => force.links().push(l));
    const t = _.pullAll(force.links(), deledLinks);
    force.links(t)
    force.simulation.alpha(0.3).restart();
})

defineExpose({ forceSelect, forceExit })

onBeforeUnmount(() => {
    app.destroy();
})
</script>