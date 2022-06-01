import * as PIXI from 'pixi.js';
import * as d3 from "d3";

export default class useForce {
    ticked = new PIXI.Signal();
    end = new PIXI.Signal();
    simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody())
        .stop()
        .on("tick", this.ticked.dispatch())
        .on("end", this.end.dispatch());

    _container = new PIXI.Container()
    _nodes = [];
    _links = [];
    
    
    _drawCircle = (gfx, n)=>{
        gfx.beginFill();
        gfx.drawCircle(0, 0, 10);
        gfx.endFill();
    }

    _beforeDrawLine = (gfx)=>{
        gfx.clear();
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
        return this;
    }

    nodes(n) {
        if (n == null) return this._nodes;
        this._nodes = n;
        this.simulation.nodes(this._nodes);
        this._nodes.forEach(n => {
            n.gfx = new PIXI.Graphics();
        })
        return this;
    }

    links(l) {
        if (l == null) return this._links;
        this._links = l;
        this.simulation.force("link", d3.forceLink().id(d => d.id).links());
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

    constructor() {
        this.ticked.add(() => {
            this._nodes.forEach(node => {
                let { id, x, y, gfx } = node;
                gfx.position = new PIXI.Point(x, y);

            })
        })
    }

}