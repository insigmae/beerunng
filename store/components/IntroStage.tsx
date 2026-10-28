'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { carve, rasterize } from '@/lib/hull';

/* A room corner: back wall, side wall, floor. The lamp throws the sculpture's shadow onto the back wall (B),
   your light onto the side wall (R). Lift both lights until they meet overhead: one light, one shadow, the ३.
   Everything here is a pure function of the scroll-driven state `s`, so scrolling back plays it backwards. */
export type IntroState = {
  lamp: number;   // the lamp's light, 0..1
  mine: number;   // your light, 0..1
  lift: number;   // both lights rising to overhead, 0..1
  cam: number;    // position along the camera path, 0..5 (see KEYS)
  dark: number;   // lights out at the end, 0..1
};

const X = 72, Y = 96, Z = 96, CELL = 1.6 / Y;
const D = 1.45;                                     // walls and floor sit this far from the centre
const PINE = new THREE.Color('#223631'), OFF = new THREE.Color('#F2F0EF');
// Each shadow multiplies its surface by SHADE, so two shadows overlapping on Off-white make exactly Pine Grove.
const SHADE = [34 / 242, 54 / 240, 49 / 239].map(Math.sqrt);

const DOWN = new THREE.Vector3(0, -1, 0);
const LIGHTS = [
  { home: new THREE.Vector3(0, 0, -1), color: '#F5DDBF', bit: 1 },   // the lamp: inherited
  { home: new THREE.Vector3(-1, 0, 0), color: '#E4EEF5', bit: 2 },   // your light: today
];
const PLANES = [
  { n: new THREE.Vector3(0, 0, 1), pos: [0, 0.4, -D], rot: [0, 0, 0], keep: [[0, 1, 0], [1, 0, 0]] },              // back wall
  { n: new THREE.Vector3(1, 0, 0), pos: [-D, 0.4, 0], rot: [0, Math.PI / 2, 0], keep: [[0, 1, 0], [0, 0, 1]] },     // side wall
  { n: new THREE.Vector3(0, 1, 0), pos: [0, -D, 0], rot: [-Math.PI / 2, 0, 0], keep: [[1, 0, 0], [0, 0, 1]] },     // floor
] as const;

/** Flatten geometry onto the plane n·x + D = 0 along the light direction L (planar shadow). */
function project(n: THREE.Vector3, L: THREE.Vector3, out: THREE.Matrix4) {
  const s = n.dot(L), e = 0.003;
  return out.set(
    1 - (L.x * n.x) / s, -(L.x * n.y) / s, -(L.x * n.z) / s, -(L.x * D) / s + n.x * e,
    -(L.y * n.x) / s, 1 - (L.y * n.y) / s, -(L.y * n.z) / s, -(L.y * D) / s + n.y * e,
    -(L.z * n.x) / s, -(L.z * n.y) / s, 1 - (L.z * n.z) / s, -(L.z * D) / s + n.z * e,
    0, 0, 0, 1,
  );
}

function shadowMaterial(bit: number, keep: readonly (readonly number[])[]) {
  return new THREE.MeshBasicMaterial({
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.SrcColorFactor,       // multiply the surface underneath
    depthTest: false,
    depthWrite: false,
    // each light darkens a pixel once, however many threads overlap there
    stencilWrite: true,
    stencilRef: bit,
    stencilFuncMask: bit,
    stencilWriteMask: bit,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp,
    // stay on this surface: stop at the corner lines
    clippingPlanes: keep.map(([a, b, c]) => new THREE.Plane(new THREE.Vector3(a, b, c), D)),
  });
}

const surface = () =>
  new THREE.ShaderMaterial({
    uniforms: { uPine: { value: PINE }, uOff: { value: OFF }, uLit: { value: 0 }, uFlat: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 uPine, uOff; uniform float uLit, uFlat; varying vec2 vP;
      void main(){
        float pool = mix(smoothstep(4.2, 1.3, length(vP)), 1., uFlat);   // overhead, the whole frame is lit
        gl_FragColor = vec4(mix(uPine, uOff, uLit * pool), 1.);
        #include <colorspace_fragment>
      }`,
  });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Rig({ runs, s }: { runs: Float32Array; s: IntroState }) {
  const n = runs.length / 4;
  const threads = useRef<THREE.InstancedMesh>(null!);
  const shadows = useRef<THREE.InstancedMesh[]>([]);
  const lights = useRef<THREE.PointLight[]>([]);

  const geo = useMemo(() => new THREE.CylinderGeometry(CELL * 0.42, CELL * 0.42, 1, 5).rotateZ(Math.PI / 2), []);
  // Shadows use fuller threads so the letters read as solid shapes, not stripes.
  const fat = useMemo(() => new THREE.BoxGeometry(1, CELL * 1.15, CELL * 1.15), []);
  const surfaces = useMemo(() => PLANES.map(surface), []);
  const mats = useMemo(() => LIGHTS.map((l) => PLANES.map((p) => shadowMaterial(l.bit, p.keep))), []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    let shown = 0;
    for (let i = 0; i < n; i++) {
      const [x, y, z, len] = runs.subarray(i * 4, i * 4 + 4);
      m.compose(p.set(x, y, z), q, sc.set(len, 1, 1));
      for (const mesh of shadows.current) mesh.setMatrixAt(i, m);
      // Only every second row and third layer is drawn as thread, so you see through it like strung warp.
      // The shadows still come from the full sculpture.
      if (Math.round(Y / 2 - 0.5 - y / CELL) % 2 === 0 && Math.round(z / CELL + Z / 2 - 0.5) % 3 === 0) threads.current.setMatrixAt(shown++, m);
    }
    threads.current.count = shown;
    for (const mesh of [threads.current, ...shadows.current]) mesh.instanceMatrix.needsUpdate = true;
  }, [runs, n]);

  const L = useMemo(() => LIGHTS.map(() => new THREE.Vector3()), []);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock, scene }) => {
    const t = clock.elapsedTime;
    const a = s.lift * Math.PI / 2;
    const over = clamp01(s.cam - 3);              // how far the camera has risen overhead
    const on = 1 - s.dark;
    const power = [s.lamp * (1 + 0.05 * Math.sin(t * 11.3) * Math.sin(t * 4.7)), s.mine];   // the lamp flickers
    LIGHTS.forEach((l, i) => {
      L[i].copy(l.home).multiplyScalar(Math.cos(a)).addScaledVector(DOWN, Math.sin(a)).normalize();
      lights.current[i].position.copy(L[i]).multiplyScalar(-2.6);
      lights.current[i].intensity = 2.6 * power[i] * (1 - 0.6 * s.dark);
    });
    PLANES.forEach((pl, j) => {
      let lit = 0;
      LIGHTS.forEach((_, i) => {
        const amt = power[i] * Math.max(0, -pl.n.dot(L[i])) * on;
        lit += amt;
        const mesh = shadows.current[i * PLANES.length + j];
        mesh.visible = amt > 0.01;
        if (!mesh.visible) return;
        project(pl.n, L[i], mesh.matrix);
        mesh.matrixWorldNeedsUpdate = true;
        mats[i][j].color.copy(c.setRGB(1 - amt * (1 - SHADE[0]), 1 - amt * (1 - SHADE[1]), 1 - amt * (1 - SHADE[2]), THREE.SRGBColorSpace));
      });
      // Any light on fills the room softly (a gallery, not a stage); direct light adds the last brightness.
      const glow = 0.8 * Math.max(power[0], power[1]) * on + 0.2 * Math.min(1, lit);
      surfaces[j].uniforms.uLit.value = Math.min(1, Math.max(glow, over * on));
      surfaces[j].uniforms.uFlat.value = over;
    });
    (scene.background as THREE.Color).lerpColors(PINE, OFF, over * on);
  });

  return (
    <>
      {PLANES.map((pl, j) => (
        <mesh key={j} position={pl.pos as unknown as THREE.Vector3Tuple} rotation={pl.rot as unknown as THREE.Vector3Tuple} renderOrder={0} material={surfaces[j]}>
          <planeGeometry args={[9, 9]} />
        </mesh>
      ))}
      {LIGHTS.map((l, i) =>
        PLANES.map((_, j) => (
          <instancedMesh key={`${i}${j}`} ref={(m) => { if (m) shadows.current[i * PLANES.length + j] = m; }}
            args={[fat, mats[i][j], n]} renderOrder={1 + i} matrixAutoUpdate={false} frustumCulled={false} />
        )),
      )}
      <instancedMesh ref={threads} args={[geo, undefined, n]} renderOrder={3} frustumCulled={false}>
        <meshStandardMaterial color="#E1CFB9" roughness={0.7} />
      </instancedMesh>
      {LIGHTS.map((l, i) => (
        <pointLight key={i} ref={(r) => { if (r) lights.current[i] = r; }} color={l.color} decay={0} intensity={0} />
      ))}
      <ambientLight intensity={0.35} />
    </>
  );
}

/* The camera path. At KEYS[1] and KEYS[2] the camera stands exactly where a light stands, with a long lens,
   so the sculpture flattens into that light's letter in front of its own shadow. */
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP_Y = v(0, 1, 0), UP_Z = v(0, 0, 1);
const KEYS = [
  { pos: v(6.6, 3.6, 7.4), look: v(-0.3, -0.2, -0.3), up: UP_Y, fov: 30 },   // 0: dark, three-quarter
  { pos: v(0, 0, 10), look: v(0, 0, -D), up: UP_Y, fov: 12.5 },              // 1: from the lamp: B
  { pos: v(10, 0, 0), look: v(-D, 0, 0), up: UP_Y, fov: 12.5 },              // 2: from your light: R
  { pos: v(4.8, 2.4, 5.4), look: v(-0.45, -0.25, -0.45), up: UP_Y, fov: 32 }, // 3: both shadows, one object
  { pos: v(0, 9.5, 0), look: v(0, -D, 0), up: UP_Z, fov: 17 },               // 4: overhead: the ३
  { pos: v(0, 10, -0.75), look: v(0, -D, -0.75), up: UP_Z, fov: 19 },           // 5: lights out, the ३ held high in frame (room for Enter below)
];
const ease = (t: number) => t * t * (3 - 2 * t);

function Camera({ s }: { s: IntroState }) {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []), look = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const i = Math.min(KEYS.length - 2, Math.floor(s.cam)), t = ease(clamp01(s.cam - i));
    const a = KEYS[i], b = KEYS[i + 1];
    pos.lerpVectors(a.pos, b.pos, t);
    if (i < 4) pos.setLength(THREE.MathUtils.lerp(a.pos.length(), b.pos.length(), t));   // orbit, don't cut across
    // Narrow screens: step back so the letters fit across.
    pos.multiplyScalar(Math.max(1, 0.85 / (size.width / size.height)));
    cam.position.copy(pos);
    cam.up.lerpVectors(a.up, b.up, t).normalize();
    cam.lookAt(look.lerpVectors(a.look, b.look, t));
    cam.fov = THREE.MathUtils.lerp(a.fov, b.fov, t);
    cam.updateProjectionMatrix();
  });
  return null;
}

export default function IntroStage({ font, s }: { font: string; s: IntroState }) {
  const [runs, setRuns] = useState<Float32Array | null>(null);

  // Carve the sculpture from the real letterforms: B and R in the brand face, the ३ from the mark artwork.
  useEffect(() => {
    let live = true;
    (async () => {
      await document.fonts.load(`700 200px ${font}`);
      const mark = new Image();
      await new Promise((r) => { mark.onload = mark.onerror = r; mark.src = '/img/mark-three.png'; });
      const letter = (ch: string) => (ctx: CanvasRenderingContext2D, size: number) => {
        ctx.font = `700 ${size * 0.8}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, size / 2, size / 2);
      };
      const three = (ctx: CanvasRenderingContext2D, size: number) => {
        const w = (mark.width / mark.height) * size;
        ctx.translate(size / 2, size / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(mark, -w / 2, -size / 2, w, size);
      };
      const out = carve({ B: rasterize(letter('B'), X, Y), R: rasterize(letter('R'), Z, Y), T: rasterize(three, X, Z) }, CELL);
      if (process.env.NODE_ENV !== 'production') console.info('[intro] threads', out.runs.length / 4, 'shadow cover', out.cover);
      if (live) setRuns(out.runs);
    })();
    return () => { live = false; };
  }, [font]);

  return (
    <Canvas flat dpr={[1, 2]} gl={{ stencil: true, antialias: true }} camera={{ fov: 30, position: KEYS[0].pos.toArray() }}
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }} style={{ position: 'absolute', inset: 0 }}>
      <color attach="background" args={['#223631']} />
      {runs && <Rig runs={runs} s={s} />}
      <Camera s={s} />
    </Canvas>
  );
}
