/**
 * GLSL shaders (WebGL2 via three.js ShaderMaterial).
 * Kept in one place so they can be ported to TSL / WebGPU later.
 */

export const snoise = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
`;

/** Screen-space quad: use with PlaneGeometry(2, 2). Ignores the camera. */
export const screenQuadVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Ping-pong "paint brush on water": rgb = velocity.xy + ink. */
export const trailFrag = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uAspect;
uniform float uDt;
uniform float uActive;
uniform vec2 uTexel;
varying vec2 vUv;
void main(){
  vec4 here = texture2D(uPrev, vUv);
  vec2 back = vUv - here.xy * uDt * 0.35;
  vec4 prev = texture2D(uPrev, back);
  vec4 blur = (
    texture2D(uPrev, back + vec2(uTexel.x, 0.0)) +
    texture2D(uPrev, back - vec2(uTexel.x, 0.0)) +
    texture2D(uPrev, back + vec2(0.0, uTexel.y)) +
    texture2D(uPrev, back - vec2(0.0, uTexel.y))) * 0.25;
  prev = mix(prev, blur, 0.4);
  prev.xy *= 0.968;
  prev.z *= 0.978;
  vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
  float s = exp(-dot(d, d) / 0.0022) * uActive;
  prev.xy += uVel * s * 0.85;
  prev.z += s * clamp(length(uVel) * 0.5, 0.0, 1.0);
  prev.xy = clamp(prev.xy, vec2(-2.0), vec2(2.0));
  prev.z = clamp(prev.z, 0.0, 1.5);
  gl_FragColor = vec4(prev.xyz, 1.0);
}
`;

/** Grainy red/orange northern lights + water brush + bottom-to-top dissolve. */
export const auroraFrag = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform float uDissolve;
uniform float uScroll;
uniform vec2 uRes;
uniform sampler2D uTrail;
uniform vec3 uRed;
uniform vec3 uOrange;
uniform vec3 uDeep;
varying vec2 vUv;
${snoise}
void main(){
  vec4 tr = texture2D(uTrail, vUv);
  vec2 uv = vUv - tr.xy * 0.05;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime * 0.05 + uScroll * 0.6;

  float warp = snoise(vec3(p * 0.7, t));
  float x = p.x * 1.15 + warp * 0.55 + 0.22 * sin(p.y * 2.2 + t * 3.0);
  float curtain = snoise(vec3(x * 2.1, p.y * 0.3 - t * 1.4, t * 0.6)) * 0.5 + 0.5;
  curtain = pow(curtain, 2.4);
  // fine vertical rays, like real aurora curtains
  float rays = snoise(vec3(x * 16.0, p.y * 0.25 - t * 2.0, t * 1.5)) * 0.5 + 0.5;
  curtain *= 0.55 + 0.6 * rays;
  float band = smoothstep(-0.95, 0.15, p.y) * smoothstep(0.85, -0.05, p.y);
  float haze = snoise(vec3(p * 1.4 + vec2(0.0, t * 2.0), t)) * 0.5 + 0.5;

  vec3 col = vec3(0.022, 0.012, 0.011);
  col = mix(col, uDeep, smoothstep(0.15, 0.95, haze) * 0.6);
  col += uRed * curtain * band * 1.45;
  col += uOrange * pow(curtain, 2.0) * band * 1.25;
  col += vec3(1.0, 0.86, 0.72) * pow(curtain, 5.0) * band * 0.6;

  // the brush stroke catches the light like paint on water
  float ink = tr.z;
  col += uOrange * ink * 0.32 + vec3(1.0) * pow(ink, 3.0) * 0.12;

  float vig = smoothstep(1.3, 0.2, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
  col *= mix(0.5, 1.0, vig);

  float g = hash12(vUv * uRes + fract(uTime * 7.0) * 113.0) - 0.5;
  col += g * 0.065;

  // dissolve: the dark climbs from the bottom with a burning edge
  float n = snoise(vec3(vUv * vec2(uAspect, 1.0) * 3.2, uTime * 0.25)) * 0.5 + 0.5;
  float edge = vUv.y + (n - 0.5) * 0.28;
  float th = uDissolve * 1.4 - 0.2;
  float keep = smoothstep(th - 0.008, th + 0.008, edge);
  float live = step(0.001, uDissolve) * step(uDissolve, 0.999);
  float dEdge = edge - th;
  float rim = (smoothstep(0.035, 0.0, abs(dEdge)) + smoothstep(0.12, 0.0, dEdge) * step(0.0, dEdge) * 0.35) * live;
  col *= keep;
  col += (uOrange * 1.5 + vec3(0.18)) * rim;
  col += g * 0.025 * (1.0 - keep); // a little grain stays in the dark

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export const worldVert = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** Blood-red liquid river, lit by the orb (cursor) and the door. */
export const riverFrag = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uLightInt;
uniform float uDoorGlow;
uniform vec3 uLight;
uniform vec3 uLightColor;
uniform vec3 uDoor;
varying vec3 vWorld;
${snoise}
float height(vec2 p){
  p.y -= uTime * 0.9; // flows toward the viewer
  return snoise(vec3(p.x * 0.3, p.y * 0.15, uTime * 0.07)) * 0.6
       + snoise(vec3(p.x * 1.0, p.y * 0.5, uTime * 0.2)) * 0.22
       + snoise(vec3(p.x * 2.8, p.y * 1.5, uTime * 0.35)) * 0.05;
}
void main(){
  vec2 p = vWorld.xz;
  float e = 0.06;
  float hc = height(p);
  float hx = height(p + vec2(e, 0.0));
  float hz = height(p + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - hc) / e * 0.36, 1.0, -(hz - hc) / e * 0.36));
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 R = reflect(-V, n);
  float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);

  // the liquid itself: deep blood red, thicker where the surface swells
  vec3 deep = vec3(0.055, 0.0, 0.004);
  vec3 blood = vec3(0.32, 0.01, 0.02);
  vec3 col = mix(deep, blood, smoothstep(-0.4, 0.6, hc) * 0.55);

  // orb light: warm specular + red glow soaking into the liquid
  vec3 Lv = uLight - vWorld;
  float dist = length(Lv);
  vec3 L = Lv / dist;
  float atten = 1.0 / (1.0 + dist * dist * 0.018);
  float rl = max(dot(R, L), 0.0);
  float spec = pow(rl, 70.0) * 16.0 + pow(rl, 10.0) * 1.1; // sharp glint + wide sheen
  float diff = max(dot(n, L), 0.0);
  // a pool of light on the surface under the orb
  float pool = exp(-length(vWorld.xz - uLight.xz) * 0.32);
  col += uLightColor * spec * uLightInt * atten;
  col += vec3(1.0, 0.1, 0.07) * (diff * 1.2 + pool * 1.6) * uLightInt * atten;
  col += uLightColor * pool * pool * 0.35 * uLightInt;

  // door: a long pink-white streak down the river
  vec3 D = normalize(uDoor - vWorld);
  float rd = max(dot(R, D), 0.0);
  float doorSpec = pow(rd, 40.0) * 1.4 + pow(rd, 6.0) * 0.3 * exp(-abs(vWorld.x - uDoor.x) * 0.7);
  col += vec3(1.0, 0.72, 0.68) * doorSpec * uDoorGlow * (0.3 + fres);
  col += vec3(0.25, 0.0, 0.02) * fres * 0.4;

  float fog = exp(-length(cameraPosition - vWorld) * 0.028);
  col = mix(vec3(0.012, 0.0, 0.002), col, fog);
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

/** The white door: a rectangle with a soft bloom halo (additive). */
export const doorFrag = /* glsl */ `
uniform float uGlow;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uQuad;
uniform vec2 uHalf;
varying vec2 vUv;
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
void main(){
  vec2 p = (vUv - 0.5) * uQuad;
  float d = sdBox(p, uHalf);
  float core = smoothstep(0.03, -0.03, d);
  float od = max(d, 0.0);
  float halo = exp(-od * 2.4) * 0.6 + exp(-od * 0.55) * 0.28;
  // fade the halo to zero before the quad edge so the plane never shows
  float edge = min(uQuad.x * 0.5 - abs(p.x), uQuad.y * 0.5 - abs(p.y));
  halo *= smoothstep(0.0, min(uQuad.x, uQuad.y) * 0.3, edge);
  float flick = 0.96 + 0.04 * sin(uTime * 2.7) * sin(uTime * 1.3);
  float a = (core * (0.75 + uGlow * 0.25) + halo * uGlow) * flick * uOpacity;
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.94) * a, a);
}
`;

/** Project card: parallelogram skew + Raster Lines effect that clears on hover. */
export const cardVert = /* glsl */ `
uniform float uSkew;
uniform float uHover;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  p.x += p.y * uSkew;
  p.z += sin(uv.x * 3.14159) * uHover * 0.06;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const cardFrag = /* glsl */ `
uniform sampler2D uMap;
uniform float uHover;
uniform float uTime;
uniform float uDim;
uniform float uLines;
uniform float uAspect;
varying vec2 vUv;
float roundBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec4 tex = texture2D(uMap, vUv);
  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  float y = vUv.y * uLines + sin(vUv.x * 5.0 + uTime * 0.5) * 0.3 + lum * 1.1;
  float w = 0.08 + (1.0 - lum) * 0.36;
  float line = smoothstep(w + 0.06, w, abs(fract(y) - 0.5));
  vec3 paper = vec3(0.965, 0.955, 0.94);
  vec3 ink = mix(vec3(0.09, 0.035, 0.03), vec3(0.95, 0.27, 0.08), smoothstep(0.35, 0.9, lum));
  vec3 raster = mix(paper, ink, line);
  vec3 col = mix(raster, tex.rgb, uHover);
  col = mix(col, paper, uDim * 0.75);
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float m = 1.0 - smoothstep(0.0, 0.006, roundBox(p, vec2(uAspect * 0.5, 0.5), 0.03));
  gl_FragColor = vec4(col, m * (1.0 - uDim * 0.5));
}
`;

/** Footer: normal render, turning into ASCII inside a radius around the cursor. */
export const asciiFrag = /* glsl */ `
uniform sampler2D uScene;
uniform sampler2D uGlyphs;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uCell;
uniform float uRadius;
uniform float uGlyphCount;
uniform float uHover;
varying vec2 vUv;
void main(){
  vec2 fragPx = vUv * uRes;
  vec4 base = texture2D(uScene, vUv);
  vec2 cell = floor(fragPx / uCell);
  vec2 cellUv = (cell * uCell + uCell * 0.5) / uRes;
  vec3 s = texture2D(uScene, cellUv).rgb;
  float lum = dot(s, vec3(0.299, 0.587, 0.114));
  float gi = floor(clamp(lum * 1.6, 0.0, 0.999) * uGlyphCount);
  vec2 inCell = fract(fragPx / uCell);
  float glyph = texture2D(uGlyphs, vec2((gi + inCell.x) / uGlyphCount, inCell.y)).r;
  vec3 asciiCol = mix(vec3(0.95, 0.22, 0.07), vec3(1.0, 0.8, 0.62), smoothstep(0.2, 0.7, lum)) * glyph * step(0.015, lum);
  float d = length(fragPx - uMouse);
  float m = smoothstep(uRadius, uRadius * 0.45, d) * uHover;
  gl_FragColor = vec4(mix(base.rgb, asciiCol, m), 1.0);
}
`;

export const quadVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Footer: the scene, turning into Raster Lines inside a soft radius around the cursor. */
export const rasterPostFrag = /* glsl */ `
uniform sampler2D uScene;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uHover;
uniform float uTime;
uniform float uSpacing;
varying vec2 vUv;
void main(){
  vec2 px = vUv * uRes;
  vec4 base = texture2D(uScene, vUv);
  float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
  // lines bend with brightness, like the Raster Lines effect
  float y = px.y / uSpacing + lum * 2.2 + sin(px.x * 0.012 + uTime * 0.8) * 0.25;
  float w = 0.06 + clamp(lum * 1.4, 0.0, 1.0) * 0.38;
  float line = smoothstep(w + 0.08, w, abs(fract(y) - 0.5));
  vec3 ink = mix(vec3(0.95, 0.25, 0.07), vec3(1.0, 0.93, 0.86), smoothstep(0.35, 0.85, lum));
  vec3 raster = mix(vec3(0.03, 0.01, 0.01), ink, line);
  float d = length(px - uMouse);
  float m = smoothstep(uRadius, uRadius * 0.35, d) * uHover;
  gl_FragColor = vec4(mix(base.rgb, raster, m), 1.0);
}
`;
/* The orb: a glowing white sphere that follows the cursor in the dark */
export const orbVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
void main(){
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/** Solid core: hot white centre, faintly cool rim, slow shimmer. */
/**
 * White witch ball: a glass sphere with light trapped inside.
 * Swirling mist in the glass, a bright heart, a glassy rim and one crisp window highlight. No halo.
 */
/**
 * Pure white witch ball: glossy milk-white glass glowing from inside.
 * Almost flat white, with just enough glass cues to read as a sphere:
 * a softer underside, a bright rim, the red river faintly mirrored at the bottom edge,
 * and one crisp window reflection.
 */
export const orbCoreFrag = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec3 vN;
varying vec3 vV;
varying vec3 vPos;
${snoise}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(vV);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.5);

  // milk glass: pure white, a faint pearly drift inside
  vec3 p = normalize(vPos);
  float pearl = snoise(p * 2.0 + vec3(0.0, uTime * 0.1, 0.0)) * 0.5 + 0.5;
  vec3 col = vec3(1.0) * (0.74 + pow(ndv, 2.0) * 0.18 + pearl * 0.05);

  // light from above: the underside is a touch softer
  col *= mix(0.72, 1.0, smoothstep(-0.9, 0.5, n.y));

  // glass rim, with the red river mirrored along the bottom edge
  vec3 rim = mix(vec3(1.0), vec3(1.0, 0.45, 0.42), smoothstep(0.0, -0.8, n.y) * 0.6);
  col += rim * fres * 0.75;

  // one window reflection, upper left: a sharp spark on a soft gloss
  vec3 H = normalize(normalize(vec3(-0.55, 0.65, 0.55)) + v);
  float nh = max(dot(n, H), 0.0);
  col += vec3(1.0) * (pow(nh, 420.0) * 3.0 + pow(nh, 28.0) * 0.22);

  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

/** Halo shell (BackSide + additive): brightest at the core, fading to nothing at its edge. */
export const orbHaloFrag = /* glsl */ `
uniform float uIntensity;
uniform float uPower;
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vV;
void main(){
  float f = abs(dot(normalize(vN), normalize(vV)));
  gl_FragColor = vec4(uColor, pow(f, uPower) * uIntensity);
}
`;