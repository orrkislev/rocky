function createHeightMap() {
    let c_map = createGraphics(round(height), round(height / 2))
    c_map.background(random(50, 120))
    const mapSize = p(c_map.width, c_map.height)
    const scaler = mapSize.x / 100

    const mapType = choose([0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3])

    if (mapType == 0 || mapType == 1) {
        const pathCreator = new PathCreator(mapSize.x, mapSize.y)
        const pointGenerator = new PointGenerator(mapSize.x, mapSize.y)
        const painter = new Painter(c_map)

        if (mapType == 0) {
            console.time('0 - circles')
            const sumCircles = random(100, 2000)
            const ct = choose([0, 1, 2])
            for (let i = 0; i < sumCircles; i++) {
                if (ct == 0) painter.drawCircle(pointGenerator.getPoint(), scaler * random(1, 10))
                if (ct == 1) painter.hole(pointGenerator.getPoint(), scaler * random(.5, 4))
                if (ct == 2) painter.crater(pointGenerator.getPoint(), scaler * random(.5, 4))
            }
            console.timeEnd('0 - circles')

        } else if (mapType == 1) {
            console.time('1 - lines')
            const numLines = random(200, 1000)
            for (let i = 0; i < numLines; i++) {
                path = pathCreator.createPath(pointGenerator.getPoint())
                painter.drawLine(path)
                path.remove()
            }
            console.timeEnd('1 - lines')
        }


        
    } else if (mapType == 2) {
        console.time('2 - noise')
        c_map.loadPixels()
        const ratioNoiseScale = random(4)
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
        console.timeEnd('2 - noise')

    } else if (mapType == 3) {
        console.time('3 - voronoi')
        if (!shaderGraphics) shaderGraphics = createGraphics(c_map.width, c_map.height, WEBGL)
        shaderGraphics.noStroke()
        shaderGraphics.shader(voronoiShader)
        voronoiShader.setUniform('resolution', [c_map.width, c_map.height])
        voronoiShader.setUniform('seed', random(1000))
        voronoiShader.setUniform('scale', random(.4, 1.5))
        shaderGraphics.rect(0, 0, c_map.width, c_map.height)
        c_map.image(shaderGraphics, 0, 0, c_map.width, c_map.height)
        console.timeEnd('3 - voronoi')
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
    console.time('deformations')
    if (random() < 0.5) c_map = swirl(c_map, p(random(mapSize.x), random(mapSize.y)), random(300) * sign(random(-1, 1)), random(mapSize.x / 4))
    console.timeEnd('deformations')


    // console.time('elements')
    // s_map = tracks(s_map, new Path([p(0, 0), p(mapSize.x, mapSize.y)]), 100, 30)
    // for (let i = 0; i < 3; i++) ammonite(c_map, randomIn(mapSize), random(10, 50))
    // footPrint(s_map)
    // console.timeEnd('elements')

    return c_map
}


class Painter {
    constructor(img) {
        this.img = img
        this.scaler = img.width / 100
        this.colorThreshold = random() * random()
        this.fillThreshold = random() < 0.5 ? random() * random() : 1 - random() * random()
    }

    getColor = () => random() < this.colorThreshold ? 0 : 255
    getFill = () => random() > this.fillThreshold
    getAlpha = () => random(100, 255)
    getBlur = () => this.scaler * random(3)

    drawPath(path, offset = p(0, 0)) {
        this.img.beginShape()
        for (let i = 0; i < path.length; i++) {
            const pos = path.getPointAt(i)
            this.img.vertex(pos.x + offset.x, pos.y + offset.y)
        }
        this.img.endShape()
    }

    drawLine(path) {
        if (this.getFill()) {
            this.img.noStroke()
            this.img.fill(this.getColor(), this.getAlpha())
        } else {
            this.img.stroke(this.getColor(), this.getAlpha())
            this.img.strokeWeight(this.scaler * random())
            this.img.noFill()
        }

        this.img.drawingContext.filter = `blur(${this.getBlur()}px)`
        this.drawPath(path)
    }

    drawCircle(pos, r) {
        const shape = new Circle(pos, r)
        this.drawLine(shape)
        shape.remove()
    }

    hole(pos, r) {
        this.img.fill(0, 100)
        this.img.drawingContext.filter = `blur(${r * random(.5, 1.5)}px)`
        this.img.circle(pos.x, pos.y, r)
        this.img.circle(pos.x, pos.y, r / 2)
    }

    crater(pos, r) {
        const shape = new Circle(pos, r).wonky(.5, 1.6)

        this.img.noStroke()
        this.img.drawingContext.filter = `blur(${this.scaler * random(1, 4)}px)`
        this.img.fill(255, random(100, 255))
        this.drawPath(shape, p(this.scaler * 2, this.scaler * 2))
        this.img.fill(0, random(100, 255))
        shape.remove()
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