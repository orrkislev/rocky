// --- AB Random

class Random {
    constructor() {
        this.usage = 0
        this.useA = false;
        this.sfc32 = function (uint128Hex) {
            let a = parseInt(uint128Hex.substr(0, 8), 16);
            let b = parseInt(uint128Hex.substr(8, 8), 16);
            let c = parseInt(uint128Hex.substr(16, 8), 16);
            let d = parseInt(uint128Hex.substr(24, 8), 16);
            return function () {
                a |= 0; b |= 0; c |= 0; d |= 0;
                let t = (((a + b) | 0) + d) | 0;
                d = (d + 1) | 0;
                a = b ^ (b >>> 9);
                b = (c + (c << 3)) | 0;
                c = (c << 21) | (c >>> 11);
                c = (c + t) | 0;
                return (t >>> 0) / 4294967296;
            };
        };
        // seed prngA with first half of tokenData.hash
        this.prngA = new this.sfc32(tokenData.hash.substr(2, 32));
        // seed prngB with second half of tokenData.hash
        this.prngB = new this.sfc32(tokenData.hash.substr(34, 32));
        for (let i = 0; i < 1e6; i += 2) {
            this.prngA();
            this.prngB();
        }
    }

    reset(times) {
        this.prngA = new this.sfc32(tokenData.hash.substr(2, 32));
        this.prngB = new this.sfc32(tokenData.hash.substr(34, 32));
        for (let i = 0; i < 1e6; i += 2) {
            this.prngA();
            this.prngB();
        }
        for (let i = 0; i < times; i++) {
            this.random_dec()
        }
    }
    // random number between 0 (inclusive) and 1 (exclusive)
    random_dec() {
        this.usage++
        this.useA = !this.useA;
        return this.useA ? this.prngA() : this.prngB();
    }
    // random number between a (inclusive) and b (exclusive)
    random_num(a, b) {
        return a + (b - a) * this.random_dec();
    }
    // random integer between a (inclusive) and b (inclusive)
    // requires a < b for proper probability distribution
    random_int(a, b) {
        return Math.floor(this.random_num(a, b + 1));
    }
    // random value in an array of items
    random_choice(list) {
        return list[this.random_int(0, list.length - 1)];
    }

    random(a = 1, b = 0) { return this.random_num(a, b) }
}

const RANDOM = new Random()



// --- DRAW

// let allDots = 0
// async function drawDotXY(x, y) {
//     allDots++
//     if (allDots % 1000 == 0) await timeout()
//     point(x,y)
//     // line(x, y, x, y)
// }

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}




// -- CURVE
function toCrv(crv) {
    crv.push(crv[crv.length - 1])
    crv.splice(0, 0, crv[0])
    const newCrv = []
    for (let i = 0; i < crv.length - 3; i++) {
        const nextP = crv[i + 1]
        const nextnextP = crv[i + 2]
        const l = vdist(nextP, nextnextP)
        for (let t = 0; t < l; t++) {
            x = curvePoint(crv[i].x, crv[i + 1].x, crv[i + 2].x, crv[i + 3].x, t / l)
            y = curvePoint(crv[i].y, crv[i + 1].y, crv[i + 2].y, crv[i + 3].y, t / l)
            newCrv.push(v(x, y))
        }
    }
    return newCrv
}

const v = (x, y) => createVector(x, y),
    vdist = p5.Vector.dist
    vadd = p5.Vector.add,
    vmul = p5.Vector.mult,
    vsub = p5.Vector.sub
const angleVec = (a, d) => v(cos(a) * d, sin(a) * d)




// --- UTILS
const R = (a = 1, b = 0) => RANDOM.random(a, b)
const R2 = (a = 1, b = 0) => Math.floor(R(a, b + 1))
const R3 = (arr) => arr[Math.floor(R(arr.length))]

const easeInOutExpo = (x) => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2
const easeOutQuad = (x) => 1 - (1 - x) * (1 - x)
const easeOutQuad_reverse = (x) => 1 - sqrt(1 - x)