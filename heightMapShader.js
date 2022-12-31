// c_map.background(127)
// for (let i = 0; i < 500; i++) {
//     const radius = c_size * random(.05, .3)
//     const shape = new Circle(randomIn(mapSize), radius).wonky(.5, 1.6)

//     fillShape(c_map, shape, p(scaler * 2, scaler * 2), 255, random(100, 255), random(scaler, scaler * 4))
//     fillShape(c_map, shape.offset(-scaler, true), null, 0, random(100, 255), random(scaler * 2))
// }
function makeMapElements() {
    scaler = width / 50
    c_size = scaler * random(20, 40)

    lines()
}

function lines() {
    const pathCreator = new PathCreator(width*2,width, pathTypes.noiseField)
    const sumLines = 50//random(200, 1000)
    for (let i = 0; i < sumLines; i++) {
        path = pathCreator.createPath()

        addPath(path, scaler*3, scaler * random(2,6), 1, random())
        addPath(path, scaler, scaler * random(2), -1, random())

        // c_map.drawingContext.filter = `blur(${scaler * random(2, 6)}px)`
        // c_map.stroke(255, 200)
        // c_map.strokeWeight(scaler)
        // fillShape(c_map, path, p(scaler * 2, scaler * 2))
        // c_map.drawingContext.filter = `blur(${random(scaler * 2)}px)`
        // c_map.strokeWeight(scaler * .5)
        // c_map.stroke(0, random(50, 150))
        // fillShape(c_map, path)
    }
}

function addPath(path, r, blur, color, alpha) {
    for (let i = 0; i < path.segments.length - 1; i++) {
        const seg1 = path.segments[i]
        const seg2 = path.segments[i + 1]
        elements.push({
            type: 'spline',
            p1: seg1.point, p3: seg2.point, p2: seg1.point.add(seg1.handleOut),
            r, blur, color, alpha
        })
    }
}

function lotsOfCircles() {
    for (let i = 0; i < 1000; i++) {
        elements.push({
            type: 'circle',
            pos: [random(width * 2), random(width)], radius: random(c_size),
            color: (random() > .5 ? .5 : -.5), alpha: random(.1), blur: random(width)
        })
    }
}

function craters() {
    const sumCraters = 100//random(50,500)
    for (let i = 0; i < sumCraters; i++) {
        const pos = [random(width * 2), random(width)]
        const r = random(c_size / 3)
        elements.push({
            type: 'wonkyCircle', action: 'crater', pos, radius: r,
            color: 1, alpha: random(.5), blur: r * random(.5, 1), wonk: random(3, 10)
        })
    }
    elements.sort((a, b) => a.color > b.color ? 1 : -1)
}

const toVec2 = pos => `vec2(${pos.x.toFixed(2)},${pos.y.toFixed(2)})`
const lb = `
`
elements = []
function elementShader(e) {
    let res = ''
    if (e.type == 'circle')
        res += `val = wonkyCircle(uv, ${toVec2(e.pos)}, ${e.radius.toFixed(2)}, 0.0); ${lb}`
    else if (e.type == 'wonkyCircle')
        res = `val = wonkyCircle(uv, ${toVec2(e.pos)}, ${e.radius.toFixed(2)}, ${e.wonk.toFixed(2)});${lb}`
    else if (e.type == 'spline')
        res = `val = sdBezier(uv, ${toVec2(e.p1)},${toVec2(e.p2)},${toVec2(e.p3)},${e.r.toFixed(2)});`
    else if (e.type == 'line')
        res = `val = line(uv, ${toVec2(e.p1)},${toVec2(e.p2)}, ${e.r.toFixed(2)});`

    res += 'val = max(val,0.0);'

    if (e.blur) res += `val = blur(val, ${e.blur.toFixed(2)});`
    if (e.action == 'crater') res += `val = crater(val, uv, vec2(${e.pos[0].toFixed(2)}, ${e.pos[1].toFixed(2)}));${lb}`


    if (e.alpha != 1) res += `val *= ${e.alpha.toFixed(2)};${lb}`
    if (e.color != 1) res += `val *= ${e.color.toFixed(2)};${lb}`
    res += `sum += val;${lb}`
    return res
}

function getFragmentShader() {
    const scaler = width / 100

    const frag = `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform vec2 u_resolution;

        ${shaderNoise}

        float dot2(vec2 v) {
            return dot(v, v);
        }

        float circle(vec2 uv, vec2 center, float r){
            return r-length(uv - center);
        }

        float wonkyCircle(vec2 uv, vec2 center, float r, float wonkiness){
            vec2 rel = normalize(uv - center);
            float distort = snoise(rel * wonkiness / 5.0) * wonkiness;
            r += distort;
            return circle(uv, center, r);
        }
        float line( in vec2 p, in vec2 a, in vec2 b, float r) {
            vec2 pa = p-a, ba = b-a;
            float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
            return r - length( pa - ba*h );
        }

        float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C, float r){    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0/dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx-3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if( h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h,-h)-q)/2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
        res = dot2(d + (c + b*t)*t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
        res = min( dot2(d+(c+b*t.x)*t.x),
                   dot2(d+(c+b*t.y)*t.y) );
        // the third root cannot be the closest
        // res = min(res,dot2(d+(c+b*t.z)*t.z));
    }
    return r-sqrt( res );
}

        float blur(float d, float blur){
            return smoothstep(0.0, blur, d);
        }

        float crater(float val, vec2 uv, vec2 center){
            if (val > 0.9) return (val-1.05)*2.0;
            vec2 rel = normalize(uv - center);
            float angle = atan(rel.y, rel.x) / 3.14159265359;
            return val * (.5+sin(angle * 100.0)/20.0);
        }

        float scene(vec2 uv){
            float sum = 0.0;
            float val = 0.0;
            ${elements.map(e => `${elementShader(e)}`).join('')}
            return sum;
        }

        void main(){
            float val = .5 + scene(vTexCoord * u_resolution);
            // val += snoise(vTexCoord * u_resolution / 10.0) * .005;
            gl_FragColor = vec4(vec3(val), 1.0);
        }
    `
    return frag
}


const vert = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`

function createHeightMap_shader() {
    makeMapElements()

    const heightMap = createGraphics(width * 2, width, WEBGL)
    const shdr = heightMap.createShader(vert, getFragmentShader())
    heightMap.shader(shdr)
    shdr.setUniform('u_resolution', [width * 2, width])
    heightMap.noStroke()
    heightMap.rect(0, 0, width * 2, width)

    return heightMap
}