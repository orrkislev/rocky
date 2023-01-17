const vert = `
attribute vec3 aPosition; attribute vec2 aTexCoord; varying vec2 vTexCoord;
void main() { vTexCoord = aTexCoord; vec4 positionVec4 = vec4(aPosition, 1.0); positionVec4.xy = positionVec4.xy * 2.0 - 1.0; gl_Position = positionVec4; }
`

const fragSwirl = `
precision mediump float; 
#define PI 3.1415926535897932384626433832795
varying vec2 vTexCoord; uniform sampler2D texture; uniform vec2 resolution; uniform vec2 pos; uniform float radius; uniform float strength; 
vec2 rotate(vec2 v, float a) { float s = sin(a / 180.0 * PI); float c = cos(a / 180.0 * PI); mat2 m = mat2(c, -s, s, c); return m * v; }
float easeOutQuad(float t) { return t * (2.0 - t); }
void main() { vec2 pixel = vTexCoord * resolution; vec4 origTex = texture2D(texture,vTexCoord); float dist = distance(pixel, pos); if (dist > radius) { gl_FragColor = origTex; return; } float rotation = strength * (1. - easeOutQuad(dist / radius)); vec2 relPos = rotate(pixel - pos, rotation); vec2 p2 = pos + relPos; p2.x = clamp(p2.x, 0.0, resolution.x); p2.y = clamp(p2.y, 0.0, resolution.y); vec4 col = texture2D(texture, p2/resolution); gl_FragColor = col; }
`

const fragVoronoi = `
precision mediump float; varying vec2 vTexCoord; uniform vec2 resolution; uniform float seed; uniform float scale;
vec2 hash22(vec2 p) { return fract(vec2(262144, 32768)*sin(dot(p, vec2(41. + seed, 289. + seed)))); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
float smin2(float a, float b, float r){ float f = max(0., 1. - abs(b - a)/r);return min(a, b) - r*.25*f*f;}
float sminExp(float a, float b, float k){ return -log(exp(-k*a) + exp(-k*b))/k; }
float Voronoi(in vec2 p){vec2 g = floor(p), o; p -= g;vec3 d = vec3(8.);for(int j = -1; j < 2; j++){for(int i = -1; i < 2; i++){o = vec2(i, j);o += hash22(g + o) - p;d.z = length(o); d.y = max(d.x, smin(d.y, d.z, .4));d.x = smin(d.x, d.z, .2);}}    return d.y - d.x;    }
void main(){vec2 uv = vTexCoord.xy * .5; uv.y *= .5;gl_FragColor = vec4(sqrt(vec3(Voronoi(uv*(.5 + length(uv)*1.3) * scale*5.))), 1.);}
`

let scaler
const ms = (x) => scaler * x
const rs = (a, b) => scaler * random(a, b)
function createHeightMap() {
    let c_map = createGraphics(round(height), round(height / 2))
    c_map.background(random(50, 120))
    const mapSize = V(c_map.width, c_map.height)
    scaler = mapSize.x / 100

    const mapType = choose([0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3])

    if (mapType == 0 || mapType == 1) {
        const pathCreator = new PathCreator(mapSize.x, mapSize.y)
        const pointGenerator = new PointGenerator(mapSize.x, mapSize.y)
        const painter = new Painter(c_map)

        if (mapType == 0) {
            const sumCircles = random(100, 1000)
            const options = Array(4).fill(0).map((_, i) => choose([0, 1, 2]))
            for (let i = 0; i < sumCircles; i++) {
                const ct = choose(options)
                const pt = pointGenerator.getPoint()
                if (ct == 0) painter.drawCircle(pt, rs(1, 10))
                if (ct == 1) painter.hole(pt, rs(.5, 4))
                if (ct == 2) painter.crater(pt, rs(.5, 4))
            }
        } else if (mapType == 1) {
            const numLines = random(200, 1000)
            for (let i = 0; i < numLines; i++) {
                path = pathCreator.createPath(pointGenerator.getPoint())
                painter.drawLine(path)
            }
        }



    } else if (mapType == 2) {
        c_map.loadPixels()
        const ratioNoiseScale = random(10)
        const ratioForce = random(5)
        const noiseScale = random(2, 6)
        for (let y = 0; y < mapSize.y; y++) {
            const percY = y / mapSize.y
            for (let x = 0; x < mapSize.x; x++) {
                const percX = x / mapSize.x
                const ratio = noise(percX * ratioNoiseScale, percY * ratioNoiseScale)
                const noiseScaleX = noiseScale + ratioForce * ratio
                const noiseScaleY = noiseScale + ratioForce / ratio
                const n = noise(noiseScaleX * percX, noiseScaleY * percY)
                c_map.set(x, y, n * 255)
            }
        }
        c_map.updatePixels()

    } else if (mapType == 3) {
        initShaderGraphics(c_map, false, true)
        shaderGraphics.noStroke()
        shaderGraphics.shader(voronoiShader)
        voronoiShader.setUniform('resolution', [c_map.width, c_map.height])
        voronoiShader.setUniform('seed', random(1000))
        voronoiShader.setUniform('scale', random(.4, 7))
        shaderGraphics.rect(0, 0, c_map.width, c_map.height)
        c_map.image(shaderGraphics, 0, 0, c_map.width, c_map.height)
    } else if (mapType == 4) {
        const painter = new Painter(c_map)
        const numLines = random(200, 1000)
        const center = V(random(mapSize.x), random(mapSize.y))
        for (let i = 0; i < numLines; i++) {
            const a = random(360)
            const start = angleVec(a, rs(3, 30)).add(center)
            const end = angleVec(a, mapSize.x * 1.5).add(center)
            path = toCrv([start, end])
            painter.drawLine(path)
        }
    }


    for (let i = 1; i < 4; i++) {
        const deformType = choose([0, 1, 2, 2])
        if (deformType == 0)
            c_map = swirl(c_map, V(random(mapSize.x), random(mapSize.y)), ms(60), random(mapSize.x / 4))
        if (deformType == 1)
            c_map = smear(c_map, rs(4, 16), rs(2, 6))
    }

    const sumAmmonites = random() < 0.8 ? 0 : random(2, 5)
    for (let i = 0; i < sumAmmonites; i++) ammonite(c_map, V(random(mapSize.x), random(mapSize.y)), rs(1, 5))
    const sumBushes = random() < 0.4 ? 0 : random(2, 5)
    for (let i = 0; i < sumBushes; i++) bush(c_map, V(random(mapSize.x), random(mapSize.y)), rs(1, 5))

    return c_map
}


class Painter {
    constructor(img) {
        this.img = img
        this.clrthr = random() * random()
        this.fllthr = constrain(random() < 0.5 ? random() * random() : 1 - random() * random(), 0.1, 0.9)

    }

    getColor = () => random() < this.clrthr ? 0 : 255
    getFill = () => random() > this.fllthr
    getAlpha = () => random(100, 255)
    getBlur = () => rs(0, 3)

    drawPath(path, offset = V(0, 0)) {
        this.img.beginShape()
        for (let i = 0; i < path.length; i++) {
            const pos = path[i]
            this.img.vertex(pos.x + offset.x, pos.y + offset.y)
        }
        this.img.endShape()
    }

    drawLine(path) {
        if (path.length > this.img.width / 10 && this.getFill()) {
            this.img.noStroke()
            const alpha =
                this.img.fill(this.getColor(), this.getAlpha())
        } else {
            this.img.stroke(this.getColor(), this.getAlpha())
            this.img.strokeWeight(rs(0, 1))
            this.img.noFill()
        }
        this.img.drawingContext.filter = `blur(${this.getBlur()}px)`
        this.drawPath(path)
    }

    drawCircle(pos, r) {
        let shape = []
        for (let a = 0; a < 360; a += 10) {
            shape.push(V(pos.x + r * cos(a), pos.y + r * sin(a)))
        }
        shape = toCrv(shape)
        this.drawLine(shape)
    }

    hole(pos, r) {
        this.img.fill(0, 100)
        this.img.drawingContext.filter = `blur(${r * random(.5, 1.5)}px)`
        this.img.circle(pos.x, pos.y, r)
        this.img.circle(pos.x, pos.y, r / 2)
    }

    crater(pos, r) {
        let shape = []
        for (let a = 0; a < 360; a += 30) {
            const shapePos = angleVec(a, r)
            const n = noise(shapePos.x, shapePos.y) + .5
            shapePos.mult(n).add(pos)
            shape.push(shapePos)
        }
        shape = toCrv(shape)

        this.img.noStroke()
        this.img.drawingContext.filter = `blur(${rs(1, 4)}px)`
        this.img.fill(255, random(100, 255))
        this.drawPath(shape, V(ms(2), ms(2)))
        this.img.fill(0, random(100, 255))
        this.drawPath(shape)
    }
}



function fillShape(img, path, offset, clr, alpha = 255, blur) {
    if (blur) img.drawingContext.filter = `blur(${blur}px)`
    if (clr != null) img.fill(clr, alpha)
    offset = offset || p(0, 0)

    img.beginShape()
    for (let i = 0; i < path.length; i++) {
        const pos = path.getPointAt(i)
        img.vertex(pos.x + offset.x, pos.y + offset.y)
    }
    img.endShape()
}


function createNormalMap(heightMap) {
    const normalMap = createGraphics(heightMap.width, heightMap.height)
    heightMap.loadPixels()
    normalMap.loadPixels()
    for (let x = 0; x < heightMap.width; x++) {
        for (let y = 0; y < heightMap.height; y++) {
            const n = calc_normal(heightMap, x, y)
            normalMap.set(x, y, color(n.x * 127 + 127, n.y * 127 + 127, n.z * 127 + 127))
        }
    }
    normalMap.updatePixels()
    return normalMap
}

function calc_normal(hm, x, y) {
    const h1 = hm.get(x + 1, y)[0]
    const h2 = hm.get(x, y + 1)[0]
    const h3 = hm.get(x - 1, y)[0]
    const h4 = hm.get(x, y - 1)[0]
    const n = v(h1 - h3, h2 - h4, 0)
    n.normalize()
    return n
}

let shaderGraphics, shaderResultGraphics, swirlShader, voronoiShader

function initShaderGraphics(img, initSwirlShader = false, initVoronoiShader = false) {
    if (!shaderGraphics) shaderGraphics = createGraphics(img.width, img.height, WEBGL)
    if (!shaderResultGraphics) shaderResultGraphics = createGraphics(img.width, img.height)
    if (initSwirlShader && !swirlShader) swirlShader = shaderGraphics.createShader(vert, fragSwirl)
    if (initVoronoiShader && !voronoiShader) voronoiShader = shaderGraphics.createShader(vert, fragVoronoi)
}

function swirl(img, pos, ammount, r) {
    initShaderGraphics(img, true, false)
    shaderGraphics.noStroke()
    shaderGraphics.shader(swirlShader)
    swirlShader.setUniform('texture', img)
    swirlShader.setUniform('resolution', [img.width, img.height])
    swirlShader.setUniform('pos', [pos.x, pos.y])
    swirlShader.setUniform('strength', ammount)
    swirlShader.setUniform('radius', r)
    shaderGraphics.rect(0, 0, img.width, img.height)
    shaderResultGraphics.image(shaderGraphics, 0, 0, shaderResultGraphics.width, shaderResultGraphics.height)
    return shaderResultGraphics
}

function smear(img, strength, r) {
    const p1 = V(random(img.width), random(img.height))
    const p2 = V(random(img.width), random(img.height))
    const middle = vadd(p1, p2).div(2)
    const dir = vsub(p2, p1).rotate(90).normalize(random(-500, 500) * PS)
    const center = vadd(middle, dir)
    const angleStart = (vsub(p1, center).heading() + 360) % 360
    const angleEnd = (vsub(p2, center).heading() + 360) % 360
    const angleA = min(angleStart, angleEnd)
    const angleB = max(angleStart, angleEnd)
    const radius = vsub(p1, center).mag()

    func = pos => {
        const rel = vsub(pos, center)
        const heading = (rel.heading() + 360) % 360
        if (heading <= angleB && heading >= angleA) {
            const distToEdge = max(heading - angleA, angleB - heading)
            const relStrength = 1 - distToEdge / (angleB - angleA)
            return [abs(vsub(pos, center).mag() - radius), relStrength]
        }
        return [1000, 0]
    }
    smearFunc = (pos, strength) => vsub(pos, center).rotate(strength).add(center)

    const c = createGraphics(img.width, img.height)
    c.image(img, 0, 0)
    c.loadPixels()
    for (let x = 0; x < c.width; x++) {
        for (let y = 0; y < c.height; y++) {
            const mapPos = V(x, y)
            const [d, relativeStrength] = func(mapPos)
            if (d > r) continue

            const relativeStrength2 = (1 - easeOutQuad(d / r)) * strength
            const p2 = smearFunc(mapPos, relativeStrength2 * relativeStrength)
            const c2 = c.get(
                constrain(p2.x, 0, c.width - 1),
                constrain(p2.y, 0, c.height - 1))
            c.set(x, y, c2)
        }
    }
    c.updatePixels()
    return c
}


function ammonite(img, pos, maxr) {
    const c = createGraphics(img.width, img.height)
    c.strokeWeight(4)

    const revolutions = random(2, 5)
    let spiralPath = []
    for (let r = 0; r < maxr; r += 1.5) {
        const a = map(r, 0, maxr, 0, 360 * revolutions)
        const p = angleVec(a, r)
        spiralPath.push(vadd(p, pos))
    }
    spiralPath = toCrv(spiralPath)
    const rl = spiralPath.length / (revolutions * 3)
    for (let i = 0; i < spiralPath.length; i++) {
        const pathPoint = spiralPath[i]
        const normal = vsub(pathPoint, pos).normalize()
        const d = maxr
        for (let j = 0; j <= d; j += 1) {
            const newPos = vadd(pathPoint, vmul(normal, j))
            const roundVal = sin(180 * j / d)
            const ridgeVal = 1 - sin(180 * (i % rl) / rl)
            c.stroke(50 + ridgeVal * roundVal * 200, 100)
            c.line(newPos.x, newPos.y, newPos.x, newPos.y)
        }
    }
    img.image(c, 0, 0)
    img.resetMatrix()
}

function bush(img, pos, r) {
    const bushImg = createGraphics(img.width, img.height)
    bushImg.translate(pos.x, pos.y)
    for (let i = 0; i < 200; i++) {
        const rot_z = random(180)
        const rot = random(360)
        const d = cos(rot_z) * r
        const p2 = angleVec(rot, d)
        for (let j = 0; j < d; j++) {
            const x = p2.x / d * j
            const y = p2.y / d * j
            const val = j / d
            bushImg.stroke(255, val * 255)
            bushImg.line(x, y, x, y)
        }
    }
    img.image(bushImg, 0, 0)
}


class PathCreator {
    constructor(w, h, pathType) {
        if (!pathType) pathType = choose(Object.values(PathCreator.pathTypes))
        this.w = w; this.h = h; this.pathType = pathType

        this.segmentLength = this.w * random(0.001, .01)
        this.pathLengths = choose([null, random(50, 300)])

        this.pathType.init(this)
    }

    createPath(startingPoint) {
        this.pathType.initPath(this)

        let pos = this.pathType.getStartingPoint(this) || startingPoint || V(random(this.w), random(this.h))

        const path = []
        const l = this.pathLengths || random(50, 300)
        while (path.length < l) {
            const dir = this.pathType.getDirection(this, pos)
            pos = pos.add(dir)
            path.push(pos.copy())
        }
        const crv = toCrv(path)
        return crv
    }

    static pathTypes = {
        noiseField: {
            name: 'noise field',
            init: pathCreator => pathCreator.noiseScale = pathCreator.w * random(0.02, 0.2),
            initPath: () => { }, getStartingPoint: () => { },
            getDirection: (pathCreator, pos) => {
                const n = noise(1000 + pos.x / pathCreator.noiseScale, 1000 + pos.y / pathCreator.noiseScale)
                return angleVec(n * 360, random(pathCreator.segmentLength))
            }
        }, randomWalker: {
            name: 'random walker',
            init: () => { }, initPath: () => { }, getStartingPoint: () => { },
            getDirection: (pathCreator, pos) => angleVec(random(360), pathCreator.segmentLength * random(10))
        }, straightLines: {
            name: 'straight lines',
            init: () => { },
            initPath: pathCreator => pathCreator.direction = random(360),
            getStartingPoint: () => { },
            getDirection: (pathCreator, pos) => angleVec(pathCreator.direction, random(pathCreator.segmentLength))
        }, outwards: {
            name: 'outwards',
            init: pc => { pc.center = V(random(pc.w), random(pc.h)); pc.pathLengths = pc.w },
            initPath: pc => {
                pc.angle = random(360)
                if (random() < 0.01) pc.center = V(random(pc.w), random(pc.h))
            },
            getStartingPoint: pc => pc.center.copy(),
            getDirection: (pathCreator, pos) => angleVec(pathCreator.angle, random(pathCreator.segmentLength))
        }
    }

}


class PointGenerator {
    constructor(w, h, generatorType, data) {
        this.generatorType = generatorType || choose(Object.values(PointGenerator.gts))
        this.w = w; this.h = h

        this.generatorType.init(this)
        if (data) this.data = data
    }
    getPoint() {
        return this.generatorType.getPoint(this)
    }


    static gts = {
        random: {
            name: 'random',
            init: () => { },
            getPoint: (pg) => V(pg.w * random(), pg.h * random())
        },
        grid: {
            name: 'grid',
            init: (pg) => {
                pg.data = pg.w * random(.02, .1)
            },
            getPoint: (pg) => {
                let y = round_random(0, pg.h / pg.data)
                let x = round_random(0, pg.w / pg.data)
                return V(x * pg.data, y * pg.data)
            }
        },
        hexGrid: {
            name: 'hex grid',
            init: (pg) => {
                pg.data = pg.w * random(.02, .1)
            },
            getPoint: (pg) => {
                let y = round_random(0, pg.h / pg.data)
                let x = round_random(0, pg.w / pg.data)
                if (y % 2 == 0) x -= .5
                return V(x * pg.data, y * pg.data)
            }
        },
        distribution: {
            name: 'distribution',
            init: (pg) => {
                pg.data = pg.w * random(.1, .5)
                pg.points = []
            },
            getPoint: (pg) => {
                if (pg.points.length == 0) {
                    pg.points.push(V(random(pg.w), random(pg.h)))
                    return pg.points[0]
                }
                let tries = 0
                while (tries < 100) {
                    const pos = V(random(pg.w), random(pg.h))
                    for (const pos2 of pg.points) {
                        if (vdist(pos, pos2) < pg.data) {
                            tries++
                            continue
                        }
                    }
                    pg.points.push(pos)
                    return pos
                }
            }
        }
    }
}

