let penThickness = .5
makeSVG = false

const drawDot = async p => await drawDotXY(p.x, p.y)
const drawXYRandom = async (x, y, rx = 1) => {
    const r = random(rx)
    await drawDotXY(x + r, y + r)
}

allDots = 0
nx = 1000
nxs = 0.08

async function drawDotXY(x, y) {
    allDots++
    if (allDots % 1000 == 0) await timeout()
    // nx += nxs
    // if (noise(nx) < 0.2) {
    //     penUp()
    //     return
    // }
    // penDown(x, y)
    // strokeWeight(penThickness * (1 + noise(nx)) * PS)

    line(x, y, x, y)
    // ctx.beginPath()
    // ctx.moveTo(x, y)
    // ctx.lineTo(x, y)
    // ctx.stroke()
}

let currPenStroke = null
let penIsUp = true
function penDown(x, y) {
    if (!makeSVG) return
    if (penIsUp) {
        currPenStroke = new Path()
        currPenStroke.strokeColor = 'red'
        penIsUp = false
    } else {
        const trns = drawingContext.getTransform()
        const tx = trns.e
        const ty = trns.f
        const px = trns.a * x - trns.b * y
        const py = trns.b * x + trns.a * y
        currPenStroke.add(p((tx + px) / pixelDensity(), (ty + py) / pixelDensity()))
    }
}
function penUp() {
    if (!makeSVG) return
    penIsUp = true
}

function fillShape(ps, x = 0, y = 0) {
    beginShape()
    ps.forEach(p => vertex(p.x + x, p.y + y))
    endShape()
}

async function drawShape(ps, x = 0, y = 0) {
    penUp()
    for (let p of ps)
        await drawDotXY(p.x + x, p.y + y)
}

lastTimeout = 0
function timeout(ms) {
    // return waitForKey(32).then(() => new Promise(resolve => setTimeout(resolve, max(ms, 100))))
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForKey(key) {
    return new Promise(resolve => {
        if (keyIsDown(key)) resolve()
        else window.addEventListener('keydown', e => {
            if (e.keyCode == key) resolve()
        })
    })
}
function addEffect() {
    filter(ERODE)
    filter(DILATE)
}

function pathToPoints(path) {
    if (path.children) {
        const ps = []
        path.children.forEach(child => ps.push(pathToPoints(child)))
        ps.flat()
        return ps
    } else {
        if (path.segments.length > 4) {
            let divideAt = -1
            for (let i = 1; i < path.segments.length; i++) {
                const prev = path.segments[i - 1].point
                const curr = path.segments[i].point
                const dist = prev.getDistance(curr)
                if (dist > 100) {
                    divideAt = i
                    break
                }
            }
            if (divideAt > 0) {
                const subPath1 = new Path(path.segments.slice(0, divideAt))
                const subPath2 = new Path(path.segments.slice(divideAt))
                return pathToPoints(subPath1).concat(pathToPoints(subPath2))
            }
        }


        const l = path.length
        const ps = []
        for (let i = 0; i < l; i += 0.8) ps.push(path.getPointAt(i))
        return ps
    }
}

async function drawPath(path, clr) {
    // if (clr) stroke(clr)
    if (path.children) {
        path.children.forEach(drawPath)
        return
    }
    const ps = pathToPoints(path)
    await drawShape(ps)
    // drawShape(ps.map(point=>point.multiply(1.02)))
}
function fillPath(path) {
    const ps = pathToPoints(path)
    fillShape(ps)
}



function erasePaths(path) {
    if (!makeSVG) return
    const trns = drawingContext.getTransform()
    const angle = acos(trns.a / pixelDensity())
    const x = trns.e
    const y = trns.f
    translatedPath = path.clone()
    translatedPath.rotateAround(p(0, 0), angle)
    // translatedPath.position = path.position.clone().rotate(angle)
    translatedPath.position.x += x / pixelDensity()
    translatedPath.position.y += y / pixelDensity()
    // translatedPath.position.x /= pixelDensity()
    // translatedPath.position.y /= pixelDensity()
    // translatedPath.fillColor = '#ff000088'
    // return

    const redPaths = paper.project.activeLayer.children.filter(redPath => redPath.strokeColor && redPath.strokeColor.red == 1)
    redPaths.forEach(redPath => {
        intersections = redPath.getIntersections(translatedPath)

        parts = []
        if (intersections.length > 0) {
            const offsets = []
            let totalOffset = 0
            while (intersections.length > 0) {
                const intersection = intersections.shift()
                const relOffset = intersection.offset - totalOffset
                offsets.push(relOffset)
                totalOffset += intersection.offset
            }

            for (let i = 0; i < offsets.length; i++) {
                const offset = offsets[i]
                newPart = redPath.splitAt(offset)
                parts.push(redPath)
                redPath = newPart
            }
            parts.push(redPath)
            parts = parts.filter(p => p)
        } else {
            parts.push(redPath)
        }

        // parts.forEach(part => part.strokeColor = 'blue')

        parts.forEach((p, i) => {
            const middlePoint = p.getPointAt(p.length / 2)
            if (translatedPath.contains(middlePoint)) {
                p.remove()
                // p.strokeColor = 'blue'
            } else {
                p.strokeColor = 'red'
            }
        })
    })
    translatedPath.remove()
}

function Erase(func) {
    erase()
    func()
    noErase()
}

function colorWithAlpha(clr, alpha = 255) {
    clr.setAlpha(alpha)
    return clr
}