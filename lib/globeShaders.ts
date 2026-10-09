/**
 * Shaders for the testimonials globe.
 * Land is drawn as ASCII: every dot is a glyph, picked by how much light it gets
 * (". : - = + * # % @"), so the globe shades itself like an old terminal render.
 */

/** Glyph ramp, darkest → brightest. The atlas is drawn from this string. */
export const GLYPHS = '.:-=+*#%@';

export const dotVert = /* glsl */ `
attribute float aRand;
uniform float uSize;
uniform float uReveal;     // radians from home that are revealed (0 → π)
uniform float uSweep;      // 1 while the reveal is running (glowing front)
uniform vec3 uHome;        // unit vector, globe space
uniform vec3 uFocus;       // unit vector of the country being talked about
uniform float uFocusAmt;
uniform float uTime;
varying float vAlpha;
varying float vGlyph;
varying float vHot;

void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * position);
  vec3 toCam = normalize(cameraPosition - wp.xyz);
  float facing = dot(n, toCam);              // 1 centre, 0 edge, < 0 far side
  float front = smoothstep(-0.05, 0.3, facing);

  float ang = acos(clamp(dot(position, uHome), -1.0, 1.0));
  float shown = smoothstep(uReveal, uReveal - 0.2, ang);

  // light from the upper left → glyph density
  vec3 L = normalize(vec3(-0.55, 0.55, 0.65));
  float lit = clamp(dot(n, L) * 0.8 + 0.3, 0.0, 1.0);
  float flicker = 0.06 * sin(uTime * 2.0 + aRand * 40.0);
  vGlyph = front * clamp(lit + flicker, 0.0, 1.0);

  float fa = acos(clamp(dot(position, uFocus), -1.0, 1.0));
  float focus = uFocusAmt * smoothstep(0.2, 0.02, fa);
  float sweep = uSweep * smoothstep(0.16, 0.0, abs(ang - uReveal + 0.08));
  vHot = clamp(focus + sweep, 0.0, 1.0);
  vGlyph = max(vGlyph, vHot * 0.95);

  vAlpha = shown * mix(0.1, 0.95, front);
  gl_PointSize = uSize * mix(0.6, 1.0, front) * mix(0.75, 1.0, max(facing, 0.0)) * (1.0 + vHot * 0.25);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const dotFrag = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uGlyphs;
uniform float uAscii;
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vAlpha;
varying float vGlyph;
varying float vHot;

void main(){
  vec2 pc = gl_PointCoord;
  float a;
  if (uAscii > 0.5) {
    float gi = floor(clamp(vGlyph, 0.0, 0.999) * uGlyphs);
    a = texture2D(uAtlas, vec2((gi + pc.x) / uGlyphs, 1.0 - pc.y)).r;
  } else {
    a = smoothstep(0.5, 0.3, length(pc - 0.5));
  }
  if (a * vAlpha < 0.01) discard;
  gl_FragColor = vec4(mix(uColor, uAccent, vHot), a * vAlpha);
}
`;

/** Faint body + rim, so the globe reads as a sphere even where there is ocean. */
export const shellVert = /* glsl */ `
varying float vFacing;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vFacing = dot(n, normalize(cameraPosition - wp.xyz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
export const shellFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFacing;
void main(){
  float rim = pow(1.0 - clamp(vFacing, 0.0, 1.0), 4.0);
  float a = (0.02 + rim * 0.22) * uOpacity;
  gl_FragColor = vec4(uColor, a);
}
`;

/** Arcs from home: drawn in by uDraw, with a light running along each one. */
export const arcVert = /* glsl */ `
attribute float aOrder;
varying float vU;
varying float vOrder;
void main(){
  vU = uv.x;
  vOrder = aOrder;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const arcFrag = /* glsl */ `
uniform float uDraw;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uHot;
varying float vU;
varying float vOrder;
void main(){
  float k = clamp((uDraw - vOrder * 0.6) / 0.4, 0.0, 1.0);
  if (vU > k) discard;
  float run = fract(uTime * 0.22 + vOrder * 3.7);
  float band = exp(-pow((vU - run) / 0.035, 2.0));
  float tip = smoothstep(k - 0.05, k, vU) * step(k, 0.999);
  vec3 col = mix(uColor, uHot, clamp(band + tip, 0.0, 1.0));
  gl_FragColor = vec4(col, 0.55 + band * 0.45);
}
`;

/** Country markers: a dot and a ping ring, instanced. uMode 0 = dot, 1 = ring. */
export const markerVert = /* glsl */ `
attribute float aOrder;
attribute float aHome;
uniform float uShow;
uniform float uTime;
uniform float uMode;
varying float vAlpha;
varying float vHome;
void main(){
  float k = clamp((uShow - aOrder * 0.7) / 0.3, 0.0, 1.0);
  float pop = k + sin(k * 3.14159) * 0.35;
  float ph = fract(uTime * 0.45 + aOrder * 5.3);
  float s = uMode < 0.5 ? pop * (1.0 + aHome * 0.5) : pop * (0.4 + ph * 1.6) * (1.0 + aHome * 0.6);
  vAlpha = uMode < 0.5 ? step(0.001, k) : (1.0 - ph) * step(0.001, k);
  vHome = aHome;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position * s, 1.0);
}
`;
export const markerFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uHomeColor;
varying float vAlpha;
varying float vHome;
void main(){
  gl_FragColor = vec4(mix(uColor, uHomeColor, vHome), vAlpha);
}
`;
