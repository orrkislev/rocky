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