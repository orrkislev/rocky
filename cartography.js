function setup() {
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
    gridHeight = width * gridAspectRatio

    console.log('start', fxhash)
    console.time('make height map')
    heightMap = createHeightMap_shader()
    heightMap = createHeightMap()
    image(heightMap, 0, 0, width, width / 2)
    console.timeEnd('make height map')
    // return

    // normalMap = createNormalMap(heightMap)











    let lightHeight = null
    let lastDepth = 0
    let col = 0
    const pixel_density = pixelDensity()

    console.time('draw')
    translate(width / 2, height / 2)
    background(backgroundColor)


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

                const heightMapX = round(percX * heightMap.width)
                const heightMapY = round(percY * heightMap.height)
                const heightMaI = (heightMapX + heightMapY * heightMap.width * pixel_density) * 4
                let depth = heightMap.pixels[heightMaI]

                depth += noise(percX * 10, percY * 10) * 5 - 2.5
                const slope = depth - lastDepth
                lastDepth = depth


                col = easeInOutExpo((slope + 1) / 2) * 255
                if (depth > lightHeight) col = 255

                lightHeight = max(lightHeight, depth)
                const distToLight = V(x / gridHeight + .5, y / gridWidth + .5).sub(lightPos).mag()
                const lightStep = map(distToLight, 0, 1.6, 1, 0) * PS
                lightHeight -= lightStep

                penThickness = depth / 127
                stroke(lerp(pencilDarkColor[0], pencilBrightColor[0], col / 255),
                    lerp(pencilDarkColor[1], pencilBrightColor[1], col / 255),
                    lerp(pencilDarkColor[2], pencilBrightColor[2], col / 255), 100)
                line(pos.x, pos.y, pos.x, pos.y)
                makeTime('draw dot')
            } else {
                lightHeight = null
                lastDepth = -1
            }
        }
        pos.x++
        await timeout()
    }

    // await fill3D(async ({ pos2d, pos3d, x, y }) => {
    //     const percX = (pos2d.y + 180) / 360
    //     const percY = (pos2d.x + 90) / 180

    //     makeTime('get perc')
    //     const heightMapX = round(percX * heightMap.width)
    //     const heightMapY = round(percY * heightMap.height)
    //     const heightMaI = (heightMapX + heightMapY * heightMap.width * pixel_density) * 4
    //     let depth = heightMap.pixels[heightMaI]
    //     // const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
    //     // let depth = sampleColor[0]
    //     makeTime('sample color')

    //     depth += noise(percX * 10, percY * 10) * 5 - 2.5

    //     const slope = depth - lastDepth
    //     lastDepth = depth


    //     col = easeInOutExpo((slope + 1) / 2) * 255

    //     // if (depth < lightHeight) col = -200
    //     if (depth > lightHeight) col = 255


    //     // specular light
    //     // const normalVals = normalMap.get(percX * heightMap.width, percY * heightMap.height)
    //     // const normal = V(normalVals[0], normalVals[1]).normalize()
    //     // const lightDir = V(-1, -1).normalize()
    //     // const angle = normal.dot(lightDir) * noise(percX * 100, percY * 100)
    //     // const specular = pow(angle, 10)
    //     // if (specular > .5) col += 100

    //     lightHeight = max(lightHeight, depth)
    //     const distToLight = V(x / gridHeight + .5, y / gridWidth + .5).sub(lightPos).mag()
    //     const lightStep = map(distToLight, 0, 1.6, 1, 0) * PS
    //     lightHeight -= lightStep
    //     makeTime('light stuff')

    //     penThickness = depth / 127
    //     // stroke(col, 100)
    //     // const resColor = lerpColor(pencilDarkColor, pencilBrightColor, col / 255)
    //     // resColor.setAlpha(100)
    //     // stroke(resColor)
    //     stroke( lerp(pencilDarkColor[0], pencilBrightColor[0], col / 255), 
    //             lerp(pencilDarkColor[1], pencilBrightColor[1], col / 255), 
    //             lerp(pencilDarkColor[2], pencilBrightColor[2], col / 255), 100)
    //     makeTime('stroke stuff')
    //     line(x, y, x, y)
    //     // await drawDotXY(x,y)
    //     makeTime('draw dot')
    // }, (x, y) => {
    //     lightHeight = null
    //     lastDepth = -1
    // })
    
    console.timeEnd('draw')
    printTimes()
}



async function fillAll(func) {
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
            await func(pos.x, pos.y)
        }
        pos.x++
        await timeout()
    }
}

async function fill3D(action, actionElse = async () => { }) {
    await fillAll(async (x, y) => {
        const relX = x / gridWidth
        const relY = y / gridHeight
        makeTime('fill all')
        const pos2d = projection.toSphere(relX, relY)
        makeTime('to sphere')
        if (pos2d) {
            const pos3d = coordToVector(pos2d.x, pos2d.y, 1)
            await action({ pos2d, pos3d, x, y })
        } else {
            await actionElse(x, y)
        }
    })
}

lastTime = 0
function getNextTime() {
    const time = performance.now()
    const diff = time - lastTime
    lastTime = time
    return diff
}

times = {}
function makeTime(timeName) {
    if (!times[timeName]) times[timeName] = []
    times[timeName].push(getNextTime())
}

function printTimes() {
    Object.keys(times).forEach(timeName => {
        const average = times[timeName].reduce((a, b) => a + b, 0) / times[timeName].length
        print(timeName, average)
    })
}