// The ambient shader field behind everything: domain-warped fbm noise whose
// palette drifts with the section in view and blooms while the app assembles.
import { RM } from './motion';

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `precision highp float;
uniform vec2 u_res; uniform float u_t; uniform vec2 u_m; uniform float u_boost;
uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453123);}
float nz(vec2 p){const float K1=.366025404,K2=.211324865;
 vec2 i=floor(p+(p.x+p.y)*K1); vec2 a=p-i+(i.x+i.y)*K2;
 float m=step(a.y,a.x); vec2 o=vec2(m,1.-m); vec2 b=a-o+K2; vec2 c=a-1.+2.*K2;
 vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);
 vec3 n=h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.)));
 return dot(n,vec3(70.));}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nz(p);p*=2.03;a*=.5;}return v;}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;
 float t=u_t*.05;
 vec2 md=uv-u_m; float mi=exp(-dot(md,md)*3.2);
 uv+=md*mi*.13;
 vec2 q=vec2(fbm(uv*1.45+vec2(0.,t)),fbm(uv*1.45+vec2(5.2,1.3-t)));
 vec2 r=vec2(fbm(uv*1.45+4.*q+vec2(1.7,9.2)+t*.7),fbm(uv*1.45+4.*q+vec2(8.3,2.8)-t*.5));
 float f=fbm(uv*1.45+4.*r);
 float g=clamp((f+.6)*.9,0.,1.);
 vec3 col=mix(c1,c2,smoothstep(.15,.72,g));
 col=mix(col,c3,smoothstep(.55,1.,length(r)*.85));
 col*=(.26+.5*g)*(1.+u_boost*.85);
 col+=mi*.045;
 col=mix(vec3(.023,.026,.038),col,.85);
 gl_FragColor=vec4(col,1.);
}`;

type Rgb = [number, number, number];
const PALETTES: Rgb[][] = [
  [[.055, .40, .30], [.09, .12, .33], [.40, .30, .60]],
  [[.05, .34, .42], [.13, .11, .36], [.30, .40, .68]],
  [[.09, .11, .40], [.34, .14, .36], [.62, .30, .52]],
  [[.06, .33, .28], [.10, .12, .29], [.34, .26, .54]],
];

let boost = 0;
let boostT = 0;
let hueTarget = 0;
const mouse = { x: 0, y: 0 };
const mouseT = { x: 0, y: 0 };
const cur: Rgb[] = PALETTES[0].map((c) => [...c] as Rgb);

export function setBoost(v: number): void { boostT = v; }
export function setPalette(i: number): void { hueTarget = Math.max(0, Math.min(PALETTES.length - 1, i)); }

export function initField(): boolean {
  const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
  const halo = document.getElementById('halo');
  if (!canvas) return false;

  const gl = RM ? null : compile(canvas);
  if (!gl) {
    document.documentElement.classList.add('no-gl');
    canvas.style.display = 'none';
    return false;
  }
  const { ctx, uni, start } = gl;

  const size = (): void => {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(innerWidth * d);
    canvas.height = Math.floor(innerHeight * d);
    ctx.viewport(0, 0, canvas.width, canvas.height);
  };
  const draw = (now: number): void => {
    requestAnimationFrame(draw);
    const tp = PALETTES[hueTarget];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (tp[i][j] - cur[i][j]) * .03;
    mouse.x += (mouseT.x - mouse.x) * .06;
    mouse.y += (mouseT.y - mouse.y) * .06;
    boost += (boostT - boost) * .07;
    ctx.uniform2f(uni.u_res, canvas.width, canvas.height);
    ctx.uniform1f(uni.u_t, (now - start) / 1000);
    ctx.uniform2f(uni.u_m, mouse.x, mouse.y);
    ctx.uniform1f(uni.u_boost, boost);
    ctx.uniform3fv(uni.c1, cur[0]);
    ctx.uniform3fv(uni.c2, cur[1]);
    ctx.uniform3fv(uni.c3, cur[2]);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
  };
  size();
  addEventListener('resize', size);
  requestAnimationFrame(draw);

  addEventListener('pointermove', (e) => {
    mouseT.x = (e.clientX - innerWidth / 2) / innerHeight;
    mouseT.y = -(e.clientY - innerHeight / 2) / innerHeight;
    if (halo) {
      halo.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      halo.style.opacity = '1';
    }
  }, { passive: true });
  return true;
}

interface Compiled {
  ctx: WebGLRenderingContext;
  uni: Record<string, WebGLUniformLocation | null>;
  start: number;
}

function compile(canvas: HTMLCanvasElement): Compiled | null {
  const ctx = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!ctx) return null;
  const sh = (type: number, src: string): WebGLShader | null => {
    const s = ctx.createShader(type);
    if (!s) return null;
    ctx.shaderSource(s, src);
    ctx.compileShader(s);
    if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
      console.warn(ctx.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = sh(ctx.VERTEX_SHADER, VERT);
  const f = sh(ctx.FRAGMENT_SHADER, FRAG);
  if (!v || !f) return null;
  const prog = ctx.createProgram();
  if (!prog) return null;
  ctx.attachShader(prog, v);
  ctx.attachShader(prog, f);
  ctx.linkProgram(prog);
  if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return null;
  ctx.useProgram(prog);
  const buf = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
  const loc = ctx.getAttribLocation(prog, 'p');
  ctx.enableVertexAttribArray(loc);
  ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
  const uni: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['u_res', 'u_t', 'u_m', 'u_boost', 'c1', 'c2', 'c3']) uni[n] = ctx.getUniformLocation(prog, n);
  return { ctx, uni, start: performance.now() };
}
