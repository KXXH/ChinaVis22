<template>
    <div ref="el" @wheel="handleZoom" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'
import { useElementSize, watchOnce, useTransition, TransitionPresets } from '@vueuse/core';
import * as d3 from "d3";
import { useMagicKeys, logicOr } from '@vueuse/core'

import jDBSCAN from "jdbscan";
console.log("dbscan", jDBSCAN)

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
    brush: Boolean
});
const width = 400;
const height = 400;


// pixi setup
const app = new PIXI.Application({
    width, height, backgroundColor: 0xffffff, resolution: window.devicePixelRatio || 1,
    antialias: true
});
const container = new Viewport({
    interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})

// const container = new PIXI.Container();
app.stage.addChild(container);


const lastPos = {
    x: 0,
    y: 0
}


// zoom setup
function calScaleMtx(k, x0, y0, mtx) {
    let tmtx = mtx.clone();
    const newMtx = new PIXI.Matrix(k, 0, 0, k, x0 - k * x0, y0 - k * y0);
    return tmtx.prepend(newMtx);
}


function handleZoom(e) {
    const { deltaY } = e;
    let { offsetX, offsetY } = e;
    const transformMatrix = calScaleMtx(deltaY < 0 ? 3 / 2 : 2 / 3, offsetX, offsetY, container.transform.worldTransform);
    container.transform.setFromMatrix(transformMatrix);
}



// drag setup
let dragging = false;
function handleDragStart(e) {
    lastPos.x = e.data.global.x;
    lastPos.y = e.data.global.y;
    dragging = true;
}
function handleDragMove(e) {
    if (dragging === true) {
        let { x, y } = e.data.global;

        let dx = x - lastPos.x;
        let dy = y - lastPos.y;

        const newTransformMatrix = container.transform.worldTransform.clone();
        container.x += dx;
        container.y += dy;
        newTransformMatrix.tx += dx;
        newTransformMatrix.ty += dy;

        lastPos.x = x;
        lastPos.y = y;
    }
}
function handleDragEnd(e) {
    dragging = false;
}


// brush
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


//interaction handle
app.renderer.plugins.interaction.on("mousedown", e => {
    if (props.brush) {
        handleBrushStart(e);
    }
    else {
        handleDragStart(e);
    }
})
app.renderer.plugins.interaction.on("mousemove", e => {
    if (props.brush) {
        handleBrushMove(e);
    }
    else {
        handleDragMove(e);
    }
})
app.renderer.plugins.interaction.on("mouseup", e => {
    handleDragEnd(e);
    handleBrushEnd(e);
})
app.renderer.plugins.interaction.on("mouseout", e => {
    handleDragEnd(e);
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
    node.gfx.lineStyle(1.5, 0xFFFFFF);
    node.gfx.beginFill(props.colorMap(node));
    node.gfx.drawCircle(0, 0, calSize(node.size));
    container.addChildAt(node.gfx, 0);
})

let links = props.links.map(item => {
    let link = {
        ...item
    };
    return link;
})

let linkGfx = new PIXI.Graphics();
container.addChildAt(linkGfx, 1);


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

function handleForceStop() {
    // quadtree = d3.quadtree();
    // quadtree.addAll(nodes).x(i => i.x).y(i => i.y);
    console.log(nodes);
    var dbscanner = jDBSCAN()
        .eps(50)
        .minPts(10)
        .distance('EUCLIDEAN')
        .data(nodes);
    var point_assignment_result = dbscanner();
    var cluster_centers = dbscanner.getClusters();
    console.log(point_assignment_result, cluster_centers)
    nodes.forEach((node, i) => {
        node.gfx.clear();
        node.gfx.lineStyle(1.5, 0xFFFFFF);
        node.gfx.beginFill(randomColor(point_assignment_result[i]));
        node.gfx.drawCircle(0, 0, calSize(node.size));
        node.gfx.position = new PIXI.Point(node.x, node.y);
    })
    console.log(mem)
}


// initial drawing
let stopped = false;
function initDraw(width, height) {
    // create canvas
    el.value.appendChild(app.view);
    app.resizeTo = el.value;
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

onMounted(() => initDraw(width, height));

</script>