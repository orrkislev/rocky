precision mediump float;

#define PI 3.141592
#define TWO_PI 6.28319

uniform sampler2D tex0;
uniform vec2 resolution;
uniform vec3 color1;
uniform vec3 color2;
uniform float time;

varying vec2 vTexCoord;

vec3 sunDir = normalize(vec3(0., 0.2, 1.));
vec3 sunCol;

const float sphRad = 6.;


// 2D roation matrix
mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

// Rodrigues' rotation formula : rotates v around u of an angle a
vec3 rot(vec3 v, vec3 u, float a){
    float c = cos(a);
    float s = sin(a);
    return v * c + cross(u, v) * s + u * dot(u, v) * (1. - c);
}

float saturate(float x){ return clamp(x, 0., 1.); }

// 3D random texture based noise
// float noise(vec3 p){
//     vec3 i = floor(p);
//     vec3 f = fract(p);
//     f = f * f * f * (6. * f * f - 15. * f + 10.);
//     p = i + f;
//     return textureLod(iChannel0, (p+0.5)/32., 0.).r;
// }
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

float fbm(vec3 p){
    float f;
    f = 0.5 * noise(p * 1.);
    f += 0.25 * noise(p * 2.);
    f += 0.125 * noise(p * 4.);
    f += 0.0625 * noise(p * 8.);
    return f;
}

// sphere intersection : returns the distance to the two intersection points with a ray
vec2 sphIntersect(vec3 ro, vec3 rd){
    float a = dot(rd, rd);
    float b = dot(ro, rd);
    float d = b * b - a * (dot(ro, ro) - sphRad * sphRad);
    
    if(d < 0.) return vec2(-1.);
    
    d = sqrt(d);
    float tn = (-b - d) / a;
    float tf = (-b + d) / a;
    
    return vec2(tn, tf);
}


// sun and sky background in a ray direction
vec3 background(vec3 ro, vec3 rd){
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
    vec4 origTex = texture2D(tex0,uv);

    vec3 sky = origTex.xyz;
    // vec3 sky = vec3(0.06, 0.08, 0.1) * 5.;
    vec3 col = sky;
    
    // sun
    float d = clamp(dot(rd, sunDir), 0., 1.);
    
    // col += sunCol * smoothstep(0.998, 1., d) * vec3(1., 0.6, 0.4) + smoothstep(0.9985, 1., d);
    // col += sunCol * smoothstep(0.9, 1., d) * 0.2 * (1.-col);
    
    // col = mix(col, sunCol, 0.2);
    
    return col;
}

// sample cloud density for a point in space
float getDensity(vec3 p){
    const float densMult = 12.;
    const float scale = .7;
    const float densThresh = 0.62;
    float f = fbm(p * scale + time);
    f = max(0., f - densThresh) * densMult;
    
    f *= smoothstep(1., 0.8, dot(p, p) / (sphRad * sphRad));
    
    return f;
}

// raymarches inside the cloud towards light : returns transmittance
float lightmarch(vec3 p){
    const float numSteps = 40.;
    const float absorption = 0.9;
    const float darkness = 1.2;
    
    vec2 itsc = sphIntersect(p, sunDir);
    float stepSize = itsc.y / numSteps;
    
    float density = 0.;
    
    for(float i = 0.; i < numSteps; ++i){
        p += sunDir * stepSize;
        density += getDensity(p) * stepSize;
    }
    
    float transmittance = exp(-density * absorption);
    return darkness + transmittance * (1. - darkness);
}

// raymarches total cloud density : returns the (transmittance, energy) at that point
vec2 raymarch(vec2 itsc, vec3 ro, vec3 rd){
    const float numSteps = 64.;
    const float absorption = 1.2;
    const float phase = 1.2;
    
    float stepSize = (itsc.y - itsc.x) / numSteps;
    vec3 p = ro + max(0., itsc.x) * rd + 0.001 * rd;
    
    float transmittance = 1.;
    float energy = 0.;
    
    for(float i = 0.; i < numSteps; ++i){
        float density = getDensity(p);
        if(density > 0.){
            float sunTransmittance = lightmarch(p);
            energy += density * stepSize * transmittance * sunTransmittance * phase;
            transmittance *= exp(-density * stepSize * absorption);
        }
        p += rd * stepSize;
    }
    
    return vec2(transmittance, energy);
}

// renders the color for a given direction
vec3 render(vec3 ro, vec3 rd){
    vec3 col = background(ro, rd);
    
    vec2 itsc = sphIntersect(ro, rd);
    
    if(itsc.y < 0.){
        return col;
    }
    
    vec2 light = raymarch(itsc, ro, rd);
    return col * light.x + sunCol * light.y;
}

void main(){
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;
    uv -= vec2(0.5,0.2);
    uv.y *= 2.0;
    uv.x *= 1.0;

    
    // pixel ray    
    vec3 ro = vec3(0., 0., -10.);
    vec3 rd = normalize(vec3(uv, 1.));
    
    // control camera
    vec2 mouseAngle = vec2(0.5,0.5);
    mouseAngle -= 0.5;
    // mouseAngle.x *= iResolution.x / iResolution.y;
    mouseAngle *= -PI;

    ro.yz *= rot(mouseAngle.y);
    rd.yz *= rot(mouseAngle.y);
    ro.xz *= rot(mouseAngle.x);
    rd.xz *= rot(mouseAngle.x);
    
    // animate sun
    const float sunSpeed = 0.2;
    vec3 rotAxis = normalize(vec3(1., 1., 0.));
    float sunAngle = mod(time * sunSpeed, TWO_PI);
    
    const vec3 brightSunCol = vec3(1.,0.97,0.95);
    // const vec3 darkSunCol = vec3(1., 0.5, 0.3);

    // vec3 brightSunCol = color1;
    vec3 darkSunCol = mix(vec3(1.0), color1, 0.5);
    
    float f = sunAngle / TWO_PI;
    f = 1. - smoothstep(0., 1., abs(f-0.5)*2.);
    sunCol = mix(brightSunCol, darkSunCol, f);
    
    sunDir = rot(sunDir, rotAxis, sunAngle);
    
    // color
    vec3 col = vec3(0.);
    
    col = render(ro, rd);
    // simple post processing
    // col = mix(col, sunCol, pow(1. - uv.y, 2.) * 0.15);

    gl_FragColor = vec4(col,1.0);
}