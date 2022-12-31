async function drawMapStuff() {
    stroke(colorWithAlpha(penColor, 100))
    await drawPath(new Path.Rectangle(new Point(-gridWidth / 2, -gridHeight / 2), new Size(gridWidth, gridHeight)))
    await drawBackgroundGrid(random(2, 20))

    penThickness = 10
    stroke(colorWithAlpha(backgroundColor, random(50)))
    for (let lat = -100; lat <= 100; lat += 1)
        await drawMapLine(lat, -190, lat, 190)
    penThickness = .5

    stroke(colorWithAlpha(penColor, 100))
    await drawProjectedGrid(10)

    stroke(colorWithAlpha(penColor, 30))
    await drawProjectedGrid(2)

    stroke(0, 100)
    for (let long = -180; long <= 180; long += 2)
    await drawMapLine(90, long, 100, long)
    for (let long = -180; long <= 180; long += 2)
    await drawMapLine(-90, long, -100, long)
    for (let lat = -90; lat <= 90; lat += 2)
        await drawMapLine(lat, 180, lat, 190)
    for (let lat = -90; lat <= 90; lat += 2)
        await drawMapLine(lat, -180, lat, -190)

    numbers
    for (let lat = -90; lat <= 90; lat += 10)
        drawMapNumber(lat, -180, 0, -1, abs(lat))
    for (let long = -180; long <= 180; long += 10)
        drawMapNumber(90, long, 1, 0, abs(long))

}

function drawContinentsAndStuff(){

    // stroke(50, 100, 80, 20)
    // edges = await fill3DCondition(pos3d => {
    //     const n = noise(pos3d.x - 2 + random(.1), pos3d.y - 2 + random(.1), pos3d.z - 2 + random(.1))
    //     penThickness = 2 * n
    //     return n > 0.5
    // }, drawXYRandom)


    // stroke(0)
    // penThickness = 1
    // edges = edges.filter(_ => random() < 0.333)
    // while (edges.length > 0) {
    //     let keepGoing = true
    //     newPath = new Path()
    //     newPath.add(edges.pop())
    //     while (edges.length > 0 && keepGoing) {
    //         const closest = edges.reduce((closest, edge) => {
    //             if (edge.getDistance(newPath.lastSegment.point) < closest.getDistance(newPath.lastSegment.point))
    //                 return edge
    //             return closest
    //         })
    //         if (closest.getDistance(newPath.lastSegment.point) < 20) {
    //             newPath.add(closest)
    //             edges = edges.filter(edge => edge != closest)
    //         } else {
    //             keepGoing = false
    //         }
    //     }
    //     newPath.rebuild(round(newPath.segments.length / 50))
    //     newPath.smooth()
    //     await drawPath(newPath)
    // }

    // stroke(70, 50, 30, 100)
    // await fill3DCondition(pos3d => {
    //     const n = noise(pos3d.x - 3, pos3d.y - 3, pos3d.z - 3)
    //     penThickness = 3 * n
    //     return n > 0.5
    // })

    // stroke(30, 70, 50, 180)
    // await fill3DCondition(pos3d => {
    //     const n = noise(pos3d.x - 4, pos3d.y - 4, pos3d.z - 4)
    //     penThickness = 3 * n
    //     return n > 0.6
    // })

}

async function drawProjectedGrid(spacing) {
    for (let lat = -90; lat <= 90; lat += spacing)
        await drawMapLine(lat, -180, lat, 180)
    for (let long = -180; long <= 180; long += spacing)
        await drawMapLine(90, long, -90, long)
}

async function drawBackgroundGrid(spacing) {
    for (let x = -gridWidth / 2; x < gridWidth / 2; x += spacing) {
        await drawPath(new Path.Line(new Point(x, -gridHeight / 2), new Point(x, gridHeight / 2)))
    }
    for (let y = -gridHeight / 2; y < gridHeight / 2; y += spacing) {
        await drawPath(new Path.Line(new Point(-gridWidth / 2, y), new Point(gridWidth / 2, y)))
    }
}

function drawMapNumber(lat, long, latDir, longDir, txt, txtSize = 5) {
    const pos1 = projection.toPlane(lat, long)
    const pos2 = projection.toPlane(lat - latDir, long - longDir * 5)
    if (!pos1 || !pos2) return
    const dir = pos1.subtract(pos2)
    const textPos = pos1.add(dir)
    textAlign(RIGHT)
    textSize(txtSize)
    push()
    translate(textPos.x * gridWidth, textPos.y * gridHeight)
    rotate(dir.angle + 180)
    noStroke()
    text(txt, 0, 0)
    pop()
    return new Point(textPos.x * gridWidth, textPos.y * gridHeight)
}

async function drawMapLine(lat1, long1, lat2, long2) {
    const l = dist(lat1, long1, lat2, long2)
    const p = new Path()
    for (let i = 0; i < l; i += 1) {
        const lat = lerp(lat1, lat2, i / l)
        const long = lerp(long1, long2, i / l)
        const pos = projection.toPlane(lat, long)
        if (!pos) continue
        if (pos.x > 0.5 || pos.x < -0.5 || pos.y > 0.5 || pos.y < -0.5) continue
        p.add(new Point(pos.x * gridWidth, pos.y * gridHeight))
    }
    await drawPath(p)
}



async function fill2DCondition(condition, action = drawDotXY, actionFalse = async () => { }) {
    await fillAll(async (x, y) => {
        const relX = x / gridWidth
        const relY = y / gridHeight
        const pos = projection.toSphere(relX, relY)
        if (pos) {
            if (condition(pos)) await action(x, y)
            else await actionFalse(x, y)
        }
    })
}

async function fill3DCondition(condition, action = drawDotXY, actionElse = async () => { }) {
    let edges = []
    let inCondition = false
    await fillAll(async (x, y) => {
        const relX = x / gridWidth
        const relY = y / gridHeight
        const pos2d = projection.toSphere(relX, relY)
        if (pos2d) {
            const pos3d = coordToVector(pos2d.x, pos2d.y, 1)
            if (action({ pos2d, pos3d, x, y })) {
                if (!inCondition) {
                    edges.push(new Point(x, y))
                    inCondition = true
                }
                await action(x, y)
            } else {
                if (inCondition) {
                    edges.push(new Point(x, y))
                    inCondition = false
                }
                await actionElse(x, y)
            }
        }
    })
    return edges
}