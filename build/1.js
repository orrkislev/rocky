// --- AB Random

class Random {
    constructor() {
        this.usage = 0
        this.useA = false;
        this.sfc32 = function (uint128Hex) {
            let a = parseInt(uint128Hex.substr(0, 8), 16);
            let b = parseInt(uint128Hex.substr(8, 8), 16);
            let c = parseInt(uint128Hex.substr(16, 8), 16);
            let d = parseInt(uint128Hex.substr(24, 8), 16);
            return function () {
                a |= 0; b |= 0; c |= 0; d |= 0;
                let t = (((a + b) | 0) + d) | 0;
                d = (d + 1) | 0;
                a = b ^ (b >>> 9);
                b = (c + (c << 3)) | 0;
                c = (c << 21) | (c >>> 11);
                c = (c + t) | 0;
                return (t >>> 0) / 4294967296;
            };
        };
        // seed prngA with first half of tokenData.hash
        this.prngA = new this.sfc32(tokenData.hash.substr(2, 32));
        // seed prngB with second half of tokenData.hash
        this.prngB = new this.sfc32(tokenData.hash.substr(34, 32));
        for (let i = 0; i < 1e6; i += 2) {
            this.prngA();
            this.prngB();
        }
    }

    reset(times) {
        this.prngA = new this.sfc32(tokenData.hash.substr(2, 32));
        this.prngB = new this.sfc32(tokenData.hash.substr(34, 32));
        for (let i = 0; i < 1e6; i += 2) {
            this.prngA();
            this.prngB();
        }
        for (let i = 0; i < times; i++) {
            this.random_dec()
        }
    }
    // random number between 0 (inclusive) and 1 (exclusive)
    random_dec() {
        this.usage++
        this.useA = !this.useA;
        return this.useA ? this.prngA() : this.prngB();
    }
    // random number between a (inclusive) and b (exclusive)
    random_num(a, b) {
        return a + (b - a) * this.random_dec();
    }
    // random integer between a (inclusive) and b (inclusive)
    // requires a < b for proper probability distribution
    random_int(a, b) {
        return Math.floor(this.random_num(a, b + 1));
    }
    // random value in an array of items
    random_choice(list) {
        return list[this.random_int(0, list.length - 1)];
    }

    random(a = 1, b = 0) { return this.random_num(a, b) }
}

const RANDOM = new Random()



// --- DRAW

// let allDots = 0
// async function drawDotXY(x, y) {
//     allDots++
//     if (allDots % 1000 == 0) await timeout()
//     point(x,y)
//     // line(x, y, x, y)
// }

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}




// -- CURVE
function toCrv(crv) {
    crv.push(crv[crv.length - 1])
    crv.splice(0, 0, crv[0])
    const newCrv = []
    for (let i = 0; i < crv.length - 3; i++) {
        const nextP = crv[i + 1]
        const nextnextP = crv[i + 2]
        const l = vdist(nextP, nextnextP)
        for (let t = 0; t < l; t++) {
            x = curvePoint(crv[i].x, crv[i + 1].x, crv[i + 2].x, crv[i + 3].x, t / l)
            y = curvePoint(crv[i].y, crv[i + 1].y, crv[i + 2].y, crv[i + 3].y, t / l)
            newCrv.push(v(x, y))
        }
    }
    return newCrv
}

const v = (x, y) => createVector(x, y),
    vdist = p5.Vector.dist
    vadd = p5.Vector.add,
    vmul = p5.Vector.mult,
    vsub = p5.Vector.sub
const angleVec = (a, d) => v(cos(a) * d, sin(a) * d)




// --- UTILS
const R = (a = 1, b = 0) => RANDOM.random(a, b)
const R2 = (a = 1, b = 0) => Math.floor(R(a, b + 1))
const R3 = (arr) => arr[Math.floor(R(arr.length))]

const easeInOutExpo = (x) => x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2
const easeOutQuad = (x) => 1 - (1 - x) * (1 - x)
const easeOutQuad_reverse = (x) => 1 - sqrt(1 - x)

projections = [
  (x, y) => {
    x *= -1
    let r = sqrt(x * x + y * y) * 2
    r = easeOutQuad_reverse(r) / 2
    const a = atan2(y, x)
    if (r > .5 || !r) return null

    const lat = r * 180 - 90;
    const long = a
    return V(lat, long)
  }, (x, y) => {
    const lat = y * 180
    const long = x * 360
    if (abs(lat) > 90 || abs(long) > 180) return null
    return V(lat, long)
  }, (x, y) => {
    x *= -1
    y = (y + .25) / 1.5
    let r = sqrt(x * x + y * y)
    r = (r - 0.05) / 0.45
    r = easeOutQuad_reverse(r)
    const lat = r * 180 - 90

    if (r < .0 || !r) return null

    const a = ((atan2(y, x) + 360) % 360)
    let long = null
    if (a < 200) long = ((a + 20) / 220) * 360 - 180
    if (a > 340) long = ((a - 340) / 220) * 360 - 180
    if (!long) return null
    return V(lat, long)
  }, (origx, origy) => {
    x = origx * pi * 2
    y = origy * halfPi * 2.5
    var delta;
    var sy = sign(y);
    y = abs(y) / pi;
    var x1 = sign(x) * x / halfPi,
      D = (x1 * x1 - 1 + 4 * y * y) / abs(x1),
      D2 = D * D,
      B = y * (2 - (y > 0.5 ? min(y, abs(x)) : 0)),
      r = x * x + y * y,
      i = 50;
    do {
      var B2 = B * B,
        C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
        C_ = (3 * B - B2 * B - 10) / (2 * B2 * B),
        C2 = C * C,
        BC = B * C,
        B_C = B + C,
        B_C2 = B_C * B_C,
        B_3C = B + 3 * C,
        F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + C2 * (12 * BC + 4 * C2)),
        F_ = -2 * B_C * (4 * BC * C2 + (1 - 4 * B2 + 3 * B2 * B2) * (1 + C_) + C2 * (-6 + 14 * B2 - D2 + (-8 + 8 * B2 - 2 * D2) * C_) + BC * (-8 + 12 * B2 + (-10 + 10 * B2 - D2) * C_)),
        sqrtF = sqrt(F),
        f = D * (B_C2 + C2 - 1) + 2 * sqrtF - x1 * (4 * B_C2 + D2),
        f_ = D * (2 * C * C_ + 2 * B_C * (1 + C_)) + F_ / sqrtF - 8 * B_C * (D * (-1 + C2 + B_C2) + 2 * sqrtF) * (1 + C_) / (D2 + 4 * B_C2);
      B -= delta = f / f_;
    } while (delta * r * r > epsilon && --i > 0);

    let lon = sign(x) * (sqrt(D * D + 4) + D) * pi / 4
    let lat = sy * halfPi * B
    lat = (lat / halfPi) * 90
    lon = (lon / pi) * 180
    if (!lat || !lon) return null
    if (abs(lat) > 90 || abs(lon) > 180) return null
    return V(lat, lon);
  }, (origx, origy) => {
    if (abs(origy) > .45) return null
    x = origx * pi * 2
    y = origy * halfPi * 2
    var phi = y, i = 25, delta, phi2, phi4, phi6;
    do {
      phi2 = phi * phi; phi4 = phi2 * phi2;
      phi -= delta = ((phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))) - y) /
        (1.01183 + phi4 * phi4 * ((9 * -0.02625) + (11 * 0.01926) * phi2 + (13 * -0.00396) * phi4));
    } while (abs(delta) > epsilon2 && --i > 0);
    phi2 = phi * phi; phi4 = phi2 * phi2; phi6 = phi2 * phi4;

    let lon = x / (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)),
      lat = phi
    lat = (lat / halfPi) * 90
    lon = (lon / pi) * 180
    if (abs(lat) > 90 || abs(lon) > 180) return null
    return V(lat, lon);
  }, (x, y) => {
    x *= 2
    y *= 2
    const lat = y * 90
    const w = sqrt(1 - abs(y) ** 2) / 2
    let lon = 200
    lon = map(abs(x), .5 - w, .5 + w, 0, 180)
    if (lon > 180 || lon < 0) return null
    if (abs(lat) > 90 || abs(lon) > 180) return null
    lon *= sign(x)
    return V(lat, lon);
  }, (origx, origy) => {
    const x = origx * pi * 2
    const y = origy * halfPi * 2.5
    const z = sqrt(x * x + y * y),
      c = 2 * asin(z / 2),
      sc = sin(c),
      cc = cos(c);
    let lon = atan2(x * sc, z * cc),
      lat = asin(z && y * sc / z)
    if (abs(lat) > 90 || abs(lon) > 180) return null
    if (!lat && !lon) return null
    return V(lat, lon);
  },
]












function ellipticJi(u, v, m) {
  var a, b, c;
  if (!u) {
    b = ellipticJ(v, 1 - m);
    return [
      [0, b[0] / b[1]],
      [1 / b[1], 0],
      [b[2] / b[1], 0]
    ];
  }
  a = ellipticJ(u, m);
  if (!v) return [[a[0], 0], [a[1], 0], [a[2], 0]];
  b = ellipticJ(v, 1 - m);
  c = b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0];
  return [
    [a[0] * b[2] / c, a[1] * a[2] * b[0] * b[1] / c],
    [a[1] * b[1] / c, -a[0] * a[2] * b[0] * b[2] / c],
    [a[2] * b[1] * b[2] / c, -m * a[0] * a[1] * b[0] / c]
  ];
}

function ellipticJ(u, m) {
  var ai, b, phi, t, twon;
  if (m < epsilon) {
    t = sin(u);
    b = cos(u);
    ai = m * (u - t * b) / 4;
    return [
      t - ai * b,
      b + ai * t,
      1 - m * t * t / 2,
      u - ai
    ];
  }
  if (m >= 1 - epsilon) {
    ai = (1 - m) / 4;
    b = cosh(u);
    t = tanh(u);
    phi = 1 / b;
    twon = b * sinh(u);
    return [
      t + ai * (twon - u) / (b * b),
      phi - ai * t * phi * (twon - u),
      phi + ai * t * phi * (twon + u),
      2 * atan(exp(u)) - halfPi + ai * (twon - u) / b
    ];
  }

  var a = [1, 0, 0, 0, 0, 0, 0, 0, 0],
    c = [sqrt(m), 0, 0, 0, 0, 0, 0, 0, 0],
    i = 0;
  b = sqrt(1 - m);
  twon = 1;

  while (abs(c[i] / a[i]) > epsilon && i < 8) {
    ai = a[i++];
    c[i] = (ai - b) / 2;
    a[i] = (ai + b) / 2;
    b = sqrt(ai * b);
    twon *= 2;
  }

  phi = twon * a[i] * u;
  do {
    t = c[i] * sin(b = phi) / a[i];
    phi = (asin(t) + phi) / 2;
  } while (--i);

  return [sin(phi), t = cos(phi), t / cos(phi - b), phi];
}

function ellipticFi(phi, psi, m) {
  var r = abs(phi),
    i = abs(psi),
    sinhPsi = sinh(i);
  if (r) {
    var cscPhi = 1 / sin(r),
      cotPhi2 = 1 / (tan(r) * tan(r)),
      b = -(cotPhi2 + m * (sinhPsi * sinhPsi * cscPhi * cscPhi) - 1 + m),
      c = (m - 1) * cotPhi2,
      cotLambda2 = (-b + sqrt(b * b - 4 * c)) / 2;
    return [
      ellipticF(atan(1 / sqrt(cotLambda2)), m) * sign(phi),
      ellipticF(atan(sqrt((cotLambda2 / cotPhi2 - 1) / m)), 1 - m) * sign(psi)
    ];
  }
  return [
    0,
    ellipticF(atan(sinhPsi), 1 - m) * sign(psi)
  ];
}

function ellipticF(phi, m) {
  if (!m) return phi;
  if (m === 1) return log(tan(phi / 2 + quarterPi));
  var a = 1,
    b = sqrt(1 - m),
    c = sqrt(m);
  for (var i = 0; abs(c) > epsilon; i++) {
    if (phi % pi) {
      var dPhi = atan(b * tan(phi) / a);
      if (dPhi < 0) dPhi += pi;
      phi += dPhi + ~~(phi / pi) * pi;
    } else phi += phi;
    c = (a + b) / 2;
    b = sqrt(a * b);
    c = ((a = c) - b) / 2;
  }
  return phi / (pow(2, i) * a);
}










var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var ceil = Math.ceil;
var cos = Math.cos;
var exp = Math.exp;
var floor = Math.floor;
var log = Math.log;
var max = Math.max;
var min = Math.min;
var pow = Math.pow;
var round = Math.round;
var sign = Math.sign || function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
var sin = Math.sin;
var tan = Math.tan;

var epsilon = 1e-6;
var epsilon2 = 1e-12;
var pi = Math.PI;
var halfPi = pi / 2;
var quarterPi = pi / 4;
var sqrt1_2 = Math.SQRT1_2;
var sqrt2 = sqrt(2);
var sqrtPi = sqrt(pi);
var tau = pi * 2;
var degrees = 180 / pi;
var radians = pi / 180;

function sinci(x) {
  return x ? x / Math.sin(x) : 1;
}

function asin(x) {
  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function sqrt(x) {
  return x > 0 ? Math.sqrt(x) : 0;
}

function tanh(x) {
  x = exp(2 * x);
  return (x - 1) / (x + 1);
}

function sinh(x) {
  return (exp(x) - exp(-x)) / 2;
}

function cosh(x) {
  return (exp(x) + exp(-x)) / 2;
}

function arsinh(x) {
  return log(x + sqrt(x * x + 1));
}

function arcosh(x) {
  return log(x + sqrt(x * x - 1));
}

backgroundColors = [[245, 245, 220], [239, 208, 184], [219, 206, 160], [234, 234, 234], [50, 50, 50]]
goldColors = [[194, 175, 80], [114, 84, 15], [210, 186, 92], [255, 230, 140]]
greenColors = [[85, 166, 48], [0, 127, 95], [128, 185, 24], [43, 147, 72]]
ribbonColors = [[255, 71, 55], [210, 186, 92]]

const toColor = (colorArray) => color(colorArray[0], colorArray[1], colorArray[2])

let onMap, brightColor, depth, col, slope
let lightHeight, hitMap, lastDepth, pos
let slopeMultiplier, ribbon

function setup() {
    const ratio = 9 / 16
    if (windowWidth < windowHeight * ratio) createCanvas(round(windowWidth), round(windowWidth / ratio))
    else createCanvas(round(windowHeight * ratio), round(windowHeight))
    setAttributes('willReadFrequently', true);
    PS = width / 1000
    noiseSeed(R2(1000))
    angleMode(DEGREES)
    V = createVector

    backgroundColor = R3(backgroundColors)
    paperColor = ([255, 215, 200]).sort(() => R() - .5)
    paperColor = [255, 255, 255]
    pencilDarkColor = [0, 0, R() < 0.5 ? 0 : 50]
    pencilBrightColor = R() < 0.7 || backgroundColor[0] < 100 ? [255, 255, 255] : backgroundColor

    renderType = R3([1, 2])
    if (renderType == 1) moreColors = R3([goldColors, greenColors])
    withWallShadow = R() < 0.5

    makeImage()
}

async function makeImage() {
    makeBackground()
    await timeout()

    projection = R3(projections)
    fillDir = R(30, 80) * (R() < .5 ? 1 : -1)
    gridAspectRatio = projections.indexOf(projection) == 5 ? 2 : 1.5
    const horizontalMargin = width * .1
    gridWidth = width - horizontalMargin * 2
    gridHeight = gridWidth * gridAspectRatio
    if (gridHeight > height - horizontalMargin * 2) {
        gridHeight = height - horizontalMargin * 2
        gridWidth = gridHeight / gridAspectRatio
    }

    heightMap = createHeightMap()
    // image(heightMap, 0, 0, width, width * heightMap.height / heightMap.width)
    // return

    drawArea = withWallShadow ? [width, height] : [gridWidth, gridHeight]






    RANDOM.reset()
    const d = pixelDensity()
    console.time('phase - draw relief')
    translate(-width / 2, height / 2)
    
    if (R() < 0.3) {
        ribbonStart = V(drawArea[0] * R(-.4, .4), -drawArea[1] * .4)
        ribbonCenter = V(drawArea[0] * R(-.3, .3), 0)
        ribbonEnd = V(drawArea[0] * R(-.4, .4), drawArea[1] * .4)
        ribbonStartDir = vsub(ribbonCenter, ribbonStart).rotate(R(-45, 45)).normalize(100 * PS)
        ribbonEndDir = vsub(ribbonCenter, ribbonEnd).rotate(R(-45, 45)).normalize(100 * PS)
        ribbonPath = [ribbonStart, ribbonStart.add(ribbonStartDir), ribbonCenter, ribbonEnd.add(ribbonEndDir), ribbonEnd]
        ribbonPath = toCrv(ribbonPath)

        ribbon = {
            path: ribbonPath,
            width: PS * R(80, 200),
            color: R3(ribbonColors)
        }

        ribbon.mask = createGraphics(width, height)
        ribbon.mask.strokeWeight(ribbon.width / 2)
        for (let i = 0; i < ribbon.path.length; i++) {
            const pos = ribbon.path[i]
            ribbon.mask.point(width / 2 + pos.x, height / 2 + pos.y)
        }
        ribbon.mask.loadPixels()
        // resetMatrix()
        // image(ribbon.mask, 0, 0)
        // asldhs()
        applyRibbon = () => {
            const x = round(pos.x + width / 2)
            const y = round(pos.y + height / 2)
            const i = (y * d * width * d + x * d) * 4
            const inRibbonMask = ribbon.mask.pixels[i + 3] > 0
            if (inRibbonMask) {
                brightColor = ribbon.color
                // depth = lerp(lastDepth, depth + 60, .5)
                depth += lerp(abs(pos.y) / gridHeight, 1, .5) * 60
                hitMap = true
                onMap = true
            }
        }
    }

    const shadowMultiplier = R(.2, .8)
    applyLights = () => {
        if (!depth) return
        if (depth > lightHeight) col += 200
        lightHeight = max(lightHeight, depth)
        const distToLight = V(pos.x, pos.y).div(gridHeight, gridWidth).add(.5, .5).sub(lightPos).mag()
        const lightStep = map(distToLight, 0, 2, 1, .2) * shadowMultiplier
        lightHeight -= lightStep
    }

    if (renderType == 1) {
        prepareRender = () => {
            let finalColor = brightColor
            if (col < slopeMultiplier * .3) finalColor = pencilDarkColor
            else if (col < slopeMultiplier * .8) finalColor = brightColor == pencilBrightColor ? R3(moreColors) : brightColor
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





    lightPos = V(fillDir > 0 ? 0 : 1, 0)
    offsetX = drawArea[1] * tan(90 - fillDir)
    startX = fillDir > 0 ? -drawArea[0] / 2 - offsetX : -drawArea[0] / 2
    endX = fillDir > 0 ? drawArea[0] / 2 : drawArea[0] / 2 - offsetX
    moveX = PS * Math.sign(fillDir) * cos(fillDir) * .25
    moveY = PS * Math.sign(fillDir) * sin(fillDir) * .25
    strokeWeight(PS * 2)
    for (let x = startX; x < endX; x += 1 * PS) {
        lightHeight = 0
        hitMap = false
        lastDepth = 0
        pos = V(x, -drawArea[1] / 2)
        while (pos.y < drawArea[1] / 2) {
            pos.y += moveY
            pos.x += moveX
            if (pos.x < -drawArea[0] / 2 || pos.x > drawArea[0] / 2 || pos.y < -drawArea[1] / 2 || pos.y > drawArea[1] / 2) continue

            const relX = pos.x / gridWidth
            const relY = pos.y / gridHeight

            onMap = false
            brightColor = pencilBrightColor
            depth = 0
            col = 0
            slope = 0

            const pos2d = projection(relY, relX)
            if (pos2d) {
                const i = 4 * (
                    (Math.round(((pos2d.x + 90) / 180) * heightMap.height) * d)
                    * (heightMap.width * d)
                    + Math.round(((pos2d.y + 180) / 360) * heightMap.width) * d)
                depth += heightMap.pixels[i]

                slope = depth - lastDepth
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
            line(drawPos.x + width, drawPos.y, drawPos.x + width, drawPos.y + .1)
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
    rect(20 * PS, 20 * PS, width - 40 * PS, height - 40 * PS, 2 * PS)
    const paperColorHex = `#${num2hex(pencilDarkColor[0])}${num2hex(pencilDarkColor[1])}${num2hex(pencilDarkColor[2])}`
    for (let i = 0; i < 10; i++) {
        const x = R(width)
        const y = R(height)
        const gradient = drawingContext.createRadialGradient(x, y, 0, x, y, width * R(.25, .75))
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
    const newDist = mag * (1 + noise(mag / (PS * 100), angle / 100) * .15 - .075)
    return angleVec(angle, newDist)
}

