import { computed } from "vue";
import { louvain } from "../algorithms/community";
import ColorGenerator from "../algorithms/colorGenerator";
import coarsen from "ngraph.coarsen";
import color from "../config/colormap.js"
class Community{
    _memo = [];
    _gg=null;
    _cg = new ColorGenerator();
    _level=0;
    constructor(g0){
        this._gg = g0;
    }

    colorMap(level){
        if(level==0){
            return color;
        }
        if(level>=this._memo.length){
            let curLevel = this._memo.length;
            while(curLevel<level){
                const gg = this._gg;
                const c = louvain(gg);
                this._memo.push(c);
                this._gg = coarsen(gg, c);
                curLevel+=1;
            }
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