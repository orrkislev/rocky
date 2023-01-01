let shaderGraphics, shaderResultGraphics

function swirl(img, pos, ammount, r) {
    if (!shaderGraphics) shaderGraphics = createGraphics(img.width, img.height, WEBGL)
    if (!shaderResultGraphics) shaderResultGraphics = createGraphics(img.width, img.height)
    shaderGraphics.noStroke()
    shaderGraphics.shader(swirlShader)
    swirlShader.setUniform('texture', img)
    swirlShader.setUniform('resolution', [img.width, img.height])
    swirlShader.setUniform('pos', [pos.x, pos.y])
    swirlShader.setUniform('strength', ammount)
    swirlShader.setUniform('radius', r)
    shaderGraphics.rect(0, 0, img.width, img.height)
    shaderResultGraphics.image(shaderGraphics, 0, 0, shaderResultGraphics.width, shaderResultGraphics.height)
    return shaderResultGraphics
}

function swirl2(img, pos, ammount, r) {
    const c = createGraphics(img.width, img.height)
    c.image(img, 0, 0)
    c.loadPixels()
    for (let x = 0; x < c.width; x++) {
        for (let y = 0; y < c.height; y++) {
            const mapPos = p(x, y)
            const d = mapPos.getDistance(pos)
            if (d > r) continue
            const rotation = ammount * (1 - easeOutQuad(d / r))
            const relPos = mapPos.subtract(pos).rotate(rotation)
            const p2 = pos.add(relPos)
            const c2 = img.get(
                constrain(p2.x, 0, c.width - 1),
                constrain(p2.y, 0, c.height - 1))
            c.set(x, y, c2)
        }
    }
    c.updatePixels()
    return c
}

function smear(img, path, strength, r) {
    const c = createGraphics(img.width, img.height)
    c.image(img, 0, 0)
    c.loadPixels()
    for (let x = 0; x < c.width; x++) {
        for (let y = 0; y < c.height; y++) {
            const mapPos = p(x, y)
            const closestLoc = path.getNearestLocation(mapPos)
            const d = closestLoc.point.getDistance(mapPos)
            const relativeStrength = (1 - easeOutQuad(d / r)) * strength
            if (d > r || closestLoc.offset < relativeStrength) continue
            const relPos = mapPos.subtract(closestLoc.point)
            const otherPoint = path.getPointAt(closestLoc.offset - relativeStrength)
            const p2 = otherPoint.add(relPos)
            const c2 = c.get(
                constrain(p2.x, 0, c.width - 1),
                constrain(p2.y, 0, c.height - 1))
            c.set(x, y, c2)
        }
    }
    c.updatePixels()
    return c
}

function tracks(img, path, trackWidth, slugWidth) {
    const side1 = path.offset(50)
    const side2 = path.offset(-50)
    side2.reverse()

    const trackShape = side1.join(side2)
    trackShape.closePath()
    const c = createGraphics(img.width, img.height)
    c.image(img, 0, 0)
    for (let x = 0; x < c.width; x++) {
        for (let y = 0; y < c.height; y++) {
            const mapPos = p(x, y)
            if (!trackShape.contains(mapPos)) continue
            const closestLoc = path.getNearestLocation(mapPos)
            const d = closestLoc.point.getDistance(mapPos)
            let slugVal = closestLoc.offset % slugWidth
            slugVal = easeInOutExpo(slugVal / slugWidth)
            const dVal = easeOutQuad(d / trackWidth)
            c.stroke(0, 150 + 100 * slugVal * dVal)
            c.line(x, y, x, y)
        }
    }
    return c
}