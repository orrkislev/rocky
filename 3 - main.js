backgroundColors = [[245, 245, 220], [239, 208, 184], [219, 206, 160], [234, 234, 234], [50, 50, 50]]
goldColors = [[194, 175, 80], [114, 84, 15], [210, 186, 92], [255, 230, 140]]
greenColors = [[85, 166, 48], [0, 127, 95], [128, 185, 24], [43, 147, 72]]
ribbonColors = [[255, 71, 55], [210, 186, 92]]

const toColor = (colorArray) => color(colorArray[0], colorArray[1], colorArray[2])

let onMap, brightColor, depth, col, slope
let lightHeight, hitMap, lastDepth, pos
let slopeMultiplier, ribbon

function setup() {
    initP5(false, 9 / 16)

    backgroundColor = choose(backgroundColors)
    paperColor = ([255, 215, 200]).sort(() => random() - .5)
    paperColor = [255, 255, 255]
    pencilDarkColor = [0, 0, random() < 0.5 ? 0 : 50]
    pencilBrightColor = random() < 0.7 || backgroundColor[0] < 100 ? [255, 255, 255] : backgroundColor

    
    renderType = choose([1, 2])
    if (renderType == 1) moreColors = choose([goldColors, greenColors])
    withDeeperShadow = random() < 0.5
    withWallShadow = random() < 0.5

    makeImage()
}

async function makeImage() {

    projection = choose([cylindricProjection, azimuthalProjection, 
        conicProjection, vanDerGrintenProjection,
        naturalEarthProjection, doubleAzimuthalProjection,
        azimuthalEqualAreaProjection
    ])
    // projection = azimuthalProjection
    console.log('projection - ' + projection.name)

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
    console.time('phase - make height map')
    heightMap = createHeightMap()
    background(0)
    image(heightMap, 20, 20, width - 40, heightMap.height * (width - 40) / heightMap.width)
    console.timeEnd('phase - make height map')
    // return

    const drawArea = { width: withWallShadow ? width : gridWidth, height: withWallShadow ? height : gridHeight }


    // normalMap = createNormalMap(heightMap)
    // image(normalMap, 20, 20+heightMap.height * (width - 40) / heightMap.width, width - 40, heightMap.height * (width - 40) / heightMap.width)
    // returns











    makeBackground()
    await timeout()

    console.time('phase - draw relief')
    translate(-width / 2, height / 2)

    if (random() < 0.3) {
        ribbonStart = V(drawArea.width * random(-.4, .4), -drawArea.height * .4)
        ribbonCenter = V(random(-100, 100), 0), 
        ribbonEnd = V(drawArea.width * random(-.4, .4), drawArea.height * .4)
        ribbonStartDir = vsub(ribbonCenter, ribbonStart).rotate(random(-45, 45)).normalize(100*PS)
        ribbonEndDir = vsub(ribbonCenter, ribbonEnd).rotate(random(-45, 45)).normalize(100*PS)
        ribbonPath = [  ribbonStart, ribbonStart.add(ribbonStartDir), ribbonCenter, ribbonEnd.add(ribbonEndDir), ribbonEnd ]
        ribbonPath = toCrv(ribbonPath)

        ribbon = {
            path: ribbonPath,
            width: PS * random(60, 150),
            color: choose(ribbonColors)
        }

        ribbon.mask = createGraphics(width, height)
        ribbon.mask.strokeWeight(ribbon.width / 2)
        for (let i = 0; i < ribbon.path.length; i++) {
            // const pos = ribbon.path.getPointAt(i)
            const pos = ribbon.path[i]
            ribbon.mask.point(width / 2 + pos.x, height / 2 + pos.y)
        }
        applyRibbon = () => {
            const inRibbonMask = ribbon.mask.get(pos.x + width / 2, pos.y + height / 2)[3] > 0
            if (inRibbonMask) {
                brightColor = ribbon.color
                // depth = lerp(lastDepth, depth + 60, .5)
                depth += lerp(abs(pos.y) / gridHeight, 1, .5) * 60
                hitMap = true
                onMap = true
            }
        }
    }

    applyLights = () => {
        if (depth > lightHeight) col += 200
        lightHeight = max(lightHeight, depth)
        const distToLight = V(pos.x / gridHeight + .5, pos.y / gridWidth + .5).sub(lightPos).mag()
        const lightStep = map(distToLight, 0, 2, 2, 1) * PS
        lightHeight -= lightStep
    }

    if (renderType == 1) {
        prepareRender = () => {
            let finalColor = brightColor
            if (col < slopeMultiplier*.3) finalColor = pencilDarkColor
            else if (col < slopeMultiplier*.8) finalColor = brightColor == pencilBrightColor ? choose(moreColors) : brightColor
            stroke(finalColor[0], finalColor[1], finalColor[2])
        }
        slopeMultiplier = 255
    } else if (renderType == 2) {
        prepareRender = () => {
            stroke(lerp(pencilDarkColor[0], brightColor[0], col / 255),
                lerp(pencilDarkColor[1], brightColor[1], col / 255),
                lerp(pencilDarkColor[2], brightColor[2], col / 255))
        }
        slopeMultiplier = 30
    }

    shouldFilterHits = withWallShadow ? 
        () => !hitMap || (!onMap && depth > lightHeight) : 
        () => !hitMap || !onMap





    const lightPos = V(fillDir > 0 ? 0 : 1, 0)
    const offsetX = drawArea.height * tan(90 - fillDir)
    const startX = fillDir > 0 ? -drawArea.width / 2 - offsetX : -drawArea.width / 2
    const endX = fillDir > 0 ? drawArea.width / 2 : drawArea.width / 2 - offsetX
    const moveX = PS * Math.sign(fillDir) * cos(fillDir) * .75
    const moveY = PS * Math.sign(fillDir) * sin(fillDir) * .75
    strokeWeight(PS * 2)
    for (let x = startX; x < endX; x += 1 * PS) {
        lightHeight = 0
        hitMap = false
        lastDepth = 0
        pos = V(x, -drawArea.height / 2)
        while (pos.y < drawArea.height / 2) {
            pos.y += moveY
            pos.x += moveX
            if (pos.x < -drawArea.width / 2 || pos.x > drawArea.width / 2 || pos.y < -drawArea.height / 2 || pos.y > drawArea.height / 2) continue

            const relX = pos.x / gridWidth
            const relY = pos.y / gridHeight

            onMap = false
            brightColor = pencilBrightColor
            depth = 0
            col = 0
            slope = 0

            const pos2d = projection.toSphere(relY, relX)
            if (pos2d) {
                const percX = (pos2d.y + 180) / 360
                const percY = (pos2d.x + 90) / 180
                const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
                depth += sampleColor[0]

                // depth += noise(percX * 30, percY * 30) * 8 - 4
                slope = depth - lastDepth
                // col = easeInOutExpo((slope + 1) / 2) * slopeMultiplier
                col = slope * slopeMultiplier
                lastDepth = depth
                hitMap = true
                onMap = true
            }
            applyRibbon()

            if (shouldFilterHits()) continue

            applyLights()

            col = constrain(col, 0, 255)

            strokeWeight(PS * (depth / 255 + 1) * 2)

            prepareRender()

            const drawPos = distortPos(pos)
            line(drawPos.x + width, drawPos.y, drawPos.x + width, drawPos.y)
        }
        pos.x++
        await timeout()
    }
    console.timeEnd('phase - draw relief')
}

function shouldFilterHits() { }
function applyRibbon() { }
function applyLights() { }
function prepareRender() { }


function makeBackground() {
    background(220)
    fill(backgroundColor)
    noStroke()
    rect(20*PS, 20*PS, width - 40*PS, height - 40*PS, 2*PS)
    const paperColorHex = `#${num2hex(pencilDarkColor[0])}${num2hex(pencilDarkColor[1])}${num2hex(pencilDarkColor[2])}`
    for (let i = 0; i < 10; i++) {
        const x = random(width)
        const y = random(height)
        const gradient = drawingContext.createRadialGradient(x, y, 0, x, y, width * random(.25,.75))
        gradient.addColorStop(0, paperColorHex + '31')
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
    // const newDist = pos.length * (1 + noise(pos.length / 100, pos.angle / 100) * .15 - .075)
    // return pointFromAngle(pos.angle, newDist)

    const mag = pos.mag()
    const angle = pos.heading()
    const newDist = mag * (1 + noise(mag / 100, angle / 100) * .15 - .075)
    return angleVec(angle, newDist)
}