export default function useBrush(){
    let brushing = false;
    let rectPos = {
        x:0,
        y:0,
        w:0,
        h:0
    }
    let selectedNodes = new Set();
    let currentSelected = new Set();
    let _x = i=>i.x;
    let _y = i=>i.y;
    let _nodes = [];
    let _quadtree = null;
    let _stop = false;
    let _ctrl = false;
    let _alt = true;
    let _container = null;
    let _onBrush = ()=>{};
    function handleBrushStart(e) {
        // if magic keys is not pressed, clear selection
        if (!(_alt||_ctrl)) {
            selectedNodes.clear();
            // selectedNodes.= new Set();
        }
        rectPos.x = rectPos.y = 0;
        rectPos.w = rectPos.h = 0;
        lastPos.x = e.data.global.x;
        lastPos.y = e.data.global.y;
        currentSelected = new Set();
        brushing = true;
    }
    function handleBrushMove(e) {
        if (brushing) {
            let { x, y } = e.data.global;

            let newX = Math.min(lastPos.x, x);
            let newY = Math.min(lastPos.y, y);

            let w = Math.abs(x - lastPos.x);
            let h = Math.abs(y - lastPos.y);

            const { x: tx1, y: ty1 } = _container.transform.worldTransform.applyInverse(new PIXI.Point(newX, newY));
            const { x: tx2, y: ty2 } = _container.transform.worldTransform.applyInverse(new PIXI.Point(newX + w, newY + h));
            searchCb(quadtree, [[rectPos.x, rectPos.y], [rectPos.x + rectPos.w, rectPos.y + rectPos.h]], (n) => currentSelected.delete(n.id));
            searchCb(quadtree, [[tx1, ty1], [tx2, ty2]], (n) => currentSelected.add(n.id));

            rectPos.x = newX;
            rectPos.y = newY;
            rectPos.w = w;
            rectPos.h = h;

            brushRect.clear();
            brushRect.lineStyle(1, 0x2563eb);
            brushRect.beginFill(0x60a5fa, 0.5);
            brushRect.drawRect(rectPos.x, rectPos.y, rectPos.w, rectPos.h);

            onBrush(rectPos, this);
        }
    }
    function handleBrushEnd(e) {
        rectPos.x = rectPos.y = 0;
        rectPos.w = rectPos.h = 0;
        brushing = false;

        // merge
        // -
        if(_alt){
            for(const item of currentSelected){
                selectedNodes.delete(item)
            }
        }
        // +
        else if(_ctrl){
            for(const item of currentSelected){
                selectedNodes.add(item)
            }
        }
        // =
        else{
            selectedNodes = currentSelected;
        }
        brushRect.clear();
    }
    function nodes(data){
        if(data===null) return nodes;
        _nodes = data;
        if(quadtree()!==null){
            quadtree(true);
        }
        return this;
    }
    function x(fx){
        if(fx===null) return _x;
        _x = fx;
        return this;
    }
    function y(fy){
        if (fy === null) return _y;
        _y = fy;
        return this;
    }
    function quadtree(status){
        if(status===null) return _quadtree;
        if(status){
            _quadtree = d3
                .quadtree()
                .addAll(_nodes)
                .x(x())
                .y(y())
        }
        else{
            _quadtree = null;
        }
    }
    function searchCb(x0, y0, x3, y3){
        const qt = quadtree();
        
        quadtree.visit((node, x1, y1, x2, y2) => {
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
    function stop(){
        _stop=true;
        _container.off("mousedown", handleBrushStart);
        _container.off("mousemove", handleBrushMove);
        _container.off("mouseup", handleBrushEnd);
        return this;
    }
    function start(){
        _stop=false;
        _container.on("mousedown", handleBrushStart);
        _container.on("mousemove", handleBrushMove);
        _container.on("mouseup", handleBrushEnd);
        return this;
    }
    function alt(v){
        _alt=v;
        return this;
    }
    function ctrl(v){
        _ctrl=v;
        return this;
    }
    function container(c){
        if(c===null) return _container;
        _container=container;
        return this;
    }
    function onBrush(fn){
        if(fn===null) return _onBrush;
        _onBrush = fn;
        return this;
    }
}