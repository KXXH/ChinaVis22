<template>
    <div ref="el" />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import { useElementSize, watchOnce, useTransition, TransitionPresets } from '@vueuse/core';
import _ from "lodash";
import * as d3 from "d3";
import { useMagicKeys, logicOr } from '@vueuse/core'

import jDBSCAN from "jdbscan";
import createGraph from "ngraph.graph";
import createWhisper from "ngraph.cw";
import detectClusters from "ngraph.louvain";

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
    .range([0, 1])
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
    selectedNodes:{
        type: Set,
        default: ()=>new Set()
    }
});
const width = 400;
const height = 400;


// pixi setup
const app = new PIXI.Application({
    width, height, backgroundColor: 0xffffff, resolution: window.devicePixelRatio || 1,
    antialias: true
});
// viewport zoom and drag
const container = new Viewport({
    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})
container
    .drag()
    .pinch()
    .wheel({
        smooth: 10,
        percent: 0.5
    })
    .decelerate()
// const container = new PIXI.Container();
app.stage.addChild(container);

// two layers: node-link layer and circle layer
// create layer
const nodeLinkLayer = new PIXI.Container();
nodeLinkLayer.alpha = nodeLinkOpacity(1);
const hullLayer = new PIXI.Container();
hullLayer.alpha = hullOpacity(1);

container.addChild(nodeLinkLayer);
container.addChild(hullLayer);


// brush
const lastPos = {
    x: 0,
    y: 0
}
const { ctrl, alt } = useMagicKeys();  // ctrl: add nodes; alt: remove nodes
const magicKeysOn = logicOr(ctrl, alt);

const brushRect = new PIXI.Graphics();
app.stage.addChild(brushRect);
const selectedNodes = new Set();
const rectPos = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};

let brushing = false;
function handleBrushStart(e) {
    // if magic keys is not pressed, clear selection
    if (!magicKeysOn.value) {
        selectedNodes.clear();
    }
    rectPos.x = rectPos.y = 0;
    rectPos.w = rectPos.h = 0;
    lastPos.x = e.data.global.x;
    lastPos.y = e.data.global.y;
    brushing = true;
}
function handleBrushMove(e) {
    if (brushing) {
        let { x, y } = e.data.global;

        let newX = Math.min(lastPos.x, x);
        let newY = Math.min(lastPos.y, y);

        let w = Math.abs(x - lastPos.x);
        let h = Math.abs(y - lastPos.y);

        rectPos.x = newX;
        rectPos.y = newY;
        rectPos.w = w;
        rectPos.h = h;

        brushRect.clear();
        brushRect.lineStyle(1, 0x2563eb);
        brushRect.beginFill(0x60a5fa, 0.5);
        brushRect.drawRect(rectPos.x, rectPos.y, rectPos.w, rectPos.h);
    }
}
function handleBrushEnd(e) {
    rectPos.x = rectPos.y = 0;
    rectPos.w = rectPos.h = 0;
    brushing = false;
    brushRect.clear();
}
watch(() => props.brush, () => {
    if (props.brush) {
        container.plugins.pause('drag')
    }
    else {
        container.plugins.resume('drag')
    }
})


//interaction handle
app.renderer.plugins.interaction.on("mousedown", e => {
    if (props.brush) {
        handleBrushStart(e);
    }
    else {
        // handleDragStart(e);
    }
})
app.renderer.plugins.interaction.on("mousemove", e => {
    if (props.brush) {
        handleBrushMove(e);
    }
    else {
        // handleDragMove(e);
    }
})
app.renderer.plugins.interaction.on("mouseup", e => {
    // handleDragEnd(e);
    handleBrushEnd(e);
})
app.renderer.plugins.interaction.on("mouseout", e => {
    // handleDragEnd(e);
    handleBrushEnd(e);
})


// force setup
const simulation = d3.forceSimulation()
    .alphaMin(0.01)
    .force("link", d3.forceLink().id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


let nodes = props.nodes.map(item => {
    let node = {
        ...item
    };
    node.gfx = new PIXI.Graphics();
    node.size = props.size(node);
    return node;
});

const maxSize = Math.max(...nodes.map(i => i.size));
const minSize = Math.min(...nodes.map(i => i.size));

function calSize(s) {
    return (s - minSize) / (maxSize - minSize) * props.sizeRange[1] + props.sizeRange[0]
}


nodes.forEach(node => {
    if (node.industry != "[]") {
        node.gfx.lineStyle(NodeLineWidth, 0xfb7185);
    }
    else {
        node.gfx.lineStyle(NodeLineWidth, 0xFFFFFF);
    }
    node.gfx.beginFill(props.colorMap(node));
    node.gfx.drawCircle(0, 0, calSize(node.size));
    nodeLinkLayer.addChildAt(node.gfx, 0);
})

let links = props.links.map(item => {
    let link = {
        ...item
    };
    return link;
})

let linkGfx = new PIXI.Graphics();
nodeLinkLayer.addChildAt(linkGfx, 1);


// selection
function search(quadtree, [[x0, y0], [x3, y3]], cb) {
    quadtree.visit((node, x1, y1, x2, y2) => {
        if (!node.length) {
            do {
                const { data: d, data: [x, y] } = node;
                // d.scanned = true;
                if (x >= x0 && x < x3 && y >= y0 && y < y3) {
                    cb(d)
                }
                // d.selected = x >= x0 && x < x3 && y >= y0 && y < y3;
            } while ((node = node.next));
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });
}

let quadtree = d3.quadtree();

const mem = {}
function randomColor(i) {
    if (mem[i] != null) {
        return mem[i];
    }
    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);
    const color = (r << 16) + (g << 8) + b;
    mem[i] = color;
    return color;
}

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
    const g = createGraph();
    nodes.forEach(n => g.addNode(n.id));
    links.forEach(l => g.addLink(l.source.id, l.target.id));
    var whisper = createWhisper(g);
    var requiredChangeRate = 0; // 0 is complete convergence
    while (whisper.getChangeRate() > requiredChangeRate) {
        whisper.step();
    }
    return nodes.map(n=>whisper.getClass(n.id));
    // var clusters = detectClusters(g);
    // return nodes.map(n=>clusters.getClass(n.id));
}

function handleForceStop() {
    // quadtree = d3.quadtree();
    // quadtree.addAll(nodes).x(i => i.x).y(i => i.y);

    // dbscan setup
    var dbscanner = jDBSCAN()
        .eps(75)
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
        gfx.on("click", e => {
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
        hullLayer.addChild(group);
    }
}

// change layer opacity when zoom
const onZoom = () => {
    const k = container.transform.worldTransform.a;
    hullLayer.alpha = hullOpacity(k);
    nodeLinkLayer.alpha = nodeLinkOpacity(k);
    if (hullLayer.alpha == hullOpacity.range()[1]) {
        container.setChildIndex(hullLayer, 0);
    }
    else {
        container.setChildIndex(hullLayer, 1);
    }
}

container.on("zoomed", onZoom)

// initial drawing
let stopped = false;
function initDraw() {
    // create canvas
    el.value.appendChild(app.view);
    app.resizeTo = el.value;
    const { height, width } = app.screen;
    container.resize(width, height)
    // simulation initial data
    simulation.nodes(nodes).force('link').links(links);
    simulation.stop();

    //tick
    app.ticker.add((delta) => {
        const k = container.transform.worldTransform.a;

        if (simulation.alpha() >= simulation.alphaMin()) {
            simulation.tick();
        }
        else if (!stopped) {
            handleForceStop();
            stopped = true;
        }
        // draw line
        linkGfx.clear();
        linkGfx.alpha = 0.6
        links.forEach((link) => {
            let { source, target } = link
            linkGfx.lineStyle(k < 1 ? 1 / k : 1, 0x999999)
            linkGfx.moveTo(source.x, source.y)
            linkGfx.lineTo(target.x, target.y)
        })
        linkGfx.endFill();
        // move nodes
        nodes.forEach((node) => {
            let { id, x, y, gfx } = node
            gfx.position = new PIXI.Point(x, y)
            gfx.scale.x = k < 1 ? (1 / k) ** 0.5 : 1
            gfx.scale.y = k < 1 ? (1 / k) ** 0.5 : 1

            const x1 = rectPos.x;
            const x2 = x1 + rectPos.w;
            const y1 = rectPos.y;
            const y2 = y1 + rectPos.h

            const { x: tx1, y: ty1 } = container.transform.worldTransform.applyInverse(new PIXI.Point(x1, y1));
            const { x: tx2, y: ty2 } = container.transform.worldTransform.applyInverse(new PIXI.Point(x2, y2));
            if (brushing) {
                if (x > tx1 && y > ty1 && x < tx2 && y < ty2) {
                    if (alt.value) {
                        selectedNodes.delete(id);
                    }
                    else {
                        selectedNodes.add(id);
                    }
                }
                else {
                    if (!alt.value && !ctrl.value) {
                        selectedNodes.delete(id);
                    }
                }
            }
            if (selectedNodes.has(id)) {
                const color = new PIXI.filters.ColorMatrixFilter();
                color.negative();
                gfx.filters = [color];
            }
            else {
                gfx.filters = [];
            }


        })
    });
}

onMounted(() => initDraw());

</script>