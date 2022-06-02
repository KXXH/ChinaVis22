import * as PIXI from 'pixi.js';
import * as d3 from "d3";
import * as createLayout from 'ngraph.forcelayout';
import createGraph from "../../../algorithms/createGraph";

export default class useForce {
    dispatch = d3.dispatch("tick", "end");
    simulation;

    _container = new PIXI.Container()
    _linkGfx = new PIXI.Graphics();
    _nodes = [];
    _links = [];
    _width;
    _height;

    _drawCircle = (gfx, n) => {
        gfx.beginFill();
        gfx.drawCircle(0, 0, 10);
        gfx.endFill();
    }

    _beforeDrawLine = (gfx) => {
        gfx.clear();
        gfx.lineStyle(1, 0x999999);
        gfx.alpha = 0.6;
    }

    _drawLine = (gfx, l) => {
        let { source, target } = l;
        let { x: sx, y: sy } = this.simulation.getNodePosition(source);
        let { x: tx, y: ty } = this.simulation.getNodePosition(target);

        gfx.moveTo(sx, sy)
        gfx.lineTo(tx, ty)
    }

    _afterDrawLine = (gfx) => {
        gfx.endFill()
    }

    container(c) {
        if (c == null) return this._container;
        this._container = c;
        this._container.addChildAt(this._linkGfx, 0);
        return this;
    }

    nodes(n) {
        if (n == null) return this._nodes;
        this._nodes = n;
        // this.simulation.nodes(this._nodes);
        this._nodes.forEach(n => {
            n.gfx = new PIXI.Graphics();
            this._drawCircle(n.gfx, n);
            this._container.addChildAt(n.gfx, this._container.children.length);
        })
        return this;
    }

    links(l) {
        if (l == null) return this._links;
        this._links = l;
        // this.simulation.force("link", d3.forceLink().id(d => d.id).links(l));
        return this;
    }

    width(w) {
        if (w == null) return this._width;
        this._width = w;
        // this.simulation.force("center", d3.forceCenter(this._width / 2, this._height / 2))
        return this;
    }

    height(h) {
        if (h == null) return this._height;
        this._height = h;
        // this.simulation.force("center", d3.forceCenter(this._width / 2, this._height / 2))
        return this;

    }

    drawCircle(fn) {
        if (fn == null) return this._drawCircle;
        this._drawCircle = fn;
        this._nodes.forEach(n => {
            if (!n.gfx) return;
            n.gfx.clear();
            this._drawCircle(n.gfx, n);
        })
        return this;
    }

    beforeDrawLine(fn) {
        if (fn == null) return this._beforeDrawLine;
        this._beforeDrawLine = fn;
        return this;
    }

    afterDrawLine(fn) {
        if (fn == null) return this._afterDrawLine;
        this._afterDrawLine = fn;
        return this;
    }

    on(type, fn) {
        this.dispatch.on(type, fn);
        return this;
    }

    scale(k) {
        this._nodes.forEach(node => {
            k = Math.min(k, 1);
            node.gfx.scale.x = Math.sqrt(k)
            node.gfx.scale.y = Math.sqrt(k)
        })
        return this;
    }

    start() {
        var physicsSettings = {
            timeStep: 1,
            dimensions: 2,
            gravity: -1.2,
            theta: 0.8,
            springLength: 10,
            springCoefficient: 0.0008,
            dragCoefficient: 0.2,
        };
        this.g = createGraph(this._nodes, this._links, n => n.id, l => l.source, l => l.target);
        this.simulation = createLayout(this.g, physicsSettings);
        let ITERATIONS_COUNT=3000;
        let i=0;
        const r = ()=>{
            this.simulation.step();
            this.dispatch.call("tick");
            if(i++>ITERATIONS_COUNT) return;
            requestAnimationFrame(r);
        }
        requestAnimationFrame(r)
        return this;
    }

    stop() {

        return this;
    }

    constructor() {
        this.dispatch.on("tick.move", () => {
            this._nodes.forEach(node => {
                let { id, gfx } = node;
                let { x, y} = this.simulation.getNodePosition(id);
                node.x=x;
                node.y=y;
                gfx.position = new PIXI.Point(x, y);
            })
            this._beforeDrawLine(this._linkGfx)
            this._links.forEach(l => this._drawLine(this._linkGfx, l));
            this._afterDrawLine(this._linkGfx);
        })
    }

}