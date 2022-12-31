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

function makeShader() {

    const frag = `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform sampler2D heightMap;
        uniform vec2 heightMapResolution;

        vec2 pixelSize = vec2(1.0 / heightMapResolution.x, 1.0 / heightMapResolution.y);
        float pixelLength = length(pixelSize);

        vec2 lightPos = vec2(0.0, 1.0);
        vec2 lightDir = normalize(vec2(-1.0, 1.0));

        float getVal(vec2 uv){
            return texture2D(heightMap, uv).r;
        }
        vec2 getPosTowardLight(vec2 uv, float dist){
            vec2 dir = lightDir;
            // vec2 dir = normalize(lightPos - uv);
            return uv + dir * dist * pixelLength;
        }
        float getValTowardLight(vec2 uv, float dist){
            return getVal(getPosTowardLight(uv, dist));
        }

        float inLight(vec2 uv, float distToLight){
            float val = getVal(uv);

            float slope = val - getValTowardLight(uv, 1.0);
            float res = slope * 10.0;

            for (float i = 0.01; i < 1.0; i += 0.01){
                float valTowardLight = getValTowardLight(uv, i * distToLight *  30.0);
                if (valTowardLight > val){
                    return res;
                }
            }
            return 1.0;
        }

        void main(){
            vec3 col = vec3(0.0);
            col += getVal(vTexCoord) / 10.0;
            float distToLight = length(lightPos - vTexCoord);
            col += inLight(vTexCoord, distToLight);
            gl_FragColor = vec4(col, 1.0);
        }
    `

    return createShader(vert, frag);
}