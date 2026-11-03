const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const cv = $('canvas');

// Two artworks: landscape for wide screens, portrait for phones.
// `man` is the figure's box in image pixels (x0, y0, x1, y1, top-down): the glow belongs to the drape only.
const ART = {
  wide: { src: cv.dataset.wide, man: [228, 92, 482, 472] },   // asset URLs come from Liquid
  tall: { src: cv.dataset.tall, man: [48, 186, 398, 738] },
};

// Everything the shader reads. GSAP tweens these; the ticker draws them.
const S = { glow: 0, pour: 0, x: -1e4, y: -1e4 };

const FRAG = `
precision highp float;
uniform sampler2D T;
uniform vec4 R;          // artwork rect in canvas px (x, y-from-bottom, w, h)
uniform vec4 MAN;        // figure box in uv (u0, v0, u1, v1), excluded from the glow
uniform vec2 M;          // pointer
uniform float glow, rad, pour, t;

const vec3 BG = vec3(242., 240., 239.) / 255.;          // brand Off-white
const vec3 PAPER = vec3(253., 252., 248.) / 255.;       // the artwork's own paper white

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 f = gl_FragCoord.xy;
  vec2 uv = (f - R.xy) / R.zw;
  vec3 c = texture2D(T, clamp(uv, 0., 1.)).rgb * (BG / PAPER);   // re-tone paper to brand Off-white

  // Gold: light catching the drape under the pointer, following its folds. Never the wall, sky or the man.
  float man = step(MAN.x, uv.x) * step(uv.x, MAN.z) * step(MAN.y, uv.y) * step(uv.y, MAN.w);
  float lum = dot(c, vec3(.299, .587, .114));
  float fabric = smoothstep(.35, .7, (c.r - max(c.g, c.b)) / (c.r + .02)) * smoothstep(.24, .16, lum) * (1. - man);
  float fold = smoothstep(0., .14, lum);
  vec2 d = f - M;
  float spot = exp(-dot(d, d) / (rad * rad));
  // The stream: from the touch, gold runs down the cloth and widens as it goes, pulsing downward.
  float below = max(-d.y, 0.);
  float reach = max(M.y - R.y, 1.) * pour;
  float w = rad * (.26 + below / (R.w * .8));
  float stream = exp(-d.x * d.x / (w * w)) * step(d.y, 0.) * smoothstep(reach, reach * .65, below)
               * exp(-below / (R.w * .7)) * (.55 + .45 * sin(below / (rad * .55) - t * 3.2));
  float light = max(spot, stream * .9) * glow;
  vec3 gold = mix(vec3(.40, .25, .06), vec3(.98, .80, .44), fold) + pow(fold, 3.) * vec3(.45, .38, .22);
  c = mix(c, gold, light * fabric * pow(fold, mix(.6, 1.1, step(spot, stream))));

  c += (hash(f) - .5) * .018;   // fine grain, keeps gradients from banding
  gl_FragColor = vec4(c, 1.);
}`;

const gl = cv.getContext('webgl', { antialias: false });
const U = {};
const tex = {};
let dpr = 1, rect = [0, 0, 1, 1], art = null, portrait = false;

function initGL(images) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  for (const k in images) {
    tex[k] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex[k]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[k]);
    for (const w of ['S', 'T']) gl.texParameteri(gl.TEXTURE_2D, gl['TEXTURE_WRAP_' + w], gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  for (const k of ['R', 'MAN', 'M', 'glow', 'rad', 'pour', 't']) U[k] = gl.getUniformLocation(p, k);
  return true;
}

function layout() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  portrait = innerWidth / innerHeight < .8;
  art = portrait ? ART.tall : ART.wide;
  const im = art.img;
  // The painting covers the whole screen, centred.
  const s = Math.max(innerWidth / im.width, innerHeight / im.height);
  const w = im.width * s, h = im.height * s, x = (innerWidth - w) / 2, y = (innerHeight - h) / 2;
  rect = [x * dpr, (innerHeight - y - h) * dpr, w * dpr, h * dpr];
  const root = document.documentElement.style;                     // the artwork's box, for anchoring the copy
  root.setProperty('--ax', `${x}px`);
  root.setProperty('--ay', `${y}px`);
  root.setProperty('--aw', `${w}px`);
  root.setProperty('--ah', `${h}px`);
  const mk = $('.mark').getBoundingClientRect();                   // after --ax/--aw: the logo depends on them
  root.setProperty('--mb', `${mk.bottom}px`);
  root.setProperty('--mh', `${mk.height}px`);
  root.setProperty('--mr', `${innerWidth - mk.right}px`);         // Coming soon ends where the logo ends
  if (U.R) {
    gl.viewport(0, 0, cv.width, cv.height);
    gl.bindTexture(gl.TEXTURE_2D, tex[portrait ? 'tall' : 'wide']);
    const [x0, y0, x1, y1] = art.man;
    gl.uniform4f(U.MAN, x0 / im.width, 1 - y1 / im.height, x1 / im.width, 1 - y0 / im.height);
  }
  const hint = $('.hint'), hb = hint.getBoundingClientRect();     // no room beside the drape (narrow windows): drop the hint
  let hit = false;
  for (let x = hb.left; x < hb.right && !hit; x += 6) for (let y = hb.top; y < hb.bottom && !hit; y += 6) hit = overCloth(x, y);
  hint.style.visibility = hit ? 'hidden' : '';
  draw();
}

function draw() {
  if (!U.R) return;
  gl.uniform4fv(U.R, rect);
  gl.uniform2f(U.M, S.x, S.y);
  gl.uniform1f(U.glow, S.glow);
  gl.uniform1f(U.rad, (portrait ? 70 : 110) * dpr);
  gl.uniform1f(U.pour, S.pour);
  gl.uniform1f(U.t, reduce ? 0 : performance.now() / 1000);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Draw only while something is moving; a still page costs nothing.
let busy = 0;
const hold = () => { if (busy++ === 0) gsap.ticker.add(draw); };
const release = () => { if (--busy === 0) { gsap.ticker.remove(draw); draw(); } };

/* ---------- Pointer: gold glides after the cursor and pours down the cloth ---------- */
const toX = gsap.quickTo(S, 'x', { duration: .45, ease: 'power3.out' });
const toY = gsap.quickTo(S, 'y', { duration: .45, ease: 'power3.out' });
let idle, lit = false;

function onPointer(e) {
  const x = e.clientX * dpr, y = cv.height - e.clientY * dpr;
  if (S.glow < .02) gsap.set(S, { x, y });        // appear where the cursor is, don't slide in
  toX(x); toY(y);
  if (!lit) {
    lit = true; hold();
    gsap.to(S, { glow: 1, duration: .6, ease: 'power2.out', overwrite: 'auto' });
    gsap.fromTo(S, { pour: 0 }, { pour: 1, duration: 1.8, ease: 'power2.out' });   // light runs down the cloth
  }
  clearTimeout(idle);
  idle = setTimeout(fade, e.pointerType === 'mouse' ? 1600 : 900);
}
function fade() {
  if (!lit) return;
  lit = false;
  gsap.to(S, { glow: 0, duration: 1.4, ease: 'power2.inOut', overwrite: 'auto', onComplete: release });
}

/* ---------- Cursor: small circle that becomes gold ripples over the drape ---------- */
const cur = $('.cursor');
let hintDone = false;
const curX = gsap.quickTo(cur, 'x', { duration: .16, ease: 'power3.out' });
const curY = gsap.quickTo(cur, 'y', { duration: .16, ease: 'power3.out' });

function pixels(a) {                                 // artwork pixels, for "is the pointer on the drape?"
  if (a.px) return a.px;
  const t = document.createElement('canvas');
  t.width = a.img.width; t.height = a.img.height;
  const c = t.getContext('2d', { willReadFrequently: true });
  c.drawImage(a.img, 0, 0);
  return (a.px = c.getImageData(0, 0, t.width, t.height).data);
}
function overCloth(x, y) {
  const im = art.img;
  const u = (x * dpr - rect[0]) / rect[2], v = 1 - (cv.height - y * dpr - rect[1]) / rect[3];
  if (u < 0 || u > 1 || v < 0 || v > 1) return false;
  const px = Math.floor(u * (im.width - 1)), py = Math.floor(v * (im.height - 1));
  const [x0, y0, x1, y1] = art.man;
  if (px >= x0 && px <= x1 && py >= y0 && py <= y1) return false;
  const d = pixels(art), i = (py * im.width + px) * 4, r = d[i];
  const lum = (.299 * r + .587 * d[i + 1] + .114 * d[i + 2]) / 255;
  return (r - Math.max(d[i + 1], d[i + 2])) / (r + 5) > .5 && lum < .2;   // same test as the shader
}
function moveCursor(e) {
  const touch = e.pointerType !== 'mouse';
  if (touch || gsap.getProperty(cur, 'opacity') < .05) gsap.set(cur, { x: e.clientX, y: e.clientY });
  curX(e.clientX); curY(e.clientY);
  const onCloth = overCloth(e.clientX, e.clientY);
  cur.classList.toggle('on-cloth', onCloth);
  if (onCloth && !hintDone) {                       // they've found it: let the hint go after a moment
    hintDone = true;
    gsap.to('.hint', { opacity: 0, duration: 1.4, delay: 2.5, ease: 'power2.inOut' });
  }
  const hide = !touch && e.target.closest?.('form');                    // native cursor over the signup
  gsap.to(cur, { opacity: hide ? 0 : 1, duration: .25, overwrite: 'auto' });
}
function initCursor() {
  if (matchMedia('(pointer: fine)').matches) document.documentElement.classList.add('own-cursor');
  addEventListener('pointermove', moveCursor, { passive: true });
  addEventListener('pointerdown', moveCursor, { passive: true });
  addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && gsap.to(cur, { opacity: 0, duration: .6, delay: 1.2, overwrite: 'auto' }));
  document.documentElement.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: .25, overwrite: 'auto' }));
}

/* ---------- Boot ---------- */
const load = (src) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
const first = innerWidth / innerHeight < .8 ? 'tall' : 'wide';
load(ART[first].src).then(async (im) => {
  ART[first].img = im;
  const other = first === 'tall' ? 'wide' : 'tall';
  ART[other].img = await load(ART[other].src).catch(() => im);       // the second one is only for rotating/resizing

  if (!(gl && initGL({ wide: ART.wide.img, tall: ART.tall.img }))) {
    const ctx = cv.getContext('2d');                                   // no WebGL: plain artwork, no glow
    window.draw = draw = () => ctx.drawImage(art.img, rect[0], cv.height - rect[1] - rect[3], rect[2], rect[3]);
  }
  addEventListener('resize', layout);
  layout();
  initCursor();

  if (reduce) {
    // Still artwork with one restrained, pre-set glint on the drape; copy shown as is.
    Object.assign(S, { glow: .55, pour: 1, x: rect[0] + rect[2] * .6, y: rect[1] + rect[3] * .3 });
    draw();
    gsap.set('main > *, .soon > *', { opacity: 1 });
    return;
  }
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', onPointer, { passive: true });
  addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && fade());
  intro();
});

function intro() {
  gsap.fromTo(cv, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power2.out' });
  gsap.timeline({ defaults: { ease: 'expo.out' }, delay: .4 })
    .to('.top', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
    .set('.masthead', { opacity: 1 }, .2)
    // wordmark is drawn on left to right, like a line being written
    .fromTo('.mark', { clipPath: 'inset(0 100% 0 0)', opacity: .2 }, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 1.8, ease: 'power3.inOut' }, .2)
    .set('.soon', { opacity: 1 }, .9)
    .to('.soon > :not(h1)', { opacity: 1, duration: 1, stagger: .1 }, 1.3)
    // Headline rises into place through a reveal that leaves room under the line, so the g's descender
    // travels with the word instead of being clipped and popping in at the end.
    .fromTo('.soon h1', { opacity: 1, yPercent: 60, clipPath: 'inset(-10% -5% 100% -5%)' },
      { yPercent: 0, clipPath: 'inset(-10% -5% -35% -5%)', duration: 1.3, clearProps: 'clipPath' }, 1)
    .fromTo('.hint', { opacity: 0, y: 8 }, { opacity: () => (hintDone ? 0 : 1), y: 0, duration: 1.4, ease: 'power2.out' }, 2.2);
}

/* ---------- Signup: Motion for hover / press feedback ---------- */
const { animate, hover, press } = Motion;
// The form posts to Shopify natively: emails become customers tagged "coming-soon" with marketing consent.
const form = $('#signup'), input = $('#email');
if (input) {
  const btn = form.querySelector('button'), arrow = btn.querySelector('svg');
  if (!reduce) {
    hover(btn, () => { animate(arrow, { x: 4 }, { type: 'spring', stiffness: 300, damping: 18 });
      return () => animate(arrow, { x: 0 }, { type: 'spring', stiffness: 300, damping: 22 }); });
    press(btn, () => { animate(btn, { scale: .94 }, { duration: .12 });
      return () => animate(btn, { scale: 1 }, { type: 'spring', stiffness: 400, damping: 20 }); });
  }
  form.addEventListener('submit', (e) => {
    if (input.checkValidity()) return;
    e.preventDefault();
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    if (!reduce) animate(form, { x: [0, -6, 6, -4, 4, 0] }, { duration: .4 });
  });
  input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
}
