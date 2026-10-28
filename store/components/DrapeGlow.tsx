'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// The coming-soon drape, framed on the homepage: gold light catches the red cloth under the pointer and pours
// down its folds. Same shader as the coming-soon page, sized to a panel instead of the screen.
const W = 1672, H = 941;
const MAN = [228, 92, 482, 472];   // the figure's box in image pixels: the glow belongs to the cloth only

const FRAG = `
precision highp float;
uniform sampler2D T;
uniform vec2 R;          // canvas size in px
uniform vec4 MAN;        // figure box in uv (u0, v0, u1, v1), excluded from the glow
uniform vec2 M;          // pointer
uniform float glow, rad, pour, t;

const vec3 BG = vec3(242., 240., 239.) / 255.;          // brand Off-white
const vec3 PAPER = vec3(253., 252., 248.) / 255.;       // the artwork's own paper white

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 f = gl_FragCoord.xy;
  vec2 uv = f / R;
  vec3 c = texture2D(T, uv).rgb * (BG / PAPER);   // re-tone paper to brand Off-white

  // Gold: light catching the drape under the pointer, following its folds. Never the wall, sky or the man.
  float man = step(MAN.x, uv.x) * step(uv.x, MAN.z) * step(MAN.y, uv.y) * step(uv.y, MAN.w);
  float lum = dot(c, vec3(.299, .587, .114));
  float fabric = smoothstep(.35, .7, (c.r - max(c.g, c.b)) / (c.r + .02)) * smoothstep(.24, .16, lum) * (1. - man);
  float fold = smoothstep(0., .14, lum);
  vec2 d = f - M;
  float spot = exp(-dot(d, d) / (rad * rad));
  // The stream: from the touch, gold runs down the cloth and widens as it goes, pulsing downward.
  float below = max(-d.y, 0.);
  float reach = max(M.y, 1.) * pour;
  float w = rad * (.26 + below / (R.y * .8));
  float stream = exp(-d.x * d.x / (w * w)) * step(d.y, 0.) * smoothstep(reach, reach * .65, below)
               * exp(-below / (R.y * .7)) * (.55 + .45 * sin(below / (rad * .55) - t * 3.2));
  float light = max(spot, stream * .9) * glow;
  vec3 gold = mix(vec3(.40, .25, .06), vec3(.98, .80, .44), fold) + pow(fold, 3.) * vec3(.45, .38, .22);
  c = mix(c, gold, light * fabric * pow(fold, mix(.6, 1.1, step(spot, stream))));

  c += (hash(f) - .5) * .018;   // fine grain, keeps gradients from banding
  gl_FragColor = vec4(c, 1.);
}`;

export default function DrapeGlow() {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current!;
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return;                                   // no WebGL: the plain <img> underneath stays
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const S = { glow: 0, pour: 0, x: -1e4, y: -1e4 };
    const U: Record<string, WebGLUniformLocation | null> = {};
    let dpr = 1, ready = false;

    const draw = () => {
      if (!ready) return;
      gl.uniform2f(U.M, S.x, S.y);
      gl.uniform1f(U.glow, S.glow);
      gl.uniform1f(U.pour, S.pour);
      gl.uniform1f(U.rad, canvas.width * 0.065);
      gl.uniform1f(U.t, reduce ? 0 : performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      if (!ready) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.R, canvas.width, canvas.height);
      draw();
    };

    const img = new Image();
    img.onload = () => {
      const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const p = gl.createProgram()!;
      gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return;
      gl.useProgram(p);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      for (const w of ['S', 'T'] as const) gl.texParameteri(gl.TEXTURE_2D, gl[`TEXTURE_WRAP_${w}`], gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      for (const k of ['T', 'R', 'MAN', 'M', 'glow', 'rad', 'pour', 't']) U[k] = gl.getUniformLocation(p, k);
      const [x0, y0, x1, y1] = MAN;
      gl.uniform4f(U.MAN, x0 / W, 1 - y1 / H, x1 / W, 1 - y0 / H);
      ready = true;
      size();
      canvas.style.opacity = '1';
    };
    img.src = '/img/drape.jpg';
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    // Draw only while something is moving; a still panel costs nothing.
    let busy = 0;
    const hold = () => { if (busy++ === 0) gsap.ticker.add(draw); };
    const release = () => { if (--busy === 0) { gsap.ticker.remove(draw); draw(); } };
    const toX = gsap.quickTo(S, 'x', { duration: 0.45, ease: 'power3.out' });
    const toY = gsap.quickTo(S, 'y', { duration: 0.45, ease: 'power3.out' });
    let lit = false, idle: ReturnType<typeof setTimeout>;

    const fade = () => {
      if (!lit) return;
      lit = false;
      gsap.to(S, { glow: 0, duration: 1.4, ease: 'power2.inOut', overwrite: 'auto', onComplete: release });
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr, y = (r.bottom - e.clientY) * dpr;
      if (S.glow < 0.02) gsap.set(S, { x, y });        // appear where the pointer is, don't slide in
      toX(x); toY(y);
      if (!lit) {
        lit = true; hold();
        gsap.to(S, { glow: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        gsap.fromTo(S, { pour: 0 }, { pour: 1, duration: 1.8, ease: 'power2.out' });   // light runs down the cloth
      }
      clearTimeout(idle);
      idle = setTimeout(fade, e.pointerType === 'mouse' ? 1600 : 900);
    };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', move);
    canvas.addEventListener('pointerleave', fade);
    return () => {
      ro.disconnect();
      clearTimeout(idle);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', move);
      canvas.removeEventListener('pointerleave', fade);
      gsap.killTweensOf(S);
      gsap.ticker.remove(draw);
    };
  }, []);

  return (
    <div className="drape-art">
      <img src="/img/drape.jpg" alt="A man in a red turban walks a wall, pulling a long red drape behind him" />
      <canvas ref={cv} aria-hidden="true" />
    </div>
  );
}
