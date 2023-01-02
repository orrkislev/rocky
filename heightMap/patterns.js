function createHeightMap() {
    let c_map = createGraphics(width, width / 2)
    c_map.noStroke()
    const mapSize = p(c_map.width, c_map.height)
    const scaler = mapSize.x / 100
    const c_size = scaler * random(2, 20)

    const mapType = choose([0, 1, 2, 3, 6, 7])

    if (mapType == 0) {
        console.time('0 - random circles')
        c_map.background(127)
        c_map.noStroke()
        const sumCircles = random(50, 1000)
        for (let i = 0; i < sumCircles; i++) {
            fillShape(c_map, new Circle(randomIn(mapSize), random(c_size)), null, 255, random(30, 100), random(scaler * 2))
            fillShape(c_map, new Circle(randomIn(mapSize), random(c_size)), null, 0, random(30, 100))
        }
        console.timeEnd('0 - random circles')

    } else if (mapType == 1) {
        console.time('1 - craters')
        c_map.background(127)
        for (let i = 0; i < 500; i++) {
            const radius = c_size * random(.05, .3)
            const shape = new Circle(randomIn(mapSize), radius).wonky(.5, 1.6)

            fillShape(c_map, shape, p(scaler * 2, scaler * 2), 255, random(100, 255), random(scaler, scaler * 4))
            fillShape(c_map, shape.offset(-scaler, true), null, 0, random(100, 255), random(scaler * 2))
        }
        console.timeEnd('1 - craters')

    } else if (mapType == 2) {
        console.time('2 - lines')
        c_map.background(0)
        c_map.noFill()
        const pathCreator = new PathCreator(mapSize.x, mapSize.y)
        const b2lThreshold = random()
        const sumLines = 1000
        for (let i = 0; i < sumLines; i++) {
            path = pathCreator.createPath()

            c_map.drawingContext.filter = `blur(${scaler * random(2, 6)}px)`
            c_map.stroke(255, 200)
            c_map.strokeWeight(scaler * random(2))
            fillShape(c_map, path)
            c_map.drawingContext.filter = `blur(${random(scaler * 2)}px)`
            c_map.strokeWeight(scaler * random())
            c_map.stroke(random() < b2lThreshold ? 0 : 255, random(50, 150))
            fillShape(c_map, path)
        }
        console.timeEnd('2 - lines')

    } else if (mapType == 3) {
        console.time('3 - hexagons')
        const sampler = new HexagonGridSampler(mapSize.x, mapSize.y)
        c_map.background(255)
        for (let i = 0; i < 1000; i++) {
            const pos = sampler.sample()
            hole(c_map, pos, sampler.r * random(.1, .5))
        }
        console.timeEnd('3 - hexagons')

    } else if (mapType == 4) {
        console.time('4 - grid')
        c_map.background(127)
        const cellSize = scaler * random(2, 10)
        c_map.loadPixels()
        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                const vx = easeInOutExpo(1 - (x % cellSize) / cellSize)
                const vy = easeInOutExpo(1 - (y % cellSize) / cellSize)
                c_map.set(x, y, vx * 127 + vy * 127)
            }
        }
        c_map.updatePixels()
        console.timeEnd('4 - grid')

    } else if (mapType == 5) {
        console.time('5 - voronoi')
        c_map.background(30)
        const areas = Array(round_random(20, 150)).fill().map(_ => ({ pos: p(mapSize.x * random(-.2, 1.2), mapSize.y * random(-.2, 1.2)), clr: random(2), d: 0 }))
        const thickness = scaler * random(.5, 4)
        c_map.loadPixels()
        for (let y = 0; y < mapSize.y; y++) {
            for (let x = 0; x < mapSize.x; x++) {
                const pos = p(x, y)
                areas.forEach(area => area.d = pos.getDistance(area.pos))
                const ordered = areas.sort((a, b) => a.d < b.d ? -1 : 1)

                const n = 255 - noise(x / 100, y / 100) * 80
                let cc = ordered[1].d - ordered[0].d
                if (cc < thickness) c_map.set(x, y, smoothMap(cc, 0, thickness, n, 127))
                else c_map.set(x, y, ordered[0].d * ordered[0].clr)
            }
        }
        c_map.updatePixels()
        console.timeEnd('5 - voronoi')

    } else if (mapType == 6) {
        console.time('6 - noise')
        c_map.loadPixels()
        const ratioNoiseScale = random(4)
        const ratioForce = random(5)
        const noiseScale = random(6)
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
        console.timeEnd('6 - noise')
    } else if (mapType == 7) {
        c_map.background(50)
        c_map.noFill()
        c_map.stroke(255)
        const noiseScale = random(10, 200)
        for (let x = 1; x < mapSize.x * 1.1; x += scaler * 2) {
            for (let y = 1; y < mapSize.y * 1.1; y += scaler * 2) {
                const path = new Path()
                let pos = p(x, y)
                while (pos.x > -mapSize.x * .01 && pos.x < mapSize.x * 1.1 && pos.y > -mapSize.y * .1 && pos.y < mapSize.y * 1.1 && path.length < 400) {
                    const a = noise(pos.x / noiseScale, pos.y / noiseScale) * 360
                    pos = pos.add(pointFromAngle(a, 5))
                    path.add(pos)
                }
                path.smooth()
                fillShape(c_map, path, null, null, null, random(scaler * 7))
            }
        }
    }

    console.time('deformations')

    // smearPath = new Path([
    //     p(0.1 * mapSize.x, 0.2 * mapSize.y),
    //     p(0.3 * mapSize.x, 0.7 * mapSize.y),
    //     p(0.5 * mapSize.x, 0.2 * mapSize.y),
    //     p(0.7 * mapSize.x, 0.7 * mapSize.y),
    //     p(0.9 * mapSize.x, 0.2 * mapSize.y),
    // ])
    // smearPath.smooth()
    // // s_map = smear(c_map, smearPath, 100, 30)


    for (let i = 0; i < 1; i++)
        c_map = swirl(c_map, p(random(mapSize.x), random(mapSize.y)), random(300) * sign(random(-1, 1)), random(mapSize.x / 4))

    console.timeEnd('deformations')


    console.time('elements')
    // s_map = tracks(s_map, new Path([p(0, 0), p(mapSize.x, mapSize.y)]), 100, 30)
    // for (let i = 0; i < 3; i++) ammonite(c_map, randomIn(mapSize), random(10, 50))
    // footPrint(s_map)
    console.timeEnd('elements')

    // fix histogram
    // c_map.loadPixels()
    // let minVal = 1000
    // let maxVal = 0
    // for (let i=0;i<c_map.pixels.length;i+=4) {
    //     const val = c_map.pixels[i]
    //     if (val < minVal) minVal = val
    //     if (val > maxVal) maxVal = val
    // }
    // for (let i=0;i<c_map.pixels.length;i+=4) {
    //     c_map.pixels[i] = map(c_map.pixels[i], minVal, maxVal, 0, 255)
    // }
    // c_map.updatePixels()


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

function strokeShape(img, path, thick1, thick2) {
    for (let i = 0; i < path.length; i++) {
        const pos = path.getPointAt(i)
        img.strokeWeight(lerp(thick1, thick2, i / path.length))
        img.line(pos.x, pos.y, pos.x, pos.y)
    }
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