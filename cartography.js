backgroundColors = [[245, 245, 220], [239, 208, 184], [219, 206, 160], [234, 234, 234], [50, 50, 50]]
// goldColors = [[194, 175, 80], [114, 84, 15], [210, 186, 92]]   [255, 230, 140]
ribbonColors = [[255, 71, 55], [210, 186, 92]]


function setup() {
    initP5(false, 9 / 16)

    backgroundColor = choose(backgroundColors)
    paperColor = ([255, 215, 200]).sort(() => random() - .5)
    paperColor = [255, 255, 255]
    pencilDarkColor = [0, 0, random() < 0.5 ? 0 : 50]
    pencilBrightColor = random() < 0.0 ? backgroundColor : [255, 255, 255]
    makeImage()
}

async function makeImage() {

    projection = choose([cylindricProjection, //azimuthalProjection, 
        conicProjection, vanDerGrintenProjection,
        naturalEarthProjection, doubleAzimuthalProjection,
        azimuthalEqualAreaProjection
    ])
    // projection = doubleAzimuthalProjection
    console.log(projection.name)

    fillDir = random(30, 80) * (random() < .5 ? 1 : -1)

    const gridAspectRatio = projection.ratio || 1.5
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
    background(0)
    image(heightMap, 20, 20, width - 40, heightMap.height * (width - 40) / heightMap.width)
    console.timeEnd('make height map')
    // return


    // normalMap = createNormalMap(heightMap)
    // image(normalMap, 20, 20+heightMap.height * (width - 40) / heightMap.width, width - 40, heightMap.height * (width - 40) / heightMap.width)
    // returns











    // const pixel_density = heightMap.pixelDensity()

    console.time('draw background')
    makeBackground()
    await timeout()
    console.timeEnd('draw background')

    console.time('draw relief')
    translate(-width / 2, height / 2)

    let ribbon = null
    if (random() < 0.5 || true) {
        ribbon = {
            path: new Path([p(gridWidth * random(-.5, .5), -gridHeight / 2), p(random(-100, 100), 0), p(gridWidth * random(-.5, .5), gridHeight / 2)]),
            width: random(20, 100),
            color: choose(ribbonColors)
        }
        ribbon.path.smooth()
        ribbon.path.lastSegment.handleIn = ribbon.path.lastSegment.handleIn.rotate(random(-45,45))
        ribbon.path.firstSegment.handleOut = ribbon.path.firstSegment.handleOut.rotate(random(-45,45))
        ribbon.mask = createGraphics(width, height)
        ribbon.mask.strokeWeight(ribbon.width / 2)
        for (let i = 0; i < ribbon.path.length; i++) {
            const pos = ribbon.path.getPointAt(i)
            ribbon.mask.point(width / 2 + pos.x, height / 2 + pos.y)
        }
    }

    const lightPos = V(fillDir > 0 ? 0 : 1, 0)
    // const offsetX = gridHeight * tan(90 - fillDir)
    const offsetX = height * tan(90 - fillDir)
    // const startX = fillDir > 0 ? -gridWidth / 2 - offsetX : -gridWidth / 2
    const startX = fillDir > 0 ? -width / 2 - offsetX : -width / 2
    // const endX = fillDir > 0 ? gridWidth / 2 : gridWidth / 2 - offsetX
    const endX = fillDir > 0 ? width / 2 : width / 2 - offsetX
    const moveX = Math.sign(fillDir) * cos(fillDir) / 2
    const moveY = Math.sign(fillDir) * sin(fillDir) / 2
    times = []
    lastTime = performance.now()
    strokeWeight(PS * 2)
    for (let x = startX; x < endX; x += .5) {
        let lightHeight = 0
        let hitMap = false
        let lastDepth = 0
        // let pos = new Point(x, -gridHeight / 2)
        let pos = new Point(x, -height / 2)
        // while (pos.y < gridHeight / 2) {
        while (pos.y < height / 2) {
            const newTime = performance.now()
            times.push(newTime - lastTime)
            lastTime = newTime

            pos.y += moveY
            pos.x += moveX
            // if (pos.x < -gridWidth / 2 || pos.x > gridWidth / 2 || pos.y < -gridHeight / 2 || pos.y > gridHeight / 2) continue
            if (pos.x < -width / 2 || pos.x > width / 2 || pos.y < -height / 2 || pos.y > height / 2) continue

            const relX = pos.x / gridWidth
            const relY = pos.y / gridHeight

            let onMap = false
            let brightColor = pencilBrightColor
            let darkColor = pencilDarkColor
            let depth = 0
            // let alpha = 150
            let col = 0
            let slope = 0

            const pos2d = projection.toSphere(relY, relX)
            if (pos2d) {
                const percX = (pos2d.y + 180) / 360
                const percY = (pos2d.x + 90) / 180
                const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
                depth += sampleColor[0]

                depth += noise(percX * 30, percY * 30) * 8 - 4
                slope = depth - lastDepth
                col = easeInOutExpo((slope + 1) / 2) * 30
                lastDepth = depth
                hitMap = true
                onMap = true
            }
            if (ribbon) {
                const inRibbonMask = ribbon.mask.get(pos.x + width / 2, pos.y + height / 2)[3] > 0
                if (inRibbonMask) {
                    // if (ribbon.path.getNearestPoint(pos).getDistance(pos) < ribbon.width / 2) {
                    brightColor = ribbon.color
                    // darkColor = goldColors[1]
                    depth = lerp(lastDepth, depth + 60, .5)
                    hitMap = true
                    onMap = true
                }
            }
            if (!hitMap) continue

            if (depth > lightHeight) col += 200
            // else col -= lightHeight-depth
            if (!onMap && depth > lightHeight) continue

            lightHeight = max(lightHeight, depth)
            const distToLight = V(pos.x / gridHeight + .5, pos.y / gridWidth + .5).sub(lightPos).mag()
            const lightStep = map(distToLight, 0, 2, 2, 1) * PS
            lightHeight -= lightStep

            col = constrain(col, 0, 255)
            strokeWeight(PS * (depth / 255 + 1))
            stroke(lerp(darkColor[0], brightColor[0], col / 255),
                lerp(darkColor[1], brightColor[1], col / 255),
                lerp(darkColor[2], brightColor[2], col / 255), 150)

            // line(pos.x + width, pos.y, pos.x + width, pos.y)
            const drawPos = distortPos(pos)
            line(drawPos.x + width, drawPos.y, drawPos.x + width, drawPos.y)
        }
        pos.x++
        await timeout()
    }

    console.timeEnd('draw relief')

    let allTimes = 0
    times.forEach(t => allTimes += t)
    print(allTimes / times.length)
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