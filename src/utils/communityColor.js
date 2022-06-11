import { computed } from "vue";
import { louvain } from "../algorithms/community";
import ColorGenerator from "../algorithms/colorGenerator";
import coarsen from "ngraph.coarsen";
import color from "../config/colormap.js";
import _ from "lodash";
class Community{
    _memo = [];
    _gg=null;
    _cg = new ColorGenerator();
    _level=0;
    constructor(g0){
        this._gg = [g0];
    }

    _build_memo_and_gg(level){
        let curLevel = this._memo.length;
        while (curLevel < level) {
            const gg = this._gg[this._gg.length - 1];
            const c = louvain(gg);
            this._memo.push(c);
            // this._gg = coarsen(gg, c);
            this._gg.push(coarsen(gg, c));
            curLevel += 1;
        }
    }

    simplify(level){
        if(level>=this._gg.length){
            this._build_memo_and_gg(level)
        }

        let getChildren = (level, id) => {
            if(level==0){
                return id;
            }
            return _(Array.from(this._gg[level].getNode(id).data)).map(n => getChildren(level-1, n)).flatten().value();
        }
        this._gg[level].forEachNode(n=>{
            n.data.leaf = new Set(getChildren(level, n.id))
        });
        return this._gg[level]
    }

    colorMap(level){
        if(level==0){
            return color;
        }
        if(level>=this._memo.length){
            this._build_memo_and_gg(level);
        }
        const _level = level
        let getClass = (level, id) => {
            if (level == _level-1) {
                return this._memo[level].getClass(id)
            }
            return getClass(level + 1, this._memo[level].getClass(id));
        }
        return (n)=>{
            return this._cg.randomColor(getClass(0, n.id));
        }
    }

    
}

export default Community;