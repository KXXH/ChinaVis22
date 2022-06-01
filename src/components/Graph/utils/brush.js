import * as PIXI from 'pixi.js';
import * as d3 from "d3";


export default class useBrush{
    brushing = false;
    rectPos = {
        x:0,
        y:0,
        w:0,
        h:0
    }
    lastPos = {
        x: 0,
        y: 0,
    }
    selectedNodes = new Map();
    currentSelected = new Map();
    _x = i=>i.x;
    _y = i=>i.y;
    _nodes = [];
    _quadtree = null;
    _stop = false;
    _ctrl = false;
    _alt = false;
    _container = null;
    _onBrush = ()=>{};
    _brushRect = new PIXI.Graphics();
    _brushLayer = new PIXI.Container();
    selectionLayer = new PIXI.Container();

    _onEnter = ()=>{};
    _onExit = ()=>{};

    constructor(){
        this._brushLayer.addChild(this._brushRect);
    }

    handleBrushStart = (e) => {
        // if magic keys is not pressed, clear selection
        if (!(this._alt||this._ctrl)) {
            for(const [id, node] of this.selectedNodes){
                this._onExit(node, this.selectionLayer);
            }
            this.selectedNodes.clear();
            // selectedNodes.= new Set();
        }
        this.rectPos.x = this.rectPos.y = 0;
        this.rectPos.w = this.rectPos.h = 0;
        this.lastPos.x = e.data.global.x;
        this.lastPos.y = e.data.global.y;
        this.currentSelected.clear();
        this.brushing = true;
    }
    handleBrushMove = (e) => {
        if (this.brushing) {
            let { x, y } = e.data.global;

            let newX = Math.min(this.lastPos.x, x);
            let newY = Math.min(this.lastPos.y, y);

            let w = Math.abs(x - this.lastPos.x);
            let h = Math.abs(y - this.lastPos.y);

            const { x: tx1, y: ty1 } = this._container.transform.worldTransform.applyInverse(new PIXI.Point(newX, newY));
            const { x: tx2, y: ty2 } = this._container.transform.worldTransform.applyInverse(new PIXI.Point(newX + w, newY + h));
            this.searchCb(this.rectPos.x, this.rectPos.y, this.rectPos.x + this.rectPos.w, this.rectPos.y + this.rectPos.h, (n) => {
                this.currentSelected.delete(n.id);
                this._onExit(n, this.selectionLayer);
            });
            this.searchCb(tx1, ty1, tx2, ty2, (n) => {
                this.currentSelected.set(n.id, n)
                this._onEnter(n, this.selectionLayer);
            });

            this.rectPos.x = newX;
            this.rectPos.y = newY;
            this.rectPos.w = w;
            this.rectPos.h = h;

            this._brushRect.clear();
            this._brushRect.lineStyle(1, 0x2563eb);
            this._brushRect.beginFill(0x60a5fa, 0.5);
            this._brushRect.drawRect(this.rectPos.x, this.rectPos.y, this.rectPos.w, this.rectPos.h);

            this._onBrush(this.rectPos, this);
        }
    }
    handleBrushEnd = (e) => {
        this.rectPos.x = this.rectPos.y = 0;
        this.rectPos.w = this.rectPos.h = 0;
        this.brushing = false;
        this.selectedNodes = this.selection;
        this._brushRect.clear();
    }
    get selection(){
        let res = new Map(this.selectedNodes);
        // -
        if(this._alt){
            for (const [id, n] of this.currentSelected){
                this.selectedNodes.delete(id)
            }
        }
        // +
        else if(this._ctrl){
            for(const [id, n] of this.currentSelected){
                this.selectedNodes.set(id, n)
            }
        }
        // =
        else {
            res = this.currentSelected;
        }
        return res;
    }
    quadtree(status){
        if(status==null) return this._quadtree;
        if(status){
            this._quadtree = d3
                .quadtree()
                .addAll(this._nodes)
                .x(this.x())
                .y(this.y())
        }
        else{
            this._quadtree = null;
        }
    }
    searchCb(x0, y0, x3, y3, cb){
        const qt = this.quadtree();
        if(qt){
            qt.visit((node, x1, y1, x2, y2) => {
                if (!node.length) {
                    do {
                        const { data: d } = node;
                        const { x, y } = d;
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
        else{
            for(const node of this.nodes()){
                const x = this._x(node)
                const y = this._y(node)
                if (x >= x0 && x < x3 && y >= y0 && y < y3) {
                    cb(node)
                }
            }
        }
    }
    nodes(data) {
        if (data == null) return this._nodes;
        this._nodes = data;
        this._nodes.forEach(n => {
            n.selectGfx = new PIXI.Graphics();
            this.selectionLayer.addChildAt(n.selectGfx, 0);
        })
        if (this.quadtree() != null) {
            this.quadtree(true);
        }
        return this;
    }
    x(fx) {
        if (fx == null) return this._x;
        this._x = fx;
        return this;
    }
    y(fy) {
        if (fy == null) return this._y;
        this._y = fy;
        return this;
    }
    stop(){
        this._stop=true;
        this._container.off("mousedown", this.handleBrushStart);
        this._container.off("mousemove", this.handleBrushMove);
        this._container.off("mouseup", this.handleBrushEnd);
        this._container.off("mouseleave", this.handleBrushEnd);
        return this;
    }
    start(){
        this._stop=false;
        this._container.on("mousedown", this.handleBrushStart);
        this._container.on("mousemove", this.handleBrushMove);
        this._container.on("mouseup", this.handleBrushEnd);
        this._container.on("mouseleave", this.handleBrushEnd);
        return this;
    }
    alt(v){
        this._alt=v;
        return this;
    }
    ctrl(v){
        this._ctrl=v;
        return this;
    }
    app(a){
        a.stage.addChildAt(this._brushLayer, a.stage.children.length);
        return this;
    }
    container(c){
        if(c==null) return this._container;
        this._container=c;
        this._container.addChildAt(this.selectionLayer, this._container.length)
        return this;
    }
    onBrush(fn){
        if(fn==null) return this._onBrush;
        this._onBrush = fn;
        return this;
    }
    onEnter(fn){
        if (fn == null) return this._onEnter;
        this._onEnter = fn;
        return this;
    }
    onExit(fn) {
        if (fn == null) return this._onExit;
        this._onExit = fn;
        return this;
    }

}