import * as PIXI from 'pixi.js';
import * as d3 from "d3";
import _ from 'lodash';


export default class useBrush {
    brushing = false;
    rectPos = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    }
    lastPos = {
        x: 0,
        y: 0,
    }
    selectedNodes = new Map();
    currentSelected = new Map();
    _x = i => i.x;
    _y = i => i.y;
    _r = i => i.r;
    _nodes = [];
    _quadtree = null;
    _stop = false;
    _ctrl = false;
    _alt = false;
    _container = null;
    _onBrush = () => { };
    _brushRect = new PIXI.Graphics();
    _brushLayer = new PIXI.Container();
    selectionLayer = new PIXI.Container();

    _onEnter = () => { };
    _onExit = () => { };
    dispatch = d3.dispatch("brushstart", "brush", "brushend", "enter", "exit", "forceEnter", "forceExit");

    constructor() {
        this._brushLayer.name = "brush layer"
        this._brushLayer.addChild(this._brushRect);
        this.selectionLayer.name = "selection layer"
    }

    handleBrushStart = (e) => {
        // if magic keys is not pressed, clear selection
        if (!this._alt && !this._ctrl) {
            for (const [id, node] of this.selectedNodes) {
                this.dispatch.call("exit", null, node, this.selectionLayer);
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
        this.dispatch.call("brushstart", null, e);


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
            const { x: x1, y: y1 } = this._container.transform.worldTransform.applyInverse(new PIXI.Point(this.rectPos.x, this.rectPos.y));
            const { x: x2, y: y2 } = this._container.transform.worldTransform.applyInverse(new PIXI.Point(this.rectPos.x + this.rectPos.w, this.rectPos.y + this.rectPos.h));

            this.searchCb(x1, y1, x2, y2, (n) => {
                this.currentSelected.delete(n.id);
                // this._onExit(n, this.selectionLayer);
                // console.log(n.id,n.x, n.y, this.rectPos, "exit")

                this.dispatch.call("exit", null, n, this.selectionLayer)
            });
            this.searchCb(tx1, ty1, tx2, ty2, (n) => {
                this.currentSelected.set(n.id, n)
                // console.log(n.id, "enter")
                // this._onEnter(n, this.selectionLayer);
                this.dispatch.call("enter", null, n, this.selectionLayer)
            });

            this.rectPos.x = newX;
            this.rectPos.y = newY;
            this.rectPos.w = w;
            this.rectPos.h = h;

            this._brushRect.clear();
            this._brushRect.lineStyle(1, 0x2563eb);
            this._brushRect.beginFill(0x60a5fa, 0.5);
            this._brushRect.drawRect(this.rectPos.x, this.rectPos.y, this.rectPos.w, this.rectPos.h);

            this.dispatch.call("brush", null, this.rectPos, this);
            // this._onBrush(this.rectPos, this);
            // console.log("move", this.selectedNodes.size, this.currentSelected.size)
        }
    }
    handleBrushEnd = (e) => {
        this.rectPos.x = this.rectPos.y = 0;
        this.rectPos.w = this.rectPos.h = 0;
        this.brushing = false;
        this.selectedNodes = new Map(this.selection);
        this._brushRect.clear();
        this.dispatch.call("brushend", null, e);
        // console.log("end", this.selectedNodes.size, this.currentSelected.size)
    }
    get selection() {
        let res = new Map(this.selectedNodes);
        // -
        if (this._alt) {
            for (const [id, n] of this.currentSelected) {
                res.delete(id)
            }
        }
        // +
        else if (this._ctrl) {
            for (const [id, n] of this.currentSelected) {
                res.set(id, n)
            }
        }
        // =
        else {
            res = new Map(this.currentSelected);
        }
        // console.log("get", this.selectedNodes.size, this.currentSelected.size)

        return res;
    }
    quadtree(status) {
        if (status == null) return this._quadtree;
        if (status) {
            this._quadtree = d3
                .quadtree()
                .x(this._x)
                .y(this._y)
                .addAll(this._nodes)
        }
        else {
            this._quadtree = null;
        }
    }
    searchCb(x0, y0, x3, y3, cb) {
        const qt = this.quadtree();
        if (qt) {
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
        else {
            for (const node of this.nodes()) {
                const x = this._x(node)
                const y = this._y(node)
                if (x >= x0 && x < x3 && y >= y0 && y < y3) {
                    cb(node)
                }
            }
        }
    }
    find(x, y, r) {
        let res = [];
        this.searchCb(x - r, y - r, x + r, y + r, (d) => {
            res.push(d)
        })
        // let res = this._nodes.filter(n=>n.x>=(x-r)&&n.x<=(x+r)&&n.y>=y-r&&n.y<=y+r);
        return _(res).sortBy(d => {
            return Math.sqrt((d.x - x) ** 2, (d.y - y) ** 2)
        }).find(d => {
            return this._r(d) >= Math.sqrt((d.x - x) ** 2, (d.y - y) ** 2);
        });

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
    r(fr) {
        if (fr == null) return this._r;
        this._r = fr;
        return this;
    }
    stop() {
        this._stop = true;
        this._container.off("mousedown", this.handleBrushStart);
        this._container.off("mousemove", this.handleBrushMove);
        this._container.off("mouseup", this.handleBrushEnd);
        this._container.off("mouseleave", this.handleBrushEnd);
        return this;
    }
    start() {
        this._stop = false;
        this._container.on("mousedown", this.handleBrushStart);
        this._container.on("mousemove", this.handleBrushMove);
        this._container.on("mouseup", this.handleBrushEnd);
        this._container.on("mouseleave", this.handleBrushEnd);
        return this;
    }
    select(nodes) {
        for (const [id, node] of this.selection) {
            this.dispatch.call("exit", null, node, this.selectionLayer);
        }
        this.currentSelected.clear();
        let nodes_t = new Map(Array.from(nodes.entries()).map(([id, node]) => {
            if (node.selectGfx == null) {
                // node.selectGfx = new PIXI.Graphics();
                // this.selectionLayer.addChildAt(node.selectGfx, 0);
                const node_t = this._nodes.find(n => n.id == node.id);
                return [id, {
                    ...node_t,
                    ...node
                }];
            }
            else return [id, node];
        }))
        this.selectedNodes = new Map(nodes_t);
        this.selectedNodes.forEach(node => {
            this.dispatch.call("forceEnter", null, node, this.selectionLayer);
        })
    }
    unselect(nodes) {
        Array.from(nodes.entries()).map(([id, node]) => {
            if (node.selectGfx == null) {
                const node_t = this._nodes.find(n => n.id == node.id);
                this.dispatch.call("forceExit", null, node_t, this.selectionLayer);
            }
            else this.dispatch.call("forceExit", null, node, this.selectionLayer);
        });
    }
    alt(v) {
        this._alt = v;
        return this;
    }
    ctrl(v) {
        this._ctrl = v;
        return this;
    }
    app(a) {
        a.stage.addChildAt(this._brushLayer, a.stage.children.length);
        return this;
    }
    container(c) {
        if (c == null) return this._container;
        this._container = c;
        this._container.addChildAt(this.selectionLayer, this._container.children.length)
        return this;
    }
    onBrush(fn) {
        if (fn == null) return this._onBrush;
        this._onBrush = fn;
        return this;
    }
    onEnter(fn) {
        if (fn == null) return this._onEnter;
        this._onEnter = fn;
        return this;
    }
    onExit(fn) {
        if (fn == null) return this._onExit;
        this._onExit = fn;
        return this;
    }
    on(evt, fn) {
        this.dispatch.on(evt, fn);
        return this;
    }

}