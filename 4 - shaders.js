const vert = `
attribute vec3 aPosition; attribute vec2 aTexCoord; varying vec2 vTexCoord;
void main() { vTexCoord = aTexCoord; vec4 positionVec4 = vec4(aPosition, 1.0); positionVec4.xy = positionVec4.xy * 2.0 - 1.0; gl_Position = positionVec4; }
`

const fragSwirl = `
precision mediump float; 
#define PI 3.1415926535897932384626433832795
varying vec2 vTexCoord; uniform sampler2D texture; uniform vec2 resolution; uniform vec2 pos; uniform float radius; uniform float strength; 
vec2 rotate(vec2 v, float a) { float s = sin(a / 180.0 * PI); float c = cos(a / 180.0 * PI); mat2 m = mat2(c, -s, s, c); return m * v; }
float easeOutQuad(float t) { return t * (2.0 - t); }
void main() { vec2 pixel = vTexCoord * resolution; vec4 origTex = texture2D(texture,vTexCoord); float dist = distance(pixel, pos); if (dist > radius) { gl_FragColor = origTex; return; } float rotation = strength * (1. - easeOutQuad(dist / radius)); vec2 relPos = rotate(pixel - pos, rotation); vec2 p2 = pos + relPos; p2.x = clamp(p2.x, 0.0, resolution.x); p2.y = clamp(p2.y, 0.0, resolution.y); vec4 col = texture2D(texture, p2/resolution); gl_FragColor = col; }
`

const fragVoronoi = `
precision mediump float; varying vec2 vTexCoord; uniform vec2 resolution; uniform float seed; uniform float scale;
vec2 hash22(vec2 p) { return fract(vec2(262144, 32768)*sin(dot(p, vec2(41. + seed, 289. + seed)))); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b - a)/k, 0., 1.); return mix(b, a, h) - k*h*(1. - h); }
float smin2(float a, float b, float r){ float f = max(0., 1. - abs(b - a)/r);return min(a, b) - r*.25*f*f;}
float sminExp(float a, float b, float k){ return -log(exp(-k*a) + exp(-k*b))/k; }
float Voronoi(in vec2 p){vec2 g = floor(p), o; p -= g;vec3 d = vec3(8.);for(int j = -1; j < 2; j++){for(int i = -1; i < 2; i++){o = vec2(i, j);o += hash22(g + o) - p;d.z = length(o); d.y = max(d.x, smin(d.y, d.z, .4));d.x = smin(d.x, d.z, .2);}}    return d.y - d.x;    }
void main(){vec2 uv = vTexCoord.xy * .5; uv.y *= .5;gl_FragColor = vec4(sqrt(vec3(Voronoi(uv*(.5 + length(uv)*1.3) * scale*5.))), 1.);}
`