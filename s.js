let canvas = dgei('c');
let ctx = canvas.getContext('2d');


let W = 128, H = 72;


let screen = {
    w: W,
    h: H,
    scale: 1,
    offsetX : 0,
    offsetY : 0,
}


class APx {
    constructor(q = 0, vx = 0, vy = 0, h = 0) {
        this.q = q;
        this.vx = vx;
        this.vy = vy;
        this.h = h;
    }
    add(o) {
        return new APx(this.q + o.q, this.vx + o.vx, this.vy + o.vy, this.h + o.h);
    }
    scale(c) {
        return new APx(this.q * c, this.vx * c, this.vy * c, this.h * c);
    }
    composite(o, c) {
        let a = o.q * c;
        if (this.q + a == 0) {
            return new APx(0, 0, 0, 0);
        }
        return new APx(this.q + a, (this.vx * this.q + o.vx * a)/(this.q + a),
            (this.vy * this.q + o.vy * a)/(this.q + a), (this.h * this.q + o.h * a)/(this.q+a)
        );
    }
}


class BPx {
    constructor(q = 0, tx = 0, ty = 0) {
        this.q = q;
        this.tx = tx;
        this.ty = ty;
    }
    add(o) {
        return new BPx(this.q + o.q, this.tx + o.tx, this.ty + o.ty);
    }
    scale(c) {
        return new BPx(this.q * c, this.tx * c, this.ty * c);
    }
    composite(o, c) {
        let a = o.q * c;
        if (this.q + a == 0) {
            return new BPx(0,0,0);
        }
        return new BPx(this.q + a, (this.tx * this.q + o.tx * a)/(this.q + a),
            (this.ty * this.q + o.ty * a)/(this.q + a)
        );
    }
}


class PRNG
{
    constructor(seed)
    {
        //Will return in range 0 to 1 if seed >= 0 and -1 to 0 if seed < 0.
        this.seed = seed;
    }


    Next()
    {
        this.seed++;
        let a = this.seed * 15485863;
        return (a * a * a % 2038074743) / 2038074743;
    }
}


let RNG = new PRNG(0);


let sample1 = {
    reset() {
        this.A = Array2D(W, H, APx);
        this.B = Array2D(W, H, BPx);
    }
}
let sample2 = {
    reset() {
        this.A = Array2D(W, H, APx);
        this.B = Array2D(W, H, BPx);
    }
}
sample1.reset();
sample2.reset();


//----interesting test cases below
/*sample1.A[20][20] = new APx(400, -0.6, .8, 1);
sample1.A[10][10] = new APx(20, -3, 1, 1);
sample1.A[10][20] = new APx(20, 0.3, -1, 1);*/


sample1.A[25][25] = new APx(70, -0.6, .8, 1);
sample1.A[15][15] = new APx(20, -3, 1, 1);
sample1.A[15][25] = new APx(20, 0.3, -1, 1);


sample1.A[44][36] = new APx(1000, 0, 0, 1); 
sample1.A[12][12] = new APx(20, -3, 1, 1);
sample1.A[128 -12][22] = new APx(100, 0.3, -1, 1);


/*sample1.A[31][10] = new APx(30, .1, -.3, 1);
sample1.A[21][20] = new APx(20, 0, -0, 1);
sample1.A[20][22] = new APx(20, -0, 0, 1);


sample1.A[20][15] = new APx(10, 0, 0, 1);
sample1.A[20][20] = new APx(40, 0.4, 0, 1);*/


resize();
function resize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w > h * 16/9) {
        screen.scale = h / H;
        screen.offsetX = (w - h * 16/9)/2;
        screen.offsetY = 0;
        w = Math.round(h * 16/9);
    } else {
        screen.scale = w / W;
        screen.offsetY = (h - w * 9/16)/2;
        screen.offsetX = 0;
        h = Math.round(w * 9/16);
    }
    screen.w = w;
    screen.h = h;
    canvas.style.marginLeft = screen.offsetX + 'px';
    canvas.style.marginTop = screen.offsetY + 'px';
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.transform(1,0,0,1,0,0);
    ctx.scale(screen.scale, screen.scale);
}
window.addEventListener('resize', resize);




let now = performance.now();
let then = now;
let delta = 0;
window.requestAnimationFrame(mainloop);
function mainloop() {
    window.requestAnimationFrame(mainloop);
    now = performance.now();
    delta = (now - then)/1000;
    then = now;
   
    ctx.fillStyle = rgba(0,0,0);
    ctx.clearRect(0,0,W,H);
    ctx.fillRect(0,0, W, H);


    for (let i = 0; i < W; i++) {
        for (let j = 0; j < H; j++) {
            let p = sample1.A[i][j];
            //apply gravity here to sample1
            let g = sample1.B[i][j];
            //let g = new BPx(1,32, 18);
            let dist =  Math.sqrt((g.tx - i) * (g.tx - i) + (g.ty - j) * (g.ty - j));
            let theta = Math.atan2(g.ty - j, g.tx - i);
            if (dist > 0) {
                let f = 1000 * g.q * (12 / Math.pow(dist*.3,13) + 6 / Math.pow(dist*.3, 7));
                f = Math.min(f, .4);
                f = Math.max(f, -.4);
                if (p.q > 0 && dist > 1) {
                    //if (i == 0 && j == 0) console.log(f * Math.cos(theta) / p.q);
                    p.vx += f * Math.cos(theta);
                    p.vy += f * Math.sin(theta);
                }
            }
            let t = RNG.Next() * 2 * Math.PI;
            let mag = (RNG.Next() * RNG.Next()) * .12;
            p.vx += mag * Math.cos(t);
            p.vy += mag * Math.sin(t);


            let dx = p.vx;
            let dy = p.vy;
           
            let cx = Math.floor(dx + i) + 1;
            let cy = Math.floor(dy + j) + 1;


            let mx = (dx%1 + 1)%1;
            let my = (dy%1 + 1)%1;


            let nx = 1 - mx;
            let ny = 1 - my;


            let rx1 = posMod(cx-1, W); let ry1 = posMod(cy-1, H);
            let rx = posMod(cx, W); let ry = posMod(cy, H);


            sample2.A[rx1][ry1] = sample2.A[rx1][ry1].composite(p, nx * ny);
            sample2.A[rx][ry1] = sample2.A[rx][ry1].composite(p, mx * ny);
            sample2.A[rx1][ry] = sample2.A[rx1][ry].composite(p, nx * my);
            sample2.A[rx][ry] = sample2.A[rx][ry].composite(p, mx * my);
        }
    }
    for (let i = 0; i < W; i++) {
        for (let j = 0; j < H; j++) {
            let p = sample2.A[i][j]; //produce dissipative spreading field at point
            let r = new BPx(p.q, i, j);
            sample2.B[i][j] = sample1.B[i][j].composite(r, 1);
           
            sample2.B[i][j] = sample2.B[i][j].composite(sample1.B[(i-1+W)%W][j], .38);
            sample2.B[i][j] = sample2.B[i][j].composite(sample1.B[i][(j-1+H)%H], .38);
            sample2.B[i][j] = sample2.B[i][j].composite(sample1.B[(i+1)%W][j], .38);
            sample2.B[i][j] = sample2.B[i][j].composite(sample1.B[i][(j+1)%H], .38);


            sample2.B[i][j].q = Math.max(sample2.B[i][j].q*.4, 0);
        }
    }
    let temp = sample1;
    sample1 = sample2;
    sample2 = temp;
    sample2.reset();


    //render sample1;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < W; i++) {
        for (let j = 0; j < H; j++) {
            let p = sample1.A[i][j];
            let q = sample1.B[i][j];
            let h = Math.min(Math.sqrt(p.vx * p.vx + p.vy * p.vy)*2,1);
            let r = Math.min(p.q, 1);
            let hue;
            //hue = ((-50 + 220*h + 255)%255)/255;
            hue = (160 + 10 * Math.pow(h,.3))/255;
            //hue = 170/255;
            //hue = Math.random();
            ctx.fillStyle = rgba(...hslToRgb(hue, 1, .5 + .3 * h * r), Math.pow(r,.3));
            ctx.fillRect(i, j, 1, 1);
            ctx.fillStyle = rgba(40,0,0, Math.min(q.q, 1));
            //ctx.fillRect(i, j, 1, 1);
        }
    }
}


function dgei(id) {
    return document.getElementById(id);
}
function rgba(r,g,b,a = 1) {
    return 'rgba(' + [r,g,b,a].join(',') + ')';
}
function lerp(a, b, x) {
    return a * x + b * (1-x);
}
function Array2D(w,h, Ptype) {
    let a = new Array(w);
    for (let i = 0; i < w; i++) {
        a[i] = new Array(h);
        for (let j = 0; j < h; j++) {
            a[i][j] = new Ptype();
        }
    }
    return a;
}
function validPx(x, y) {
    return (x >= 0 && x < W) && (y >= 0 && y < H);
}
function getPx(array2d, x, y, Ptype) {
    if (!validPx(x,y)) {
        return new Ptype();
    } else {
        return array2d[x][y];
    }
}


function posMod(x, m) {
    return (x%m + m)%m;
}
function hslToRgb(h, s, l){
    var r, g, b;


    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }


        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }


    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

