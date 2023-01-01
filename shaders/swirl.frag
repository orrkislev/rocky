precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D texture;
uniform vec2 resolution;
uniform vec2 pos;
uniform float radius;
uniform float strength;

#define PI 3.1415926535897932384626433832795

vec2 rotate(vec2 v, float a) {
  float s = sin(a / 180.0 * PI);
  float c = cos(a / 180.0 * PI);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}

float easeOutQuad(float t) {
  return t * (2.0 - t);
}

void main() {
  vec2 pixel = vTexCoord * resolution;
  vec4 origTex = texture2D(texture,vTexCoord);

  float dist = distance(pixel, pos);
  if (dist > radius) {
    gl_FragColor = origTex;
    return;
  }

  float rotation = strength * (1. - easeOutQuad(dist / radius));
  vec2 relPos = rotate(pixel - pos, rotation);
  vec2 p2 = pos + relPos;
  p2.x = clamp(p2.x, 0.0, resolution.x);
  p2.y = clamp(p2.y, 0.0, resolution.y);

  vec4 col = texture2D(texture, p2/resolution);
  gl_FragColor = col;
}


// this is the code from the original js

// const rotation = ammount * (1 - easeOutQuad(d / r))
// const relPos = mapPos.subtract(pos).rotate(rotation)
// const p2 = pos.add(relPos)
// const c2 = img.get(
//     constrain(p2.x, 0, c.width - 1),
//     constrain(p2.y, 0, c.height - 1))
// c.set(x, y, c2)