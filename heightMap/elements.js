function footPrint(img) {
    const c = createGraphics(img.width, img.height)
    let blob = new Path([
        segHori(p(20, -100), 35),
        segVert(p(20, 0), 10),
        segVert(p(20, 20), 10),
        segHori(p(0, 40), -10),
        segVert(p(-20, 20), -10),
        segVert(p(-15, -10), -10),
        segVert(p(-20, -50), -10),
    ])
    blob.closePath()
    blob.scale(.8)
    blob.translate(p(img.width / 2, img.height / 2))

    c.fill(255, 150)
    c.drawingContext.filter = `blur(20px)`
    fillShape(c, blob.offset(20))
    c.drawingContext.filter = `blur(10px)`
    fillShape(c, blob.offset(10))
    c.drawingContext.filter = `blur(5px)`
    fillShape(c, blob.offset(5))

    c.drawingContext.filter = 'none'
    c.fill(50)
    c.strokeWeight(10)
    c.stroke(0, 200)
    fillShape(c, blob)
    c.strokeWeight(1)

    blob = blob.offset(-5)

    for (let x = blob.bounds.x; x < blob.bounds.x + blob.bounds.width; x += .5) {
        for (let y = blob.bounds.y; y < blob.bounds.y + blob.bounds.height; y += .5) {
            const p1 = p(x, y)
            if (!blob.contains(p1)) continue
            const yval = (abs(y % 40 - 20) / 20)
            const distVal = blob.getNearestPoint(p1).getDistance(p1)
            c.stroke(yval * 100 + 150, distVal)
            c.line(x, y, x, y)
        }
    }
    img.imageMode(CENTER)
    img.translate(random(img.width), random(img.height))
    img.rotate(random(360))
    img.image(c, 0, 0)
    img.resetMatrix()
}


function ammonite(img, pos, maxr) {
    const c = createGraphics(img.width, img.height)

    const revolutions = random(2,5)
    const spiralPath = new Path()
    for (let r = 0; r < maxr; r += 2) {
        const a = map(r, 0, maxr, 0, 360 * revolutions)
        spiralPath.add(pointFromAngle(a, r))
    }
    spiralPath.smooth()
    spiralPath.translate(pos)

    for (let i = 0; i < spiralPath.length; i += .1) {
        const loc = spiralPath.getLocationAt(i)
        const d = maxr * i / spiralPath.length
        for (let j = 0; j <= d; j += 1) {
            const pos = loc.point.add(loc.normal.multiply(j))
            const roundVal = sin(180 * j / d)
            const ridgeVal = 1 - sin(180 * (i % 10) / 10)
            c.stroke(100 + ridgeVal * roundVal * 155, 255)
            c.line(pos.x, pos.y, pos.x, pos.y)
        }
    }

    img.image(c, 0, 0)
    img.resetMatrix()
}