precision mediump float;

uniform sampler2D tex0;
uniform vec2 resolution;
uniform float radius;

varying vec2 vTexCoord;


float threshold (vec4 color, float l) {
    float avr = (color.r + color.g + color.b) / 3.0;
    if (avr > l) {
        return 1.0;
    } else {
        return 0.0;
    }
}

float check(vec2 coord){
  float mask = texture2D(tex0, coord).a;
  if (mask == 0.0) return 0.0;

  float pixelX = 1.0 / resolution.x;
  float pixelY = 1.0 / resolution.y;
  float val = 0.0;
  float total = 0.0;
  for (float i = -1.0; i <= 1.0; i += 0.1){
    for (float j = -1.0; j <= 1.0; j += 0.1){
      vec2 texCoord = coord + vec2(i * 1.0 * pixelX, j * 1.0 * pixelY);
      val += threshold(texture2D(tex0, texCoord),.9);
      total += 1.0;
    }
  }
  val /= total;
  if (val > .8) {
        return 1.0;
    } else {
        return 0.0;
    }
}

float blur(sampler2D image, vec2 uv, float r){
    float pixelX = 1.0 / resolution.x;
    float pixelY = 1.0 / resolution.y;
    float val = 0.0;
    float total = 0.0;
    for (float i = -1.0; i <= 1.0; i += 0.01){
      vec2 texCoord = uv + vec2(i * r * pixelX, i * r * pixelY);
      val += check(texCoord);
      texCoord = uv + vec2(i * r * pixelX, -i * r * pixelY);
      val += check(texCoord);
      total += 2.0;
    }
    return val / total;
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  
  vec4 origTex = texture2D(tex0,uv);
  // gl_FragColor = origTex;
  float tex = blur(tex0,uv, radius);
  gl_FragColor = origTex + pow(tex,5.0)*250.0;
}
