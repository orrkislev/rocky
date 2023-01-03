paperColors = [[245, 245, 220], [239, 208, 184], [219, 206, 160], [234, 234, 234]]

function setup() {
    initP5(false, 9 / 16)

    backgroundColor = choose(paperColors)
    paperColor = ([255, 215, 200]).sort(() => random() - .5)
    paperColor = [255, 255, 255]
    pencilDarkColor = [0, 0, 0]
    pencilBrightColor = paperColor
    makeImage()
}

async function makeImage() {

    projection = choose([cylindricProjection, //azimuthalProjection, 
        conicProjection, vanDerGrintenProjection,
        naturalEarthProjection, doubleAzimuthalProjection,
        azimuthalEqualAreaProjection
    ])
    console.log(projection.name)
    // projection = naturalEarthProjection
    fillDir = random(30, 80) * (random() < .5 ? 1 : -1)
    lightPos = V(fillDir > 0 ? 0 : 1, 0)

    const gridAspectRatio = 1.5
    const horizontalMargin = width * .1
    gridWidth = width - horizontalMargin * 2
    gridHeight = gridWidth * gridAspectRatio
    if (gridHeight > height - horizontalMargin * 2) {
        gridHeight = height - horizontalMargin * 2
        gridWidth = gridHeight / gridAspectRatio
    }

    // heightMap = createHeightMap_shader()
    console.time('make height map')
    heightMap = createHeightMap()
    image(heightMap, 50, 50, width - 100, height - 100)
    console.timeEnd('make height map')
    // return


    // normalMap = createNormalMap(heightMap)











    let lightHeight = null
    let lastDepth = 0
    let col = 0
    // const pixel_density = heightMap.pixelDensity()
    let drawn = false

    console.time('draw background')
    makeBackground()
    console.timeEnd('draw background')

    console.time('draw relief')
    translate(-width / 2, height / 2)

    const offsetX = gridHeight * tan(90 - fillDir)
    const startX = fillDir > 0 ? -gridWidth / 2 - offsetX : -gridWidth / 2
    const endX = fillDir > 0 ? gridWidth / 2 : gridWidth / 2 - offsetX
    const moveX = Math.sign(fillDir) * cos(fillDir) / 2
    const moveY = Math.sign(fillDir) * sin(fillDir) / 2
    strokeWeight(PS)
    for (let x = startX; x < endX; x += .5) {
        let pos = new Point(x, -gridHeight / 2)
        while (pos.y < gridHeight / 2) {
            pos.y += moveY
            pos.x += moveX
            if (pos.x < -gridWidth / 2 || pos.x > gridWidth / 2 || pos.y < -gridHeight / 2 || pos.y > gridHeight / 2) continue
            const relX = pos.x / gridWidth
            const relY = pos.y / gridHeight
            const pos2d = projection.toSphere(relY, relX)
            if (pos2d) {
                // const pos3d = coordToVector(pos2d.x, pos2d.y, 1)
                const percX = (pos2d.y + 180) / 360
                const percY = (pos2d.x + 90) / 180
                const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
                let depth = sampleColor[0]
                // if (sampleColor[3] != 255) continue

                depth += noise(percX * 30, percY * 30) * 8 - 4
                const slope = depth - lastDepth
                lastDepth = depth


                col = easeInOutExpo((slope + 1) / 2) * 100
                if (depth > lightHeight) col += 150
                // col *= random(1, 1.5)

                lightHeight = max(lightHeight, depth)
                const distToLight = V(pos.x / gridHeight + .5, pos.y / gridWidth + .5).sub(lightPos).mag()
                const lightStep = map(distToLight, 0, 2, 1, -0.1) * PS
                lightHeight -= lightStep

                let alpha = 150
                // if (abs(pos2d.x) > 80) alpha *= map(abs(pos2d.x), 87, 90, 1, 0)
                // if (abs(pos2d.y) > 170) alpha *= map(abs(pos2d.y), 177, 180, 1, 0)

                col = constrain(col, 0, 255)
                strokeWeight(PS * (depth / 255 + 1))
                stroke(lerp(pencilDarkColor[0], pencilBrightColor[0], col / 255),
                    lerp(pencilDarkColor[1], pencilBrightColor[1], col / 255),
                    lerp(pencilDarkColor[2], pencilBrightColor[2], col / 255), alpha)

                // line(pos.x + width, pos.y, pos.x + width, pos.y)
                const drawPos = distortPos(pos)
                line(drawPos.x + width, drawPos.y, drawPos.x + width, drawPos.y)
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

    console.timeEnd('draw relief')
}



function makeBackground() {
    background(220)
    // background(pencilDarkColor[0], pencilDarkColor[1], pencilDarkColor[2])

    // fill(pencilDarkColor[0], pencilDarkColor[1], pencilDarkColor[2])
    fill(backgroundColor)
    noStroke()
    rect(20, 20, width - 40, height - 40, 2)

    // const paperColorHex = `#${num2hex(paperColor[0])}${num2hex(paperColor[1])}${num2hex(paperColor[2])}`
    const paperColorHex = `#${num2hex(pencilDarkColor[0])}${num2hex(pencilDarkColor[1])}${num2hex(pencilDarkColor[2])}`

    for (let i = 0; i < 10; i++) {
        const x = random(width)
        const y = random(height)
        const gradient = drawingContext.createRadialGradient(x, y, 0, x, y, random(width))
        gradient.addColorStop(0, paperColorHex + '11')
        gradient.addColorStop(1, paperColorHex + '00')
        drawingContext.fillStyle = gradient
        rect(0, 0, width, height)
    }

    let x = 0
    loadPixels()
    for (let i = 0; i < pixels.length; i += 4) {
        x++
        const n = noise(x / 100, i / 100) * 10 - 5
        pixels[i] += n
        pixels[i + 1] += n
        pixels[i + 2] += n
    }
    updatePixels()
}


// turn a number between 0 and 255 into a 2-digit hex string
function num2hex(n) {
    return n.toString(16).padStart(2, '0')
}

function distortPos(pos) {
    const newDist = pos.length * (1 + noise(pos.length / 100, pos.angle / 100) * .15 - .075)
    return pointFromAngle(pos.angle, newDist)
}