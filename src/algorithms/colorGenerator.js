class ColorGenerator {
    mem = {}

    randomColor(i) {
        if (this.mem[i] != null) {
            return this.mem[i];
        }
        const r = Math.round(Math.random() * 255);
        const g = Math.round(Math.random() * 255);
        const b = Math.round(Math.random() * 255);
        const color = (r << 16) + (g << 8) + b;
        this.mem[i] = color;
        return color;
    }

    clear(){
        this.mem={};
    }
}

export default ColorGenerator;