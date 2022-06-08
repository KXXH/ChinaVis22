import * as PIXI from 'pixi.js';
import * as d3 from "d3";
import { RELATION_STRENGTH } from '../../../config/node_and_links';

export default class useForce {
    dispatch = d3.dispatch("tick", "end");
    simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody().theta(0.8))
        .on("tick", ()=>this.dispatch.call("tick"))
        .on("end", ()=>this.dispatch.call("end"))
        .stop();

    _container = new PIXI.Container()
    _linkGfx = new PIXI.Graphics();
    _nodes = [];
    _links = [];
    _width;
    _height;

    _drawCircle = (gfx, n)=>{
        gfx.beginFill();
        gfx.drawCircle(0, 0, 10);
        gfx.endFill();
    }

    _beforeDrawLine = (gfx)=>{
        gfx.clear();
        gfx.lineStyle(1, 0x999999);
        gfx.alpha = 0.6;
    }

    _drawLine = (gfx, l) => {
        let { source, target } = l;
        gfx.moveTo(source.x, source.y)
        gfx.lineTo(target.x, target.y)
    }

    _afterDrawLine = (gfx) =>{
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
        this.simulation.nodes(this._nodes);
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
        this.simulation.force("link", 
            d3.forceLink()
                .id(d => d.id)
                // .distance(function(link){
                //     // return 1 / Math.min(count(link.source), count(link.target));
                //     return 50/RELATION_STRENGTH[link.relation];
                // })
                .links(l)
        );
        return this;
    }

    width(w){
        if(w==null) return this._width;
        this._width = w;
        this.simulation.force("center", d3.forceCenter(this._width / 2, this._height / 2))
        return this;
    }

    height(h) {
        if (h == null) return this._height;
        this._height = h;
        this.simulation.force("center", d3.forceCenter(this._width / 2, this._height / 2))
        return this;

    }

    drawCircle(fn){
        if(fn==null) return this._drawCircle;
        this._drawCircle = fn;
        this._nodes.forEach(n=>{
            if(!n.gfx) return;
            n.gfx.clear();
            this._drawCircle(n.gfx, n);
        })
        return this;
    }

    beforeDrawLine(fn){
        if(fn==null) return this._beforeDrawLine;
        this._beforeDrawLine = fn;
        return this;
    }

    afterDrawLine(fn){
        if(fn==null) return this._afterDrawLine;
        this._afterDrawLine = fn;
        return this;
    }

    on(type, fn){
        this.dispatch.on(type, fn);
        return this;
    }

    scale(k){
        this._nodes.forEach(node=>{
            k = Math.min(k, 1);
            node.gfx.scale.x =  k < 1 ? (1 / k) ** 0.5 : 1
            node.gfx.scale.y = k < 1 ? (1 / k) ** 0.5 : 1
        })
        return this;
    }

    start(){
        this.simulation.restart();
        return this;
    }

    stop(){
        this.simulation.stop();
        return this;
    }

    constructor() {
        this.dispatch.on("tick.move", () => {
            this._nodes.forEach(node => {
                let { id, x, y, gfx } = node;
                gfx.position = new PIXI.Point(x, y);
            })
            this._beforeDrawLine(this._linkGfx)
            this._links.forEach(l=>this._drawLine(this._linkGfx, l));
            this._afterDrawLine(this._linkGfx);
        })
    }

}