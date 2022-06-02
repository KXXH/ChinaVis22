import {dispatch, scaleLinear} from "d3";

class useTransition{
    _container;
    _transitionOn=false;
    _event=dispatch(
        "beforeIn", "in", "afterIn",
        "beforeOut", "out", "afterOut"
    )
    container(c) {
        if (c == null) return this._container;
        this._container = c;
        return this;
    }
    transition(from, to, opt={}){
        // from: alpha[1], zoom -> alpha[0], zoom*zoom[0]
        // to: alpha[0], zoom[1]*zoom -> alpha[1], zoom
        const {
            duration=1000,
            alphaRange=[0, 1],
            zoomRange=[1/3, 3],
            ease ="easeInOutCubic"
        } = opt;

        this._event.call("beforeOut", null, from);
        this._event.call("beforeIn", null, to);
        from._event.call("beforeOut");
        to._event.call("beforeIn");
        
        from.container().alpha = alphaRange[1];
        to.container().alpha = alphaRange[0];
        

        if(!this._container.getChildByName(to.name())){
            this._container.addChild(to.container());
        }
        const zoomFrom = from.container().scale.x;
        const zoomTo = to.container().scale.x;
        to.container().scale.x = zoomRange[1] * zoomTo
        to.container().scale.y = zoomRange[1] * zoomTo

        const opacityFrom = scaleLinear()
                            .domain([zoomFrom, zoomFrom*zoomRange[0]])
                            .range([alphaRange[1], alphaRange[0]])
                            .clamp(true);
        const opacityTo = scaleLinear()
                        .domain([zoomTo * zoomRange[1], zoomTo])
                        .range([alphaRange[0], alphaRange[1]])
                        .clamp(true);
        
        this._transitionOn = true;
        from.container().animate({
            time:duration,
            scale: zoomRange[0]*zoomFrom,
            ease,
            callbackOnComplete: ()=>{ 
                this._transitionOn = false;

                this._event.call("beforeOut", null, from);

                from._event.call("afterOut");
                this._container.removeChild(from.container());
                from.container().scale.x = zoomFrom;
                from.container().scale.y = zoomFrom;

            }
        })
        to.container().animate({
            time: duration,
            scale: zoomTo,
            ease,
            callbackOnComplete: () => { 
                this._transitionOn = false;

                this._event.call("beforeIn", null, to);
                to._event.call("afterIn");
            }
        })
        const ra = ()=>{
            if(!this._transitionOn) return;
            const kFrom = from.container().scale.x;
            const kTo = to.container().scale.x;
            from.container().alpha = opacityFrom(kFrom);
            from._event.call("out");

            to.container().alpha = opacityTo(kTo);
            to._event.call("in");

            this._event.call("out", null, from);
            this._event.call("in", null, to);

            requestAnimationFrame(ra);
        }
        requestAnimationFrame(ra);
    }
    get transitionOn(){
        return this._transitionOn;
    }
}

class transitionContainer{
    _container; // viewport
    _event = dispatch(
        "beforeIn", "in", "afterIn",
        "beforeOut", "out", "afterOut"
    );
    container(c){
        if(c==null) return this._container;
        this._container = c;
        if(this._container.name==null){
            this._container.name = Math.random().toString(36).slice(-8);
        }
        return this;
    }
    on(evt, fn){
        this._event.add(evt, fn);
        return this;
    }
    name(n){
        if (n == null) return this._container.name;
        this._container.name=n;
        return this;
    }
}

export {useTransition, transitionContainer}