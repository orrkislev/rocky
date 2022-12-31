precision mediump float;

uniform sampler2D tex0;
uniform sampler2D mask;
uniform vec2 resolution;
uniform float radius;

varying vec2 vTexCoord;

vec4 blur(sampler2D image, vec2 uv, float r){
    float pixelX = 1.0 / resolution.x;
    float pixelY = 1.0 / resolution.y;
    vec4 color = vec4(0.0);
    float total = 0.0;
    for (float i = -1.0; i <= 1.0; i += 0.1){
        for (float j = -1.0; j <= 1.0; j += 0.1){
            vec2 texCoord = uv + vec2(i * r * pixelX, j * r * pixelY);
            color += texture2D(image, texCoord);
            total += 1.0;
        }
    }
    return color / total;
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  
  vec4 origTex = texture2D(tex0,uv);
    vec4 maskTex = texture2D(mask,uv);
    if (maskTex.a == 0.0) {
        gl_FragColor = origTex;
        return;
    }
  vec4 tex = blur(tex0,uv, radius);
  gl_FragColor = tex;
}