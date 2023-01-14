let scaler
const ms = (x)=>scaler*x
const rs = (a,b)=>scaler*random(a,b)
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
    }


    for (let i = 1; i < 4; i++) {
        const deformType = choose([0, 1, 2, 2])
        if (deformType == 0)
            c_map = swirl(c_map, V(random(mapSize.x), random(mapSize.y)), ms(60), random(mapSize.x / 4))
        if (deformType == 1)
            c_map = smear(c_map, rs(4, 16), rs(2,6))
    }

    const sumAmmonites = random() < 0.8 ? 0 : random(2, 5)
    for (let i = 0; i < sumAmmonites; i++) ammonite(c_map, V(random(mapSize.x), random(mapSize.y)), random(10, 50))
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
    getBlur = () => rs(0,3)

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
            this.img.strokeWeight(rs(0,1))
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