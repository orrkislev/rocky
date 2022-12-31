function setup() {
    initP5()
    backgroundColor = color(0)
    pencilDarkColor = color(0)
    pencilBrightColor = color(255)
    makeImage()
}

async function makeImage() {
    console.log('start', fxhash)
    console.time('make height map')
    // heightMap = createHeightMap_shader()
    heightMap = createHeightMap()
    heightMap.loadPixels()

    image(heightMap, 0, 0, width, width / 2)
    console.timeEnd('make height map')
    // return

    // normalMap = createNormalMap(heightMap)



    background(backgroundColor)

    const gridAspectRatio = 1 / 2
    const horizontalMargin = 30
    gridWidth = width - horizontalMargin * 2
    gridHeight = width * gridAspectRatio

    projection = choose([cylindricProjection, azimuthalProjection, conicProjection, vanDerGrintenProjection, naturalEarthProjection, doubleAzimuthalProjection])

    translate(width / 2, height / 2)

    fillDir = random(30, 80) * (random() < .5 ? 1 : -1)
    lightPos = V(fillDir > 0 ? 0 : 1, 0)

    let lightHeight = 0
    let lastDepth = 0
    let col = 0
    const ambientLight = random() < 0.15 ? 0 : random(100)

    await fill3D(async ({ pos2d, pos3d, x, y }) => {
        const percX = (pos2d.y + 180) / 360
        const percY = (pos2d.x + 90) / 180

        const sampleColor = heightMap.get(percX * heightMap.width, percY * heightMap.height)
        let depth = sampleColor[0]
        depth += noise(percX * 10, percY * 10) * 5 - 2.5
        const slope = depth - lastDepth
        lastDepth = depth


        col = easeInOutExpo((slope + 1) / 2) * ambientLight

        // if (depth < lightHeight) col = -200
        if (depth > lightHeight) col = 255

        // specular light
        // const normalVals = normalMap.get(percX * heightMap.width, percY * heightMap.height)
        // const normal = V(normalVals[0], normalVals[1]).normalize()
        // const lightDir = V(-1, -1).normalize()
        // const angle = normal.dot(lightDir) * noise(percX * 100, percY * 100)
        // const specular = pow(angle, 10)
        // if (specular > .5) col += 100

        lightHeight = max(lightHeight, depth)
        const distToLight = V(x / gridHeight + .5, y / gridWidth + .5).sub(lightPos).mag()
        const lightStep = map(distToLight, 0, 1.6, .5, 0) * PS
        lightHeight -= lightStep

        penThickness = depth / 20
        // stroke(col, 100)
        const resColor = lerpColor(pencilDarkColor, pencilBrightColor, col / 255)
        resColor.setAlpha(100)
        stroke(resColor)
        await drawDotXY(x, y)
    }, (x, y) => {
        lightHeight = -1
        lastDepth = -1
    })
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
    }
}

async function fill3D(action, actionElse = async () => { }) {
    await fillAll(async (x, y) => {
        const relX = x / gridWidth
        const relY = y / gridHeight
        const pos2d = projection.toSphere(relX, relY)
        if (pos2d) {
            const pos3d = coordToVector(pos2d.x, pos2d.y, 1)
            await action({ pos2d, pos3d, x, y })
        } else {
            await actionElse(x, y)
        }
    })
}