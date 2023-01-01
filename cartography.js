function setup() {
    console.log('start', fxhash)
    initP5()
    backgroundColor = color(0)
    pencilDarkColor = [0, 0, 0]
    pencilBrightColor = [255, 255, 255]
    ctx = drawingContext
    makeImage()
}

async function makeImage() {
    projection = choose([cylindricProjection, azimuthalProjection, conicProjection, vanDerGrintenProjection, naturalEarthProjection, doubleAzimuthalProjection])
    fillDir = random(30, 80) * (random() < .5 ? 1 : -1)
    lightPos = V(fillDir > 0 ? 0 : 1, 0)

    const gridAspectRatio = 1 / 2
    const horizontalMargin = width * .07
    gridWidth = width - horizontalMargin * 2
    gridHeight = gridWidth * gridAspectRatio
    if (gridHeight > height - horizontalMargin * 2) {
        gridHeight = height - horizontalMargin * 2
        gridWidth = gridHeight / gridAspectRatio
    }

    // heightMap = createHeightMap_shader()
    heightMap = createHeightMap()
    image(heightMap, 50, 50, width-100, height-100)
    // return

    // normalMap = createNormalMap(heightMap)











    let lightHeight = null
    let lastDepth = 0
    let col = 0
    const pixel_density = heightMap.pixelDensity()
    let drawn = false

    console.time('draw')
    makeBackground()

    translate(-width / 2, height / 2)

    const offsetX = gridHeight * tan(90 - fillDir)
    const startX = fillDir > 0 ? -gridWidth / 2 - offsetX : -gridWidth / 2
    const endX = fillDir > 0 ? gridWidth / 2 : gridWidth / 2 - offsetX
    const moveX = Math.sign(fillDir) * cos(fillDir) / 2
    const moveY = Math.sign(fillDir) * sin(fillDir) / 2
    for (let x = startX; x < endX; x += .5) {
        let pos = new Point(x, -gridHeight / 2)
        while (pos.y < gridHeight / 2) {
            pos.y += moveY
            pos.x += moveX
            if (pos.x < -gridWidth / 2 || pos.x > gridWidth / 2 || pos.y < -gridHeight / 2 || pos.y > gridHeight / 2) continue
            const relX = pos.x / gridWidth
            const relY = pos.y / gridHeight
            const pos2d = projection.toSphere(relX, relY)
            if (pos2d) {
                // const pos3d = coordToVector(pos2d.x, pos2d.y, 1)
                const percX = (pos2d.y + 180) / 360
                const percY = (pos2d.x + 90) / 180
                const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
                let depth = sampleColor[0]

                depth += noise(percX * 30, percY * 30) * 8 - 4
                const slope = depth - lastDepth
                lastDepth = depth


                col = easeInOutExpo((slope + 1) / 2) * 150
                if (depth > lightHeight)  col += 100

                lightHeight = max(lightHeight, depth)
                const distToLight = V(pos.x / gridHeight + .5, pos.y / gridWidth + .5).sub(lightPos).mag()
                const lightStep = map(distToLight, 0, 1.6, .6, 0) * PS
                lightHeight -= lightStep

                strokeWeight(depth / 127)
                stroke(lerp(pencilDarkColor[0], pencilBrightColor[0], col / 255),
                    lerp(pencilDarkColor[1], pencilBrightColor[1], col / 255),
                    lerp(pencilDarkColor[2], pencilBrightColor[2], col / 255), 100)
                line(pos.x+width, pos.y, pos.x+width, pos.y)
                drawn = true
            } else {
                lightHeight = null
                lastDepth = -1
            }
        }
        pos.x++
        if (drawn) await timeout()
        drawn = false
    }

    console.timeEnd('draw')
}



function makeBackground() {
    //circular gradient from center
    const gradient = drawingContext.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2)
    gradient.addColorStop(0, '#1a1a1a')
    gradient.addColorStop(1, '#000000')
    drawingContext.fillStyle = gradient
    rect(0, 0, width, height)
}