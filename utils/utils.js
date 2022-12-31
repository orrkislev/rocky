let finalImage
function finishImage() {
    finalImage = get()
    // windowResized()
}

// function windowResized() {
//     if (!finalImage) finalImage = get()
//     resizeCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
//     resetMatrix()
//     image(finalImage, 0, 0, width, height)
// }

function preload() {
    if (typeof preloadShader === "function") preloadShader()
    if (typeof preloadFont === "function") preloadFont()
    if (typeof preloadImage === "function") preloadImage()
}


const v = (x, y) => createVector(x, y)
const vvv = (x, y, z) => createVector(x, y, z)
const p = (x, y) => new paper.Point(x, y)

const random = (a = 1, b = 0) => fxrand() * (b - a) + a
const randomRange = (range) => random(range[0], range[1])
const round_random = (a = 1, b = 0) => Math.floor(random(a, b + 1))
const choose = (arr) => arr[Math.floor(random(arr.length))]

class HexagonGridSampler {
    constructor(w, h) {
        this.w = w; this.h = h; 
        this.r = random(this.w * .02, this.w * .1)
    }
    sample() {
        let y = round_random(0, this.h / this.r)
        let x = round_random(0, this.w / this.r)
        if (y % 2 == 0) x -= .5
        return p(x * this.r, y * this.r)
    }
}

class PoissonDiscSampler {
    constructor(w, h) {
        this.w = w; this.h = h; 
        this.k = 30
        this.r = random(this.w * .02, this.w * .1)
        this.r2 = this.r * this.r
        this.cellSize = this.r / Math.SQRT2
        this.gridWidth = Math.ceil(w / this.cellSize)
        this.gridHeight = Math.ceil(h / this.cellSize)
        this.grid = new Array(this.gridWidth * this.gridHeight)
        this.queue = []
        this.queue.push(this.samplePoint(random(w), random(h)))
    }
    samplePoint(x, y) {
        const p = v(x, y)
        const i = Math.floor(x / this.cellSize)
        const j = Math.floor(y / this.cellSize)
        this.grid[i + j * this.gridWidth] = p
        this.queue.push(p)
        return p
    }
    sample() {
        while (this.queue.length) {
            const i = Math.floor(random(this.queue.length))
            const s = this.queue[i]
            for (let j = 0; j < this.k; j++) {
                const a = random(360)
                const r = Math.sqrt(random(3) * this.r2 + this.r2)
                const x = s.x + r * cos(a)
                const y = s.y + r * sin(a)
                if (0 <= x && x < this.w && 0 <= y && y < this.h && !this.isNearby(x, y)) {
                    return this.samplePoint(x, y)
                }
            }
            this.queue[i] = this.queue[this.queue.length - 1]
            this.queue.pop()
        }
    }
    isNearby(x, y) {
        const i = Math.floor(x / this.cellSize)
        const j = Math.floor(y / this.cellSize)
        const i0 = Math.max(i - 2, 0)
        const j0 = Math.max(j - 2, 0)
        const i1 = Math.min(i + 3, this.gridWidth)
        const j1 = Math.min(j + 3, this.gridHeight)
        for (let j = j0; j < j1; j++) {
            const o = j * this.gridWidth
            for (let i = i0; i < i1; i++) {
                const s = this.grid[o + i]
                if (s) {
                    const dx = s.x - x
                    const dy = s.y - y
                    if (dx * dx + dy * dy < this.r2) {
                        return true
                    }
                }
            }
        }
        return false
    }
}



Array.prototype.pushArray = function pushArray(arr) {
    arr.forEach(element => this.push(element));
}
Array.prototype.get = function get(i) {
    return this[i % this.length]
}
Array.prototype.rotateShape = function rotateShape(a) {
    const sumToRotate = this.length * a / 360
    for (let i = 0; i < sumToRotate; i++) this.push(this.shift())
    return this
}
function applyRemove(func) {
    push()
    noStroke()
    fill(0)
    blendMode(REMOVE)
    func()
    pop()
}

const easeInOutExpo = (x) => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2
const easeOutQuad = (x) => 1 - (1 - x) * (1 - x)
const easeOutQuad_reverse = (x) => 1 - sqrt(1 - x)
const smoothMap = (x, a, b, c, d) => easeInOutExpo(map(x, a, b, 0, 1)) * (d - c) + c

function twoBitToHex(v) {
    return Math.floor(v).toString(16).padStart(2, "0")
}
function grayscaleColor(v, alpha = 255) {
    const hex = twoBitToHex(v)
    return `#${hex}${hex}${hex}${twoBitToHex(alpha)}`
}