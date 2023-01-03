precision mediump float;

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform float seed;
uniform float scale;

vec2 hash22(vec2 p) { 
    float n = sin(dot(p, vec2(41. + seed, 289. + seed)));
    return fract(vec2(262144, 32768)*n);   
}

float smin(float a, float b, float k){
    float h = clamp(.5 + .5*(b - a)/k, 0., 1.);
    return mix(b, a, h) - k*h*(1. - h);
}

float smin2(float a, float b, float r){
   float f = max(0., 1. - abs(b - a)/r);
   return min(a, b) - r*.25*f*f;
}

float sminExp(float a, float b, float k){
    float res = exp(-k*a) + exp(-k*b);
    return -log(res)/k;
}


float Voronoi(in vec2 p){
	vec2 g = floor(p), o; p -= g;
	vec3 d = vec3(8.);
	for(int j = -1; j < 2; j++){
		for(int i = -1; i < 2; i++){
			o = vec2(i, j);
            o += hash22(g + o) - p;
			d.z = length(o); 
            d.y = max(d.x, smin(d.y, d.z, .4));
            d.x = smin(d.x, d.z, .2);
		}
	}    
    return d.y - d.x;    
}

 

void main(){
    vec2 uv = vTexCoord.xy;
    uv.y *= 2.;
    uv *= (.7 + length(uv)*.8);
    uv *= scale;
    
    float c = Voronoi(uv*5.);
    vec3 col = vec3(c*1.2);

	gl_FragColor = vec4(sqrt(col), 1.); 
}
