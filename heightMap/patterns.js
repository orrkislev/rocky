function createHeightMap() {
    let c_map = createGraphics(width * 2, width)
    c_map.noStroke()
    const mapSize = p(c_map.width, c_map.height)
    const scaler = mapSize.x / 100
    const c_size = scaler * random(2, 20)

    const mapType = choose([0, 1, 2, 3, 4, 5, 6])

    if (mapType == 0) {
        c_map.background(127)
        c_map.noStroke()
        const sumCircles = random(50, 1000)
        for (let i = 0; i < sumCircles; i++) {
            fillShape(c_map, new Circle(randomIn(mapSize), random(c_size)), null, 255, random(30, 100), random(scaler * 2))
            fillShape(c_map, new Circle(randomIn(mapSize), random(c_size)), null, 0, random(30, 100))
        }

    } else if (mapType == 1) {
        c_map.background(127)
        for (let i = 0; i < 500; i++) {
            const radius = c_size * random(.05, .3)
            const shape = new Circle(randomIn(mapSize), radius).wonky(.5, 1.6)

            fillShape(c_map, shape, p(scaler * 2, scaler * 2), 255, random(100, 255), random(scaler, scaler * 4))
            fillShape(c_map, shape.offset(-scaler, true), null, 0, random(100, 255), random(scaler * 2))
        }
    } else if (mapType == 2) {
        c_map.background(127)
        c_map.noFill()
        const pathCreator = new PathCreator(mapSize.x, mapSize.y)
        const sumLines = random(200, 1000)
        for (let i = 0; i < sumLines; i++) {
            path = pathCreator.createPath()

            c_map.drawingContext.filter = `blur(${scaler * random(2, 6)}px)`
            c_map.stroke(255, 200)
            c_map.strokeWeight(scaler)
            fillShape(c_map, path, p(scaler * 2, scaler * 2))
            c_map.drawingContext.filter = `blur(${random(scaler * 2)}px)`
            c_map.strokeWeight(scaler * .5)
            c_map.stroke(0, random(50, 150))
            fillShape(c_map, path)
        }
    } else if (mapType == 3) {
        const sampler = new HexagonGridSampler(mapSize.x, mapSize.y)
        c_map.background(255)
        for (let i = 0; i < 1000; i++) {
            const pos = sampler.sample()
            hole(c_map, pos, sampler.r * random(.1, .5))
        }
        c_map.drawingContext.filter = `none`
    } else if (mapType == 4) {
        c_map.background(127)
        const cellSize = scaler * random(2, 10)
        c_map.loadPixels()
        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                const vx = 1 - (x % cellSize) / cellSize
                const vy = 1 - (y % cellSize) / cellSize
                c_map.set(x, y, vx * 127 + vy * 127)
            }
        }
        c_map.updatePixels()
    } else if (mapType == 5) {
        c_map.background(127)
        const areas = Array(round_random(20, 150)).fill().map(_ => ({ pos: p(mapSize.x * random(-.2, 1.2), mapSize.y * random(-.2, 1.2)), clr: random(255), d: 0 }))
        const thickness = random(10, 45)
        c_map.loadPixels()
        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                const pos = p(x, y)
                areas.forEach(area => area.d = pos.getDistance(area.pos))
                const ordered = areas.sort((a, b) => a.d < b.d ? -1 : 1)

                const n = 255 - noise(x / 100, y / 100) * 80
                let cc = ordered[1].d - ordered[0].d
                if (cc < thickness) c_map.set(x, y, smoothMap(cc, 0, thickness, n, 127))
                else c_map.set(x, y, ordered[0].d)
            }
        }
        c_map.updatePixels()
    } else if (mapType == 6) {
        c_map.loadPixels()
        const ratioNoiseScale = random(100, 400)
        const ratioForce = random(100, 400)
        const noiseScale = random(200)
        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                const ratio = noise(x / ratioNoiseScale, y / ratioNoiseScale)
                const noiseScaleX = noiseScale + ratio * ratioForce
                const noiseScaleY = noiseScale + ratio / ratioForce
                const n = noise(x / noiseScaleX, y / noiseScaleY)
                c_map.set(x, y, n * 255)
            }
        }
        c_map.updatePixels()
    }

    // smearPath = new Path([
    //     p(0.1 * mapSize.x, 0.2 * mapSize.y),
    //     p(0.3 * mapSize.x, 0.7 * mapSize.y),
    //     p(0.5 * mapSize.x, 0.2 * mapSize.y),
    //     p(0.7 * mapSize.x, 0.7 * mapSize.y),
    //     p(0.9 * mapSize.x, 0.2 * mapSize.y),
    // ])
    // smearPath.smooth()
    // // s_map = smear(c_map, smearPath, 100, 30)

    for (let i = 0; i < 5; i++) 
        c_map = swirl(c_map, p(random(mapSize.x), random(mapSize.y)), random(300) * sign(random(-1, 1)), random(mapSize.x / 4))

    // s_map = tracks(s_map, new Path([p(0, 0), p(mapSize.x, mapSize.y)]), 100, 30)
    for (let i = 0; i < 3; i++)
        ammonite(c_map, randomIn(mapSize), random(10, 50))

    // footPrint(s_map)

    return c_map
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

function hole(img, pos, r) {
    if (!pos) return
    img.fill(0, 100)
    img.drawingContext.filter = `blur(${r * random(.5, 1.5)}px)`
    img.circle(pos.x, pos.y, r)
    img.circle(pos.x, pos.y, r / 2)
}


class PathCreator {
    constructor(w, h, pathType) {
        if (!pathType) pathType = choose([pathTypes.noiseField, pathTypes.randomWalker, pathTypes.straightLines])
        this.w = w; this.h = h; this.pathType = pathType
        this.segmentLength = this.w * random(.02, .1)
        this.pathType.init(this)
    }

    createPath(start, l) {
        let pos = start ?? p(this.w * random(-0.2, 1.2), this.h * random(-0.2, 1.2))
        l = l ?? random(10, 300)

        this.pathType.initPath(this)

        const path = new Path()
        while (path.length < l) {
            const dir = this.pathType.getDirection(this, pos)
            pos = pos.add(dir)
            path.add(pos.x, pos.y)
        }
        path.smooth()
        return path
    }
}

const pathTypes = {
    noiseField: {
        init: pathCreator => pathCreator.noiseScale = pathCreator.w * random(0.02, 0.2),
        initPath: () => { },
        getDirection: (pathCreator, pos) => {
            const n = noise(1000 + pos.x / pathCreator.noiseScale, 1000 + pos.y / pathCreator.noiseScale)
            return pointFromAngle(n * 360, random(pathCreator.segmentLength))
        }
    }, randomWalker: {
        init: () => { },
        initPath: () => { },
        getDirection: (pathCreator, pos) => pointFromAngle(random(360), random(pathCreator.segmentLength))
    }, straightLines: {
        init: () => { },
        initPath: pathCreator => pathCreator.direction = random(360),
        getDirection: (pathCreator, pos) => pointFromAngle(pathCreator.direction, random(pathCreator.segmentLength))
    }
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
    image(normalMap, 0, 0, width, height)
    return normalMap
}

function calc_normal(heightMap, x, y) {
    const h1 = heightMap.get(x + 1, y)[0]
    const h2 = heightMap.get(x, y + 1)[0]
    const h3 = heightMap.get(x - 1, y)[0]
    const h4 = heightMap.get(x, y - 1)[0]
    const n = createVector(h1 - h3, h2 - h4, 0)
    n.normalize()
    return n
}