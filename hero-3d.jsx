import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, ContactShadows, Environment, Lightformer, MeshReflectorMaterial, PerformanceMonitor, RoundedBox, Sparkles, SpotLight, useTexture } from '@react-three/drei';
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, SMAA, SSAO, Vignette } from '@react-three/postprocessing';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { canvasTex, crackTexture, holoTexture, SIGN_COLORS, signTexture, textures } from './hero-3d-textures.js';

/* ============================================================
   HERO 3D — "the envoy at the gate", real-time (Three.js / R3F)
   One 24 s loop, same beats as the chapter captions:
     0  Route    — light packets stream through the gate, take their
                   route colour and fly to their service rack
     5  Protect  — red attacks hit a holographic hex shield → shatter
    10  Ship     — an xDS beam from above hits the emblem; a v2 rack
                   rises, takes the payments traffic, replaces v1
    15  Discover — the API map lights up above the racks
    20  Heal     — users-a goes red, is drained, comes back
   ============================================================ */

export const LOOP = 24;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (t, a, b) => clamp01((t - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
const rnd = (i, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- world layout (flow runs along +x) ---------- */
const GATE_X = 2;
const WORLD_YAW = 0.55;
const EMBLEM_YAW = -0.3 - WORLD_YAW; // face the camera
const ENTRY_X = GATE_X - 0.5;
const EXIT_X = GATE_X + 0.5;
const SHIELD_X = GATE_X - 0.52; // a flat honeycomb just in front of the gate opening
const RACKS = {
  orders: { pos: [2.78, 0, 2.17], color: new THREE.Color(0.2, 1.6, 2.2), label: 'orders' },
  usersA: { pos: [4.05, 0, 2.62], color: new THREE.Color(1.0, 1.0, 3.0), label: 'users-a' },
  usersB: { pos: [5.33, 0, 3.06], color: new THREE.Color(1.0, 1.0, 3.0), label: 'users-b' },
  pay: { pos: [6.6, 0, 3.51], color: new THREE.Color(0.3, 2.4, 1.3), label: 'payments' },
  payNew: { pos: [7.87, 0, 3.96], color: new THREE.Color(0.3, 2.4, 1.3), label: 'payments v2' },
};
// racks turn their LED face towards the camera
const RACK_YAW = 0.76;
const FACE = { x: -Math.cos(RACK_YAW), z: Math.sin(RACK_YAW) }; // outward normal of the LED face (local)
const RED = new THREE.Color(3.2, 0.35, 0.55);
const WHITE = new THREE.Color(1.5, 1.65, 2.2);

/* ---------- story state ---------- */
const S = {
  shield: (t) => smooth(ramp(t, 4.4, 5.1)) * (1 - smooth(ramp(t, 9.6, 10.4))),
  beam: (t) => ramp(t, 10.2, 10.7) * (1 - ramp(t, 11.2, 11.8)),
  emblemGreen: (t) => ramp(t, 10.6, 10.9) * (1 - ramp(t, 11.8, 13)),
  payNewRise: (t) => smooth(ramp(t, 11.2, 12.4)),
  payShift: (t) => ramp(t, 12.4, 13.8),
  payOldSink: (t) => smooth(ramp(t, 13.7, 14.4)),
  payNewSlide: (t) => smooth(ramp(t, 14.2, 15)),
  rollout: (t) => t >= 11.2 && t < 15,
  usersAHealth: (t) => 1 - ramp(t, 20.1, 20.4) * (1 - ramp(t, 22.3, 22.9)),
  usersADown: (t) => t >= 20.15 && t < 22.5,
  discover: (t) => (t >= 15 && t < 21.5 ? 1 - ramp(t, 20.3, 21.5) : 0),
};
const payNewPos = (t) => {
  const k = S.payNewSlide(t);
  const a = RACKS.payNew.pos, b = RACKS.pay.pos;
  return [a[0] + (b[0] - a[0]) * k, 0, a[2] + (b[2] - a[2]) * k];
};
const rackPos = (id, t) => (id === 'payNew' ? payNewPos(t) : RACKS[id].pos);

/* ---------- traffic schedule ---------- */
const T_IN = 2.7, T_GATE = 0.22, T_OUT = 2.3, T_ALL = T_IN + T_GATE + T_OUT;
const N_PACKETS = 170;
const PACKETS = Array.from({ length: N_PACKETS }, (_, i) => {
  const r = rnd(i, 1);
  return {
    i,
    s: (i * LOOP) / N_PACKETS + rnd(i, 2) * 0.1,
    kind: r < 0.3 ? 'orders' : r < 0.68 ? 'users' : 'pay',
    // anywhere out there (left, far and near, low and high) …
    origin: [-26 + rnd(i, 3) * 13, 0.3 + Math.pow(rnd(i, 4), 1.4) * 4.6, -15 + rnd(i, 5) * 24],
    // … converging on any point of the gate opening
    entry: [0.35 + rnd(i, 6) * 2.9, (rnd(i, 7) - 0.5) * 1.5],
    bend: [(rnd(i, 8) - 0.5) * 3, (rnd(i, 10) - 0.5) * 4],
  };
});
const destOf = (p, gateT) => {
  const g = ((gateT % LOOP) + LOOP) % LOOP;
  if (p.kind === 'orders') return 'orders';
  if (p.kind === 'users') return S.usersADown(g) ? 'usersB' : p.i % 2 ? 'usersA' : 'usersB';
  if (S.rollout(g)) return rnd(p.i, 9) < S.payShift(g) ? 'payNew' : 'pay';
  return 'pay';
};

const ATTACKS = Array.from({ length: 7 }, (_, j) => ({
  j,
  s: 4.9 + j * 0.62 + rnd(j, 11) * 0.12, // one at a time: each is stopped on its own
  origin: [-24 + rnd(j, 12) * 10, 0.4 + rnd(j, 13) * 3.6, -13 + rnd(j, 14) * 20],
  entry: [0.45 + rnd(j, 15) * 2.7, (rnd(j, 16) - 0.5) * 1.4], // where it hits the shield
  bend: [(rnd(j, 17) - 0.5) * 2.5, (rnd(j, 18) - 0.5) * 3],
}));
const A_TRAVEL = 1.45;

/* ---------- curves ---------- */
const MERGE = { y: 1.45, z: 0 }; // lanes merge inside the gate
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
// one approach curve per request: from its own origin, swinging in, straight into the opening
const approach = (o, entryX, e, bend) => new THREE.CatmullRomCurve3([
  v3(o),
  new THREE.Vector3(o[0] * 0.55 - 4, (o[1] + e[0]) / 2 + bend[0] * 0.3, o[2] * 0.5 + bend[1]),
  new THREE.Vector3(entryX - 2.2, e[0] + (o[1] - e[0]) * 0.12, e[1] * 1.6 + bend[1] * 0.15),
  new THREE.Vector3(entryX, e[0], e[1]),
], false, 'centripetal');
const PACKET_CURVES = PACKETS.map((p) => approach(p.origin, ENTRY_X, p.entry, p.bend));
const ATTACK_CURVES = ATTACKS.map((a) => approach(a.origin, SHIELD_X, a.entry, a.bend));
const attackPoint = (j, u, out) => ATTACK_CURVES[j].getPointAt(Math.min(1, Math.max(0, u)), out);
// gate exit → rise onto the overhead tray → run inside a blue tray cable → down the rack's own
// blue drop cable into the top of the cabinet (built lazily: the cables are defined below)
const ROUTE_CACHE = new Map();
const LANE = { orders: 2, usersA: 3, usersB: 3, pay: 4, payNew: 4 }; // which blue tray cable
function routeCurve(rack, dest) {
  const key = `${dest},${rack[0].toFixed(3)},${rack[2].toFixed(3)}`;
  let c = ROUTE_CACHE.get(key);
  if (c) return c;
  const { tray, drops } = cableRuns();
  const run = tray[LANE[dest] ?? 3];
  // a rack standing where a drop cable comes down uses that cable; the v2 rack, still sliding in, gets a free drop
  const id = Object.keys(drops).find((k) => Math.abs(RACKS[k].pos[0] - rack[0]) < 1e-3 && Math.abs(RACKS[k].pos[2] - rack[2]) < 1e-3);
  const drop = id ? drops[id][1] : null;
  const along = drop ? drop.along : (rack[0] - ROW_A[0]) * ROW_DIR[0] + (rack[2] - ROW_A[1]) * ROW_DIR[1];
  const start = run.getPoint(0);
  const pts = [
    new THREE.Vector3(EXIT_X, MERGE.y, MERGE.z),
    new THREE.Vector3(EXIT_X + 0.35, MERGE.y + 0.9, MERGE.z + 0.35),
    start.clone().lerp(new THREE.Vector3(EXIT_X + 0.35, start.y, MERGE.z + 0.35), 0.35),
  ];
  const uEnd = clamp01((along - 0.18) / ROW_LEN);
  for (let u = 0; u < uEnd; u += 0.25 / ROW_LEN) pts.push(run.getPoint(u));
  pts.push(run.getPoint(uEnd));
  if (drop) {
    for (let k = 0; k <= 6; k++) pts.push(drop.curve.getPoint(k / 6));
  } else {
    const top = new THREE.Vector3(rack[0], 2.8, rack[2]);
    const onTray = run.getPoint(clamp01(along / ROW_LEN));
    pts.push(onTray, onTray.clone().lerp(top, 0.5).setY(TRAY_Y - 0.15), top);
  }
  pts.push(new THREE.Vector3(rack[0], 2.45, rack[2]));
  c = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4);
  if (ROUTE_CACHE.size > 64) ROUTE_CACHE.clear();
  ROUTE_CACHE.set(key, c);
  return c;
}
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/* =========================================================== */
// weak GPUs / phones start in the light tier; PerformanceMonitor can still drop us there
const startLow = () => {
  if (typeof window === 'undefined') return false;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  return window.innerWidth < 760 || mem <= 4 || cores <= 4;
};

/* heavy CPU prep (canvas textures, merged cabinet geometry, curve length tables),
   called by the stage in an idle slot before the canvas mounts */
export function prepare() {
  textures();
  rackGeometry();
  PACKET_CURVES.forEach((c) => c.getLengths());
  ATTACK_CURVES.forEach((c) => c.getLengths());
}

export default function Hero3D({ timeRef, active = true, reduce = false, onReady }) {
  const [low] = useState(startLow); // decided once, never flips mid-session (no visual pop)
  // never render above the screen's own pixel ratio (a 1x monitor drew 1.5x = 2.25x the pixels), and cap at 1.25:
  // the scene sits behind depth of field and the hero shade, so more pixels are not visible, only slower
  const [maxDpr] = useState(() => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.25));
  const [dpr, setDpr] = useState(() => Math.min(1, maxDpr));
  const [warm, setWarm] = useState(false); // shaders compiled
  const born = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  return (
    <Canvas
      className="hx3-canvas"
      dpr={low ? 1 : dpr}
      shadows={low ? false : 'soft'}
      frameloop={!warm ? 'never' : reduce ? 'demand' : active ? 'always' : 'never'}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [-3.6, 1.75, 12.4], fov: 33, near: 0.1, far: 90 }}
    >
      {/* scale the render resolution smoothly with the measured frame rate */}
      <PerformanceMonitor
        ms={400}
        iterations={8}
        onChange={({ factor }) => {
          if (performance.now() - born.current < 6000) return; // let the first seconds settle
          // coarse steps between 0.75 and the cap; a slow machine drops resolution instead of frame rate
          setDpr(Math.min(maxDpr, Math.max(0.75, Math.round((0.75 + 0.5 * factor) * 4) / 4)));
        }}
      />
      <Warmup onDone={() => setWarm(true)} />
      <DrawOnce when={warm} />
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', 13, 42]} />
      <Clock timeRef={timeRef} reduce={reduce} onReady={onReady} />
      <CameraRig timeRef={timeRef} reduce={reduce} />

      <ambientLight intensity={0.06} />
      {/* real industrial-interior HDRI for reflections, plus shaped light panels */}
      <Environment files="/hero3d/env.hdr" resolution={256} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2.2} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[14, 1.2, 1]} color="#e6ecff" />
        <Lightformer form="rect" intensity={2.2} position={[0, 7, -5]} rotation-x={Math.PI / 2} scale={[14, 1.2, 1]} color="#e6ecff" />
        <Lightformer form="rect" intensity={3} position={[-7, 2.5, 2]} rotation-y={Math.PI / 2} scale={[10, 2.5, 1]} color="#2f6bff" />
        <Lightformer form="rect" intensity={2.2} position={[9, 2.5, -1]} rotation-y={-Math.PI / 2} scale={[10, 2.5, 1]} color="#22d3ee" />
      </Environment>

      <Floor low={low} />
      <Hall />
      <ContactShadows position={[0, 0.006, 0]} scale={40} blur={2.4} far={5} opacity={0.75} resolution={low ? 256 : 512} frames={1} color="#000" />
      {/* the flow runs along local +x; turn it so the gate faces the camera at an angle */}
      <group rotation-y={WORLD_YAW}>
        <KeyLight />
        <Sparkles count={low ? 60 : 170} scale={[7, 6, 6]} position={[GATE_X + 0.8, 3, 1]} size={2.2} speed={0.22} opacity={0.45} noise={0.8} color="#c7d2fe" />
        <Shadowed>
          <Gate timeRef={timeRef} />
          <DataCenter timeRef={timeRef} />
          <Racks timeRef={timeRef} />
        </Shadowed>
        <Shield timeRef={timeRef} />
        <LightTrails timeRef={timeRef} />
        <Attacks timeRef={timeRef} />
        <AttackImpacts timeRef={timeRef} />
        <GateBursts timeRef={timeRef} />
        <XdsBeam timeRef={timeRef} />
        <Discovery timeRef={timeRef} />
      </group>

      {low ? (
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.9} radius={0.7} />
          <Vignette offset={0.22} darkness={0.8} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass>
          <SSAO resolutionScale={0.75} samples={11} rings={4} radius={0.1} intensity={12} luminanceInfluence={0.6} bias={0.03} worldDistanceThreshold={8} worldDistanceFalloff={2} worldProximityThreshold={0.6} worldProximityFalloff={0.3} color="#000000" />
          <DepthOfField target={FOCUS} focalLength={0.045} bokehScale={2.2} />
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.78} />
          <Lens />
          <ChromaticAberration offset={[0.00022, 0.00015]} radialModulation modulationOffset={0.45} />
          <Vignette offset={0.22} darkness={0.8} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/* Lens: dirt on the front element lit by the scene's brightness, and a filmic grade (lifted blacks, teal shadows,
   warm highlights). */
const LENS_FRAG = /* glsl */ `
uniform sampler2D dirt;
uniform float dirtAmt;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;
  // lens dirt lit by the average light around this point
  vec3 glow = vec3(0.0);
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.785;
    glow += texture2D(inputBuffer, uv + vec2(cos(a), sin(a)) * 0.07).rgb;
  }
  glow /= 8.0;
  col += texture2D(dirt, uv).r * glow * dirtAmt;
  // filmic grade
  float l = lum(col);
  col = mix(col, col * vec3(0.92, 1.0, 1.08), smoothstep(0.35, 0.0, l) * 0.6);
  col = mix(col, col * vec3(1.06, 1.0, 0.94), smoothstep(0.5, 1.0, l) * 0.35);
  col = col * 0.97 + 0.012;
  outputColor = vec4(col, inputColor.a);
}`;
class LensEffect extends Effect {
  constructor({ dirt, dirtAmt = 0.35 } = {}) {
    super('LensEffect', LENS_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION, // samples neighbouring pixels
      uniforms: new Map([['dirt', new THREE.Uniform(dirt)], ['dirtAmt', new THREE.Uniform(dirtAmt)]]),
    });
  }
}
function Lens() {
  const { lensDirt } = textures();
  const effect = useMemo(() => new LensEffect({ dirt: lensDirt }), [lensDirt]);
  return <primitive object={effect} dispose={null} />;
}

/* every opaque lit mesh under this group casts and receives shadows */
function Shadowed({ children }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const apply = () => ref.current?.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const m = o.material;
      const lit = m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) && !m.transparent && !(m.transmission > 0);
      // only sizeable parts cast: feet, hinges, seams and slots would just add shadow draw calls
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const sz = o.geometry.boundingBox.getSize(new THREE.Vector3());
      const big = Math.max(sz.x * o.scale.x, sz.y * o.scale.y, sz.z * o.scale.z) > 0.35;
      o.castShadow = !!lit && big;
      o.receiveShadow = !!lit;
    });
    apply();
    const id = setTimeout(apply, 600); // racks/labels mount a frame later
    return () => clearTimeout(id);
  }, []);
  return <group ref={ref}>{children}</group>;
}

/* frameloop 'demand' (reduced motion) only draws when asked: ask once when ready */
function DrawOnce({ when }) {
  const { invalidate } = useThree();
  useEffect(() => { if (when) invalidate(); }, [when, invalidate]);
  return null;
}

/* compile every material before the first frame: compileAsync uses
   KHR_parallel_shader_compile where available, so the page doesn't freeze */
function Warmup({ onDone }) {
  const { gl, scene, camera } = useThree();
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let alive = true;
    const go = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve();
    // then upload every texture to the GPU one per idle slot, so the first frame doesn't do it all at once
    const uploadTextures = () => new Promise((resolve) => {
      const texs = new Set();
      scene.traverse((o) => {
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach((m) => Object.values(m).forEach((v) => v && v.isTexture && texs.add(v)));
      });
      if (scene.environment) texs.add(scene.environment);
      const list = [...texs];
      const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 200 }) : setTimeout(fn, 16));
      const step = () => {
        if (!alive) return resolve();
        const t = list.shift();
        if (!t) return resolve();
        try { gl.initTexture(t); } catch { /* not all textures can be pre-uploaded */ }
        idle(step);
      };
      idle(step);
    });
    go.catch(() => {}).then(uploadTextures).then(() => alive && done.current());
    return () => { alive = false; };
  }, [gl, scene, camera]); // once — not on every parent render
  return null;
}

/* volumetric key light over the gate (+ its target) */
function KeyLight() {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    target.position.set(GATE_X, 0, 0);
    light.current.target = target;
    light.current.parent?.add(target);
  }, [target]);
  return (
    <SpotLight
      ref={light}
      position={[GATE_X - 0.4, 10.5, 0.3]}
      distance={14}
      angle={0.3}
      penumbra={0.9}
      attenuation={11}
      anglePower={5}
      intensity={50}
      opacity={0.26}
      color="#b9c6ff"
      volumetric
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-radius={6}
    />
  );
}

/* the data hall: ceiling light strips (they reflect in the floor) and
   rows of racks fading into the fog — out of focus they become bokeh */
function Hall() {
  const far = useRef();
  const { rackMap, rackEmit, brushed } = textures();
  const ROWS = useMemo(() => {
    const out = [];
    [-15, -22, -30].forEach((z, r) => {
      for (let x = -18; x < 22; x += 1.15) {
        if (Math.abs(x - 1.5) < 2.2 && r === 0) continue; // central aisle
        if (rnd(x * 10 + r, 61) < 0.08) continue;
        out.push([x, z]);
      }
    });
    return out;
  }, []);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: '#0b0c10', metalness: 0.8, roughness: 0.45, roughnessMap: brushed });
    const front = new THREE.MeshStandardMaterial({ map: rackMap, emissiveMap: rackEmit, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 2.2, metalness: 0.5, roughness: 0.5 });
    return [side, side, side, side, front, side];
  }, [brushed, rackMap, rackEmit]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    ROWS.forEach(([x, z], i) => {
      o.position.set(x, 1.35, z);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      far.current.setMatrixAt(i, o.matrix);
    });
    far.current.instanceMatrix.needsUpdate = true;
  }, [ROWS]);
  return (
    <group>
      <instancedMesh ref={far} args={[null, mats, ROWS.length]}>
        <boxGeometry args={[1.0, 2.7, 1.05]} />
      </instancedMesh>
      {[-7, -2.5, 2, 6.5, 11].map((x) => (
        <mesh key={x} position={[x, 17, -18]}>
          <boxGeometry args={[0.07, 0.03, 34]} />
          <meshBasicMaterial color={[0.55, 0.58, 0.75]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- clock & camera ---------- */
function Clock({ timeRef, reduce, onReady }) {
  const told = useRef(false);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    if (reduce) { timeRef.current = 7.2; invalidate(); }
  }, [reduce, timeRef, invalidate]);
  useFrame((_, dt) => {
    if (!told.current) { told.current = true; requestAnimationFrame(() => onReady?.()); } // after the first frame is on screen // after the first frame is on screen
    if (reduce) return;
    timeRef.current = (timeRef.current + Math.min(dt, 0.05)) % LOOP;
  }, -10);
  return null;
}

// world-space shots (the scene group is turned by WORLD_YAW); subject stays right of the headline
// focus: [from, to] — a rack-focus pull while the shot holds (world space)
const SHOTS = [
  { t: 0, pos: [-3.6, 1.9, 12.8], look: [0.7, 2.25, -0.6], focus: [[1.7, 2.0, -1.0], [3.6, 1.6, 0.3]] }, // Route — gate, then racks
  { t: 5, pos: [-4.9, 1.7, 11.1], look: [0.95, 2.15, -0.7], focus: [[0.6, 1.8, -0.4], [0.6, 1.8, -0.4]] }, // Protect — on the shield
  { t: 10, pos: [-2.6, 1.3, 11.8], look: [1.7, 2.85, -0.9], focus: [[1.7, 4.7, -1.0], [4.5, 1.6, 0.0]] }, // Ship — emblem, then the v2 rack
  { t: 15, pos: [-2.4, 2.2, 14.6], look: [2.0, 3.55, -0.3], focus: [[2.4, 4.6, 0.6], [4.0, 4.8, 1.5]] }, // Discover — along the API map
  { t: 20, pos: [-1.0, 1.8, 12.1], look: [1.9, 2.0, 0.0], focus: [[1.7, 2.0, -1.0], [4.3, 1.7, 0.3]] }, // Heal — gate, then the failing rack
];
const MOVE = 3.0; // seconds each camera move takes
const VIEW = { fadeFrom: -2 }; // shared with the trail shader
const DOLLY = 0.025; // how far a held shot creeps in towards its subject
const shotEnd = (k) => (k + 1 < SHOTS.length ? SHOTS[k + 1].t : LOOP);
const FOCUS = new THREE.Vector3(1.9, 2, -1.3);
const easeIO3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// smootherstep: zero velocity *and* acceleration at both ends — no jolt when a move starts or lands
const easeShot = (x) => x * x * x * (x * (x * 6 - 15) + 10);

function CameraRig({ timeRef, reduce }) {
  const pointer = useRef([0, 0]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const t = timeRef.current;
    let i = 0;
    for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t) i = k;
    const from = SHOTS[(i + SHOTS.length - 1) % SHOTS.length];
    const to = SHOTS[i];
    const k = easeShot(clamp01((t - to.t) / MOVE));
    // a move starts exactly where the previous shot's slow dolly-in ended (fully held), and the
    // new shot's own dolly-in only begins once it has landed — so there is never a jump
    a.set(...from.pos).lerp(b.set(...from.look), DOLLY);
    pos.copy(a).lerp(a.set(...to.pos), k);
    look.set(...from.look).lerp(b.set(...to.look), k);
    const hold = easeShot(clamp01((t - to.t - MOVE) / (shotEnd(i) - to.t - MOVE)));
    pos.lerp(look, DOLLY * hold);
    // handheld drift
    if (!reduce) {
      pos.x += Math.sin(t * 0.83) * 0.03 + Math.sin(t * 2.1) * 0.008;
      pos.y += Math.sin(t * 1.27 + 1) * 0.018;
      look.x += Math.sin(t * 0.61 + 2) * 0.02;
      look.y += Math.sin(t * 0.97) * 0.012;
    }
    const px = reduce ? 0 : state.pointer.x;
    const py = reduce ? 0 : state.pointer.y;
    pointer.current[0] += (px - pointer.current[0]) * 0.03;
    pointer.current[1] += (py - pointer.current[1]) * 0.03;
    pos.x += pointer.current[0] * 0.35;
    pos.y += pointer.current[1] * 0.15;
    state.camera.position.copy(pos);
    state.camera.lookAt(look);
    const { width: W, height: H } = state.size;
    const aspect = W / Math.max(1, H);
    const fov = THREE.MathUtils.clamp(33 * Math.pow(1.6 / aspect, aspect > 1.6 ? 0.3 : 0.55), 29, 46);
    // the scene sits in its own framed viewport (no copy over it), so the picture is centred
    // and the light trails show across the whole frame
    VIEW.fadeFrom = -2;
    const cam = state.camera;
    // frame the gate and the racks in the middle of the window: zoom out a touch, slide the picture left
    // (the empty hall on the left shrinks) and up (clear of the chapter control along the bottom edge)
    const fovF = fov * 1.08;
    const ox = Math.round(W * 0.07), oy = Math.round(H * 0.05);
    if (Math.abs(cam.fov - fovF) > 0.01 || cam.view?.offsetX !== ox || cam.view?.offsetY !== oy || cam.view?.fullWidth !== W || cam.view?.fullHeight !== H) {
      cam.fov = fovF;
      cam.setViewOffset(W, H, ox, oy, W, H);
      cam.updateProjectionMatrix();
    }
    const fa = to.focus[0], fb = to.focus[1];
    const fk = easeIO3(clamp01((t - to.t - 1.2) / 2.8));
    a.set(...fa).lerp(b.set(...fb), fk);
    FOCUS.lerp(a, 0.08);
  });
  return null;
}

/* ---------- floor ---------- */
// bake the 60 cm raised-floor tile seams into the real concrete maps
function withSeams(img, seam, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, size, size);
  g.fillStyle = seam;
  const w = Math.max(2, size / 256);
  for (let k = 0; k <= 2; k++) { g.fillRect(k * (size / 2) - w, 0, w * 2, size); g.fillRect(0, k * (size / 2) - w, size, w * 2); }
  return c;
}
function Floor({ low }) {
  const [diff, nor, rough] = useTexture(['/hero3d/floor_diff.jpg', '/hero3d/floor_nor.jpg', '/hero3d/floor_rough.jpg']);
  const { floorDistort } = textures();
  const maps = useMemo(() => {
    const mk = (canvasOrImg, srgb) => {
      const t = canvasOrImg instanceof HTMLCanvasElement ? new THREE.CanvasTexture(canvasOrImg) : canvasOrImg;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(50, 50);
      t.anisotropy = 8;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      return t;
    };
    return {
      map: mk(withSeams(diff.image, 'rgba(0,0,0,.85)'), true),
      roughnessMap: mk(withSeams(rough.image, 'rgba(255,255,255,.95)'), false),
      normalMap: mk(nor, false),
    };
  }, [diff, nor, rough]);
  if (low) {
    return (
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial {...maps} color="#3a3f52" metalness={0.3} roughness={0.55} normalScale={[0.6, 0.6]} />
      </mesh>
    );
  }
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial
        {...maps}
        normalScale={[0.5, 0.5]}
        distortionMap={floorDistort}
        distortion={0.12}
        blur={[300, 90]}
        resolution={512}
        mixBlur={0.9}
        mixStrength={30}
        mixContrast={1.1}
        roughness={0.85}
        depthScale={1.0}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.4}
        color="#3c4255"
        metalness={0.5}
        mirror={0.8}
      />
    </mesh>
  );
}

/* ---------- data-centre dressing: cable tray, fibre + copper runs, cold aisle ---------- */
const ROW_A = [2.0, 1.9];
const ROW_B = [9.2, 4.43];
const ROW_LEN = Math.hypot(ROW_B[0] - ROW_A[0], ROW_B[1] - ROW_A[1]);
const ROW_YAW = -Math.atan2(ROW_B[1] - ROW_A[1], ROW_B[0] - ROW_A[0]);
const ROW_DIR = [(ROW_B[0] - ROW_A[0]) / ROW_LEN, (ROW_B[1] - ROW_A[1]) / ROW_LEN];
const TRAY_Y = 3.32;
const rowPoint = (k, side = 0, y = TRAY_Y) => new THREE.Vector3(
  ROW_A[0] + ROW_DIR[0] * k - ROW_DIR[1] * side, y, ROW_A[1] + ROW_DIR[1] * k + ROW_DIR[0] * side,
);

// cables: bundles along the tray + drops into the racks. Shared with the request routes, so the
// light rides inside the very cables that are drawn.
const TRAY_CABLES = ['#f5c518', '#f5c518', '#2f6fed', '#2f6fed', '#2f6fed', '#e9ecf2'];
const DROPS = [['#f5c518', -0.12], ['#2f6fed', 0.0], ['#2f6fed', 0.1]];
let CABLES = null;
function cableRuns() {
  if (CABLES) return CABLES;
  const all = [], tray = [], drops = {};
  TRAY_CABLES.forEach((c, i) => {
    const side = -0.14 + i * 0.056;
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const kk = (k / 12) * ROW_LEN;
      pts.push(rowPoint(kk, side, TRAY_Y + 0.05 + Math.sin(k * 1.7 + i) * 0.012));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    tray.push(curve);
    all.push({ curve, color: c, r: i < 2 ? 0.014 : 0.018 });
  });
  ['orders', 'usersA', 'usersB', 'pay'].forEach((id) => {
    const r = RACKS[id].pos;
    drops[id] = DROPS.map(([c, off], k) => {
      const top = new THREE.Vector3(r[0] + off * Math.cos(RACK_YAW), 2.76, r[2] - off * Math.sin(RACK_YAW));
      const along = Math.hypot(r[0] - ROW_A[0], r[2] - ROW_A[1]) + off;
      const from = rowPoint(along, -0.1 + k * 0.08, TRAY_Y + 0.04);
      const mid = from.clone().lerp(top, 0.5); mid.y = TRAY_Y - 0.12;
      const curve = new THREE.CatmullRomCurve3([from, mid, top]);
      all.push({ curve, color: c, r: 0.016 });
      return { curve, along };
    });
  });
  CABLES = { all, tray, drops };
  return CABLES;
}

function DataCenter() {
  const rungs = useRef();
  const { brushed } = textures();
  const galv = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2f3a', metalness: 0.9, roughness: 0.45, roughnessMap: brushed }), [brushed]);
  const perf = useMemo(() => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2b303c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#07080c';
    for (let x = 10; x < w; x += 12) for (let y = 10; y < h; y += 12) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
    g.fillStyle = '#0a0b10'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h);
  }, { srgb: true }), []);
  const coldTex = useMemo(() => canvasTex(4, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, h, 0, 0);
    grd.addColorStop(0, 'rgba(120,190,255,.55)'); grd.addColorStop(1, 'rgba(120,190,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }), []);
  const cables = useMemo(() => cableRuns().all, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const n = Math.floor(ROW_LEN / 0.3);
    for (let i = 0; i < n; i++) {
      o.position.copy(rowPoint(i * 0.3 + 0.15, 0, TRAY_Y));
      o.rotation.set(0, ROW_YAW, 0);
      o.updateMatrix();
      rungs.current.setMatrixAt(i, o.matrix);
    }
    rungs.current.count = n;
    rungs.current.instanceMatrix.needsUpdate = true;
  }, []);
  const mid = rowPoint(ROW_LEN / 2, 0, TRAY_Y);
  return (
    <group>
      {/* ladder tray + hanger rods */}
      {[-0.22, 0.22].map((side) => (
        <mesh key={side} position={rowPoint(ROW_LEN / 2, side, TRAY_Y + 0.03)} rotation-y={ROW_YAW} material={galv}>
          <boxGeometry args={[ROW_LEN, 0.09, 0.025]} />
        </mesh>
      ))}
      <instancedMesh ref={rungs} args={[null, galv, 40]}>
        <boxGeometry args={[0.03, 0.02, 0.44]} />
      </instancedMesh>
      {[0.6, 3.4, 6.2].map((k) => [-0.22, 0.22].map((side) => (
        <mesh key={`${k}${side}`} position={rowPoint(k, side, TRAY_Y + 3)} material={galv}>
          <cylinderGeometry args={[0.012, 0.012, 6, 6]} />
        </mesh>
      )))}
      {cables.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c.curve, 48, c.r, 6, false]} />
          <meshStandardMaterial color={c.color} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}
      {/* cold aisle: perforated tiles in front of the racks, cold air rising */}
      {Array.from({ length: 5 }, (_, i) => {
        const p = rowPoint(0.9 + i * 1.2, 1.2, 0.008);
        return (
          <group key={i} position={p} rotation-y={ROW_YAW}>
            <mesh rotation-x={-Math.PI / 2}>
              <planeGeometry args={[1.18, 1.18]} />
              <meshStandardMaterial map={perf} metalness={0.7} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <planeGeometry args={[1.18, 1.8]} />
              <meshBasicMaterial map={coldTex} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
      <pointLight position={[mid.x, 4.5, mid.z]} intensity={1.2} distance={5} color="#9fb4ff" />
    </group>
  );
}

/* ---------- the gate ---------- */
const darkMetal = { color: '#14161e', metalness: 0.95, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 };

function useEmblemGeometry(half = 4.5, depth = 5, bevel = 1) {
  // the Elchi mark (logo.svg) as a bevelled, extruded stroke
  return useMemo(() => {
    const pts = [[114, 15.1], [90.25, 15.1], [80.5, 32], [90.25, 48.9], [114, 48.9]];
    const outer = [], inner = [];
    // offset the polyline on both sides (miter joins)
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = 0, ny = 0;
      const seg = (q, r) => { const dx = r[0] - q[0], dy = r[1] - q[1]; const l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      if (i > 0) { const n = seg(a, p); nx += n[0]; ny += n[1]; }
      if (i < pts.length - 1) { const n = seg(p, b); nx += n[0]; ny += n[1]; }
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      let miter = half;
      if (i > 0 && i < pts.length - 1) { const n1 = seg(a, p); miter = half / Math.max(0.3, n1[0] * nx + n1[1] * ny); }
      outer.push([p[0] + nx * miter, p[1] + ny * miter]);
      inner.push([p[0] - nx * miter, p[1] - ny * miter]);
    }
    const shape = new THREE.Shape();
    const all = [...outer, ...inner.reverse()];
    all.forEach(([x, y], i) => (i ? shape.lineTo(x - 97, -(y - 32)) : shape.moveTo(x - 97, -(y - 32))));
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel * 1.2, bevelSize: bevel, bevelSegments: 5 });
    g.translate(0, 0, -depth / 2);
    return g;
  }, [half, depth, bevel]);
}

const CHASE = [0, 1, 3, 2]; // top-left, top-right, bottom-right, bottom-left
const CUBE_PULSE = [0, 0, 0, 0];
function Gate({ timeRef }) {
  const coreMat = useRef();
  const cubeMats = useRef([]);
  const seamMats = useRef([]);
  const scan = useRef();
  const portal = useRef();
  const frameGeo = useEmblemGeometry(4.5, 5, 1);
  const coreGeo = useEmblemGeometry(2.3, 8.2, 0.3);
  const { brushed, glassRough } = textures();
  const metal = useMemo(() => ({ ...darkMetal, roughnessMap: brushed }), [brushed]);
  const portalTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, 'rgba(99,102,241,0)');
    grd.addColorStop(0.5, 'rgba(129,140,248,.45)');
    grd.addColorStop(1, 'rgba(34,211,238,.8)');
    g.fillStyle = grd; g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);
  const blue = useMemo(() => new THREE.Color(0.45, 0.9, 3.6), []);
  const green = useMemo(() => new THREE.Color(0.3, 3.2, 1.6), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const t = timeRef.current;
    const pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
    const gk = S.emblemGreen(t);
    tmp.copy(blue).lerp(green, gk).multiplyScalar(pulse * (1 + gk * 0.2));
    if (coreMat.current) coreMat.current.color.copy(tmp);
    // the 2×2 squares of the mark light up in turn (clockwise) as requests cross the gate
    CUBE_PULSE.fill(0);
    for (const p of PACKETS) {
      for (const s of [p.s, p.s - LOOP]) {
        const d = t - (s + T_IN + T_GATE * 0.5);
        if (d >= 0 && d < 0.45) { const j = CHASE[p.i % 4]; CUBE_PULSE[j] = Math.max(CUBE_PULSE[j], Math.exp(-d * 8)); }
      }
    }
    cubeMats.current.forEach((m, i) => {
      if (!m) return;
      if (i === 1 || i === 2) m.color.copy(tmp).multiplyScalar(0.9 * (1 + 0.55 * CUBE_PULSE[i]));
      else m.emissive.copy(tmp).multiplyScalar(0.35 * CUBE_PULSE[i]);
    });
    seamMats.current.forEach((m) => m && m.color.setRGB(0.55, 0.6, 2.8).multiplyScalar(0.8 + 0.2 * Math.sin(t * 3)).lerp(green, gk * 0.6));
    if (scan.current) scan.current.position.y = 0.2 + ((t * 0.9) % 1) * 3.2;
    if (portal.current) portal.current.material.opacity = 0.18 + 0.05 * Math.sin(t * 1.7) + S.shield(t) * 0.05 + GATE_FLASH.value * 0.1;
  });

  return (
    <group position={[GATE_X, 0, 0]}>
      {/* pillars: brushed dark steel, panel grooves, light seams, status lights */}
      {[-1.12, 1.12].map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <RoundedBox args={[0.62, 3.7, 0.42]} radius={0.05} smoothness={5} position={[0, 1.85, 0]}>
            <meshPhysicalMaterial {...metal} />
          </RoundedBox>
          {[0.55, 1.6, 2.65].map((y) => (
            <mesh key={y} position={[-0.312, y, 0]}>
              <boxGeometry args={[0.01, 0.012, 0.36]} />
              <meshStandardMaterial color="#030305" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 1.85, -Math.sign(z) * 0.213]}>
            <boxGeometry args={[0.045, 3.3, 0.01]} />
            <meshBasicMaterial ref={(m) => (seamMats.current[i] = m)} toneMapped={false} />
          </mesh>
          <mesh position={[-0.313, 1.85, -Math.sign(z) * 0.17]}>
            <boxGeometry args={[0.01, 3.3, 0.02]} />
            <meshBasicMaterial ref={(m) => (seamMats.current[i + 2] = m)} toneMapped={false} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[-0.315, 3.3 - k * 0.08, Math.sign(z) * 0.12]}>
              <boxGeometry args={[0.01, 0.025, 0.025]} />
              <meshBasicMaterial color={k === 0 ? [0.4, 2.5, 1.2] : [0.6, 0.7, 2.4]} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {/* lintel + plinth */}
      <RoundedBox args={[0.8, 0.34, 2.9]} radius={0.05} smoothness={5} position={[0, 3.86, 0]}>
        <meshPhysicalMaterial {...metal} />
      </RoundedBox>
      <mesh position={[-0.402, 3.86, 0]}>
        <boxGeometry args={[0.01, 0.03, 2.4]} />
        <meshBasicMaterial ref={(m) => (seamMats.current[4] = m)} toneMapped={false} />
      </mesh>
      <RoundedBox args={[1.2, 0.1, 3.3]} radius={0.03} smoothness={3} position={[0, 0.05, 0]}>
        <meshPhysicalMaterial {...metal} roughness={0.45} />
      </RoundedBox>
      {/* glass pane + light field in the opening */}
      <mesh position={[0, 1.85, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.8, 3.55]} />
        <meshPhysicalMaterial color="#9fb0ff" transmission={1} thickness={0.04} roughness={0.1} roughnessMap={glassRough} ior={1.45} metalness={0} transparent opacity={0.9} side={THREE.DoubleSide} envMapIntensity={0.6} />
      </mesh>
      <mesh ref={portal} position={[0.01, 1.85, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.78, 3.55]} />
        <meshBasicMaterial map={portalTex} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={scan} position={[0.02, 1, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.78, 0.02]} />
        <meshBasicMaterial color={[1.6, 1.8, 3]} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* the emblem: brushed-steel frame with a light core, turned towards the viewer */}
      <group position={[0, 4.78, 0]} rotation-y={EMBLEM_YAW} scale={0.024}>
        <mesh geometry={frameGeo}>
          <meshPhysicalMaterial color="#8d97b3" metalness={1} roughness={0.28} roughnessMap={brushed} clearcoat={0.8} clearcoatRoughness={0.15} />
        </mesh>
        <mesh geometry={coreGeo}>
          <meshBasicMaterial ref={coreMat} toneMapped={false} />
        </mesh>
        {[[-0.5, 3.5], [6.5, 3.5], [-0.5, -3.5], [6.5, -3.5]].map(([x, y], i) => (
          <RoundedBox key={i} args={[5, 5, 5]} radius={0.7} smoothness={3} position={[x, y, 0]}>
            {i === 1 || i === 2
              ? <meshBasicMaterial ref={(m) => (cubeMats.current[i] = m)} toneMapped={false} />
              : <meshPhysicalMaterial ref={(m) => (cubeMats.current[i] = m)} color="#c3cbe0" metalness={1} roughness={0.22} clearcoat={1} />}
          </RoundedBox>
        ))}
      </group>
      <pointLight position={[-0.6, 4.7, 0]} intensity={3} distance={4} color="#5b8cff" />
    </group>
  );
}

/* ---------- traffic ---------- */
const o3 = new THREE.Object3D();
const vA = new THREE.Vector3();
const vB = new THREE.Vector3();

function placeAlong(mesh, idx, a, b, scaleLen, width) {
  o3.position.copy(a);
  o3.lookAt(b);
  o3.scale.set(width, width, scaleLen);
  o3.updateMatrix();
  mesh.setMatrixAt(idx, o3.matrix);
}

function packetPos(p, s, d, t, out) {
  const dest = destOf(p, s + T_IN);
  const e = p.entry;
  if (d < T_IN) {
    // accelerate towards the gate (light, not cars: no braking at the door)
    const u = Math.pow(clamp01(d / T_IN), 1.35);
    PACKET_CURVES[p.i].getPointAt(Math.min(u, 1), out);
    return { dest, k: 0 };
  }
  if (d < T_IN + T_GATE) {
    const k = (d - T_IN) / T_GATE;
    out.set(ENTRY_X + k, e[0] + (MERGE.y - e[0]) * k, e[1] + (MERGE.z - e[1]) * k);
    return { dest, k };
  }
  const u = easeInOut(clamp01((d - T_IN - T_GATE) / T_OUT));
  routeCurve(rackPos(dest, t), dest).getPointAt(Math.min(1, u), out);
  return { dest, k: 1 };
}

/* Requests as long-exposure light streaks: camera-facing ribbons with a
   white-hot core and a coloured falloff, tapering towards the tail. */
const TRAIL_PTS = 20;
const TRAIL_SPAN = 0.34; // seconds of history in each streak
const MAX_TRAILS = 140;
const TRAIL_VERT = /* glsl */ `
uniform vec2 uRes;
attribute vec3 prev;
attribute vec3 next;
attribute float side;
attribute float width;
attribute vec4 color;
varying vec4 vColor;
varying float vSide;
varying float vX;
void main() {
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 cp = mvp * vec4(position, 1.0);
  // depth only: pulled 6 cm towards the camera, so a streak running inside a cable shows through it
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 biased = projectionMatrix * vec4(mv.xyz * (1.0 - 0.06 / max(length(mv.xyz), 0.1)), 1.0);
  vec4 pp = mvp * vec4(prev, 1.0);
  vec4 np = mvp * vec4(next, 1.0);
  vec2 dir = (np.xy / np.w - pp.xy / pp.w) * uRes;
  float l = length(dir);
  dir = l > 1e-5 ? dir / l : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  float px = width * projectionMatrix[1][1] * uRes.y * 0.5 / cp.w;
  px = width > 0.0 ? max(px, 1.5) : 0.0;
  cp.xy += n / uRes * px * side * cp.w;
  cp.z = biased.z / biased.w * cp.w;
  gl_Position = cp;
  vX = cp.x / cp.w;
  vColor = color;
  vSide = side;
}`;
const TRAIL_FRAG = /* glsl */ `
uniform float uFadeFrom;
varying vec4 vColor;
varying float vSide;
varying float vX;
void main() {
  float d = abs(vSide);
  float core = exp(-d * d * 22.0);
  float glow = exp(-d * d * 3.5);
  vec3 c = vColor.rgb * glow * 0.55 + mix(vColor.rgb, vec3(1.0), 0.65) * core * 1.6;
  float keep = smoothstep(uFadeFrom, uFadeFrom + 0.35, vX); // nothing crosses the headline
  gl_FragColor = vec4(c * vColor.a * keep, 1.0);
}`;

function LightTrails({ timeRef }) {
  const { geo, attr } = useMemo(() => {
    const V = MAX_TRAILS * TRAIL_PTS * 2;
    const g = new THREE.BufferGeometry();
    const mk = (n) => new THREE.BufferAttribute(new Float32Array(V * n), n).setUsage(THREE.DynamicDrawUsage);
    const attr = { position: mk(3), prev: mk(3), next: mk(3), width: mk(1), color: mk(4), side: new THREE.BufferAttribute(new Float32Array(V), 1) };
    for (let v = 0; v < V; v++) attr.side.array[v] = v % 2 ? 1 : -1;
    Object.entries(attr).forEach(([k, a]) => g.setAttribute(k, a));
    const idx = [];
    for (let tr = 0; tr < MAX_TRAILS; tr++) {
      for (let k = 0; k < TRAIL_PTS - 1; k++) {
        const a = (tr * TRAIL_PTS + k) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    g.setIndex(idx);
    return { geo: g, attr };
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uFadeFrom: { value: -2 } },
    vertexShader: TRAIL_VERT,
    fragmentShader: TRAIL_FRAG,
    transparent: true,
    depthWrite: true, // depth-of-field reads depth: without it the streaks get blurred away like background
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, // ribbon winding flips with direction
    toneMapped: false,
  }), []);
  const pts = useMemo(() => Array.from({ length: TRAIL_PTS }, () => new THREE.Vector3()), []);
  const cols = useMemo(() => Array.from({ length: TRAIL_PTS }, () => new THREE.Color()), []);
  const tmpV = useMemo(() => new THREE.Vector3(), []);

  useFrame((st) => {
    const { size, gl } = st;
    const dpr = gl.getPixelRatio();
    mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
    mat.uniforms.uFadeFrom.value = VIEW.fadeFrom;
    const t = timeRef.current;
    const P = attr.position.array, PR = attr.prev.array, NX = attr.next.array, WD = attr.width.array, C = attr.color.array;
    let tr = 0;
    const write = (headW, fade, isRed) => {
      for (let k = 0; k < TRAIL_PTS; k++) {
        const p = pts[k];
        const pv = k > 0 ? pts[k - 1] : tmpV.copy(pts[0]).multiplyScalar(2).sub(pts[1]);
        const nx = k < TRAIL_PTS - 1 ? pts[k + 1] : null;
        const q = 1 - k / (TRAIL_PTS - 1);
        for (let sd = 0; sd < 2; sd++) {
          const v = (tr * TRAIL_PTS + k) * 2 + sd;
          P[v * 3] = p.x; P[v * 3 + 1] = p.y; P[v * 3 + 2] = p.z;
          // prev/next are swapped on purpose: the ribbon runs head → tail
          PR[v * 3] = pv.x; PR[v * 3 + 1] = pv.y; PR[v * 3 + 2] = pv.z;
          const n2 = nx || tmpV.copy(p).multiplyScalar(2).sub(pts[k - 1]);
          NX[v * 3] = n2.x; NX[v * 3 + 1] = n2.y; NX[v * 3 + 2] = n2.z;
          WD[v] = headW * Math.pow(q, 0.7) * fade;
          const c = cols[k];
          C[v * 4] = c.r; C[v * 4 + 1] = c.g; C[v * 4 + 2] = c.b;
          C[v * 4 + 3] = Math.pow(q, 1.8) * fade * (k === 0 ? 1.6 : 1) * (isRed ? 1.1 : 1);
        }
      }
      tr++;
    };
    // requests
    for (const p of PACKETS) {
      for (const s of [p.s, p.s - LOOP]) {
        const d = t - s;
        if (d < 0 || d >= T_ALL || tr >= MAX_TRAILS) continue;
        const fade = d > T_ALL - 0.15 ? (T_ALL - d) / 0.15 : d < 0.3 ? d / 0.3 : 1;
        for (let k = 0; k < TRAIL_PTS; k++) {
          const dk = Math.max(0, d - (k / (TRAIL_PTS - 1)) * TRAIL_SPAN);
          const info = packetPos(p, s, dk, t, pts[k]);
          cols[k].copy(WHITE).lerp(RACKS[info.dest].color, info.k);
        }
        write(0.13, fade, false);
      }
    }
    // attacks
    for (const a of ATTACKS) {
      const d = t - a.s;
      if (d < 0 || d >= A_TRAVEL || tr >= MAX_TRAILS) continue;
      for (let k = 0; k < TRAIL_PTS; k++) {
        const dk = Math.max(0, d - (k / (TRAIL_PTS - 1)) * TRAIL_SPAN * 0.8);
        attackPoint(a.j, Math.pow(dk / A_TRAVEL, 1.6), pts[k]);
        cols[k].copy(RED);
      }
      write(0.17, d < 0.2 ? d / 0.2 : 1, true);
    }
    // park unused trails
    for (let v = tr * TRAIL_PTS * 2; v < MAX_TRAILS * TRAIL_PTS * 2; v++) WD[v] = 0;
    ['position', 'prev', 'next', 'width', 'color'].forEach((k) => (attr[k].needsUpdate = true));
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
}

/* ---------- shield + attacks ---------- */
// honeycomb sized to the gate: between the pillars' inner faces, floor to lintel
const HEX_R = 0.105;
const CELLS = (() => {
  const out = [];
  const zMin = -0.88, zMax = 0.88, yMin = 0.14, yMax = 3.62;
  const dz = HEX_R * Math.sqrt(3), dy = HEX_R * 1.5;
  for (let row = 0; yMin + row * dy <= yMax; row++) {
    const y = yMin + row * dy;
    for (let c = 0; ; c++) {
      const z = zMin + c * dz + (row % 2) * dz / 2;
      if (z > zMax) break;
      out.push([SHIELD_X, y, z]);
    }
  }
  return out;
})();
const HITS = ATTACKS.map((a) => {
  const p = attackPoint(a.j, 1, new THREE.Vector3());
  return { at: a.s + A_TRAVEL, p };
});

function Shield({ timeRef }) {
  const ring = useRef();
  const fill = useRef();
  const col = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    CELLS.forEach((c, i) => {
      o3.position.set(c[0], c[1], c[2]);
      o3.rotation.set(0, -Math.PI / 2, 0);
      o3.scale.setScalar(1);
      o3.updateMatrix();
      ring.current.setMatrixAt(i, o3.matrix);
      fill.current.setMatrixAt(i, o3.matrix);
      ring.current.setColorAt(i, col.setRGB(0, 0, 0));
      fill.current.setColorAt(i, col.setRGB(0, 0, 0));
    });
  }, [col]);
  useFrame(() => {
    const t = timeRef.current;
    const up = S.shield(t);
    ring.current.visible = fill.current.visible = up > 0.001;
    if (up <= 0.001) return;
    CELLS.forEach((c, i) => {
      // cells light up bottom-to-top when the shield rises
      const reveal = clamp01(up * 1.6 - (c[1] / 3.4) * 0.6);
      let heat = 0;
      for (const h of HITS) {
        const d = t - h.at;
        if (d >= 0 && d < 0.7) {
          const dist = Math.hypot(c[1] - h.p.y, c[2] - h.p.z);
          heat = Math.max(heat, (1 - d / 0.7) * clamp01(1 - dist / 0.5));
        }
      }
      col.setRGB(0.16, 0.2, 0.85).multiplyScalar(reveal).lerp(RED, heat);
      ring.current.setColorAt(i, col);
      fill.current.setColorAt(i, col.clone().multiplyScalar(0.1 + heat * 0.5));
    });
    ring.current.instanceColor.needsUpdate = true;
    fill.current.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={ring} args={[null, null, CELLS.length]} frustumCulled={false}>
        <ringGeometry args={[HEX_R * 0.84, HEX_R * 0.97, 6, 1]} />
        <meshBasicMaterial toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={fill} args={[null, null, CELLS.length]} frustumCulled={false}>
        <circleGeometry args={[HEX_R * 0.84, 6]} />
        <meshBasicMaterial toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

function Attacks({ timeRef }) {
  const bolts = useRef();
  const shards = useRef();
  const SH = 12;
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.5, 1, 4, 10);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  useLayoutEffect(() => {
    for (let i = 0; i < ATTACKS.length; i++) bolts.current.setColorAt(i, RED);
    for (let i = 0; i < ATTACKS.length * SH; i++) shards.current.setColorAt(i, RED);
  }, []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(({ camera }) => {
    const t = timeRef.current;
    ATTACKS.forEach((a, j) => {
      const d = t - a.s;
      if (d >= 0 && d < A_TRAVEL) {
        const u = Math.pow(d / A_TRAVEL, 1.6);
        attackPoint(a.j, Math.min(u, 0.999), vA);
        attackPoint(a.j, Math.min(u + 0.01, 1), vB);
        placeAlong(bolts.current, j, vA, vB, 0.12, 0.05);
        // like the light trails, a bolt only shows once it is past the headline
        bolts.current.localToWorld(ndc.copy(vA)).project(camera);
        const x = clamp01((ndc.x - VIEW.fadeFrom) / 0.35);
        bolts.current.setColorAt(j, col.copy(RED).multiplyScalar(x * x * (3 - 2 * x)));
      } else {
        o3.scale.setScalar(0); o3.updateMatrix(); bolts.current.setMatrixAt(j, o3.matrix);
      }
      const h = d - A_TRAVEL;
      for (let k = 0; k < SH; k++) {
        const idx = j * SH + k;
        if (h >= 0 && h < 0.9) {
          const p = HITS[j].p;
          const th = rnd(j * 31 + k, 41) * Math.PI * 2;
          const sp = 1.2 + rnd(j * 31 + k, 42) * 2.4;
          o3.position.set(
            p.x - (0.4 + rnd(j * 31 + k, 43)) * h * sp * 0.8,
            p.y + Math.sin(th) * h * sp * 0.7 - 2.2 * h * h,
            p.z + Math.cos(th) * h * sp * 0.7,
          );
          o3.rotation.set(th + h * 9, h * 7, k);
          o3.scale.setScalar(0.018 * (1 - h / 0.9));
        } else {
          o3.scale.setScalar(0);
        }
        o3.updateMatrix();
        shards.current.setMatrixAt(idx, o3.matrix);
      }
    });
    bolts.current.instanceMatrix.needsUpdate = true;
    bolts.current.instanceColor.needsUpdate = true;
    shards.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={bolts} args={[geo, null, ATTACKS.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={shards} args={[null, null, ATTACKS.length * SH]} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ---------- gate crossings: the portal brightens as requests pass ---------- */
const GATE_FLASH = { value: 0 }; // read by the portal field
function GateBursts({ timeRef }) {
  useFrame(() => {
    const t = timeRef.current;
    let flash = 0;
    for (const p of PACKETS) {
      for (const s of [p.s, p.s - LOOP]) {
        const d = t - (s + T_IN + T_GATE * 0.5);
        if (d >= 0 && d < 0.25) flash = Math.max(flash, 1 - d / 0.25);
      }
    }
    GATE_FLASH.value += (flash - GATE_FLASH.value) * 0.25; // smoothed — no flicker
  });
  return null;
}

/* ---------- Shield impacts: cracked glass, sparks, a flash of light ---------- */

function AttackImpacts({ timeRef }) {
  const cracks = useRef([]);
  const sparks = useRef();
  const light = useRef();
  const tex = useMemo(() => crackTexture(), []);
  const SP = 6;
  const col = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    for (let i = 0; i < ATTACKS.length * SP; i++) sparks.current.setColorAt(i, col.setRGB(0, 0, 0));
  }, [col]);
  useFrame(() => {
    const t = timeRef.current;
    let flash = 0, at = null;
    HITS.forEach((h, j) => {
      const d = t - h.at;
      const m = cracks.current[j];
      if (m) {
        const on = d >= 0 && d < 1.3;
        m.parent.visible = on;
        if (on) {
          m.material.opacity = Math.pow(1 - d / 1.3, 1.5);
          m.parent.scale.setScalar(0.35 + Math.min(d, 0.08) * 3);
        }
      }
      if (d >= 0 && d < 0.35 && 1 - d / 0.35 > flash) { flash = 1 - d / 0.35; at = h.p; }
      for (let k = 0; k < SP; k++) {
        const idx = j * SP + k;
        if (d >= 0 && d < 0.75) {
          const th = rnd(j * 97 + k, 71) * Math.PI * 2;
          const up = rnd(j * 97 + k, 72);
          const sp = 2.2 + rnd(j * 97 + k, 73) * 3.4;
          const vx = -(0.5 + rnd(j * 97 + k, 74)) * sp * 0.6;
          const vy = (up * 1.4 - 0.2) * sp;
          const vz = Math.cos(th) * sp * 0.7;
          const y = Math.max(0.02, h.p.y + vy * d - 4.9 * d * d);
          vA.set(h.p.x + vx * d, y, h.p.z + vz * d);
          vB.set(vA.x - vx * 0.03, vA.y - (vy - 9.8 * d) * 0.03, vA.z - vz * 0.03);
          placeAlong(sparks.current, idx, vA, vB, 0.06, 0.012);
          const life = 1 - d / 0.75;
          sparks.current.setColorAt(idx, col.setRGB(2.6, 0.5 + life * 0.5, 0.6 + life * 0.4).multiplyScalar(life * 0.7)); // red, not a firework
        } else {
          o3.scale.setScalar(0); o3.updateMatrix(); sparks.current.setMatrixAt(idx, o3.matrix);
        }
      }
    });
    sparks.current.instanceMatrix.needsUpdate = true;
    sparks.current.instanceColor.needsUpdate = true;
    if (light.current) {
      light.current.intensity = flash * 9;
      if (at) light.current.position.set(at.x - 0.3, at.y, at.z);
    }
  });
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.5, 1, 2, 6);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      {HITS.map((h, j) => (
        <Billboard key={j} position={[h.p.x - 0.04, h.p.y, h.p.z]} visible={false}>
          <mesh ref={(m) => (cracks.current[j] = m)}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={tex} transparent toneMapped={false} blending={THREE.AdditiveBlending} depthWrite />
          </mesh>
        </Billboard>
      ))}
      <instancedMesh ref={sparks} args={[geo, null, ATTACKS.length * SP]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <pointLight ref={light} color="#ff5a6e" distance={5} decay={2} intensity={0} />
    </group>
  );
}

/* ---------- service racks ---------- */
// real PBR materials for the cabinets (ambientCG, CC0): black powder-coated
// steel, round-hole perforated door sheet, brushed steel for hardware
function useRackKit() {
  const t = useTexture({
    rc: '/hero3d/rack_color.webp', rn: '/hero3d/rack_normal.webp', rr: '/hero3d/rack_rough.webp',
    dop: '/hero3d/door_opacity.webp', dn: '/hero3d/door_normal.webp', dr: '/hero3d/door_rough.webp',
    sc: '/hero3d/steel_color.webp', sr: '/hero3d/steel_rough.webp',
  });
  return useMemo(() => {
    const rep = (tex, x, y, srgb = false) => {
      const c = tex.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(x, y);
      c.anisotropy = 8;
      c.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      c.needsUpdate = true;
      return c;
    };
    const powder = new THREE.MeshPhysicalMaterial({
      color: '#4a4f5c', map: rep(t.rc, 2, 4, true), normalMap: rep(t.rn, 2, 4), normalScale: new THREE.Vector2(0.5, 0.5),
      roughnessMap: rep(t.rr, 2, 4), roughness: 1, metalness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5,
    });
    const door = new THREE.MeshStandardMaterial({
      // blended (mipmapped) alpha, not alpha-test: at a distance the holes average out like a
      // real perforated door instead of aliasing into moiré
      color: '#262a33', alphaMap: rep(t.dop, 3, 7.5), transparent: true, opacity: 1, normalMap: rep(t.dn, 3, 7.5),
      normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: rep(t.dr, 3, 7.5), roughness: 1, metalness: 0.75, side: THREE.DoubleSide,
    });
    const steel = new THREE.MeshStandardMaterial({ color: '#c7ccd6', map: rep(t.sc, 1, 1, true), roughnessMap: rep(t.sr, 1, 1), roughness: 1, metalness: 1 });
    const void_ = new THREE.MeshStandardMaterial({ color: '#030305', roughness: 1, metalness: 0 });
    const plastic = new THREE.MeshStandardMaterial({ color: '#0b0c10', roughness: 0.45, metalness: 0.1 });
    return { powder, door, steel, void: void_, plastic };
  }, [t]);
}

// the cabinet's static parts, merged per material (4 draw calls instead of ~30 per rack)
let RACK_GEO = null;
function rackGeometry() {
  if (RACK_GEO) return RACK_GEO;
  const parts = { powder: [], void: [], steel: [], plastic: [] };
  const add = (mat, g, [x, y, z], rot) => {
    if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rot)));
    g.translate(x, y, z);
    parts[mat].push(g);
  };
  const box = (mat, w, h, d, pos, rot) => add(mat, new THREE.BoxGeometry(w, h, d), pos, rot);
  const cyl = (mat, r1, r2, h, seg, pos, rot) => add(mat, new THREE.CylinderGeometry(r1, r2, h, seg), pos, rot);
  // plinth + levelling feet
  box('powder', 0.98, 0.08, 1.03, [0, 0.09, 0]);
  [[-0.42, -0.45], [-0.42, 0.45], [0.42, -0.45], [0.42, 0.45]].forEach(([x, z]) => cyl('steel', 0.022, 0.026, 0.05, 12, [x, 0.025, z]));
  // side panels with a split seam, rear, roof with vent slots and a cable brush
  [-0.515, 0.515].forEach((z) => {
    box('powder', 0.98, 2.58, 0.02, [0, 1.42, z]);
    [0.95, 1.9].forEach((y) => box('void', 0.98, 0.006, 0.021, [0, y, z * 1.002]));
  });
  box('powder', 0.02, 2.58, 1.01, [0.48, 1.42, 0]);
  box('powder', 1.0, 0.05, 1.05, [0, 2.735, 0]);
  [-0.25, 0, 0.25].forEach((z) => box('void', 0.42, 0.004, 0.05, [0.15, 2.762, z]));
  box('plastic', 0.12, 0.012, 0.28, [-0.2, 2.765, 0]);
  // dark interior, 19-inch rails
  box('void', 0.84, 2.5, 0.98, [0.05, 1.42, 0]);
  [-0.455, 0.455].forEach((z) => box('steel', 0.02, 2.36, 0.03, [-0.415, 1.33, z]));
  // front frame, door stiles/rails, handle + lock, hinges
  box('powder', 0.04, 0.09, 1.05, [-0.49, 2.665, 0]);
  box('powder', 0.04, 0.07, 1.05, [-0.49, 0.165, 0]);
  box('powder', 0.016, 0.05, 0.98, [-0.513, 2.555, 0]);
  box('powder', 0.016, 0.05, 0.98, [-0.513, 0.225, 0]);
  [-0.475, 0.475].forEach((z) => box('powder', 0.016, 2.36, 0.03, [-0.513, 1.39, z]));
  box('steel', 0.025, 0.24, 0.028, [-0.535, 1.32, 0.42]);
  cyl('plastic', 0.011, 0.011, 0.012, 16, [-0.548, 1.47, 0.42], [0, 0, Math.PI / 2]);
  [0.45, 2.3].forEach((y) => box('steel', 0.02, 0.09, 0.02, [-0.522, y, -0.49]));
  RACK_GEO = Object.fromEntries(Object.entries(parts).map(([k, arr]) => [k, mergeGeometries(arr, false)]));
  return RACK_GEO;
}

function Rack({ id, timeRef, kit }) {
  const group = useRef();
  const face = useRef();
  const strip = useRef();
  const status = useRef();
  const light = useRef();
  const sign = useRef();
  const base = RACKS[id];
  const signTex = useMemo(() => [signTexture(base.label, SIGN_COLORS[id], false), signTexture(base.label, SIGN_COLORS[id], true)], [id, base.label]);
  const { rackMap, rackEmit } = textures();
  const geo = rackGeometry();
  const tmp = useMemo(() => new THREE.Color(), []);
  const white = useMemo(() => new THREE.Color(1, 1, 1), []);
  useFrame(() => {
    const t = timeRef.current;
    let pos = base.pos, rise = 1, vis = 1;
    if (id === 'payNew') {
      if (!S.rollout(t)) vis = 0;
      rise = S.payNewRise(t);
      pos = payNewPos(t);
    }
    if (id === 'pay' && S.rollout(t)) {
      rise = 1 - S.payOldSink(t);
      if (t >= 14.95) rise = 1;
    }
    if (id === 'pay' && t >= 14.4 && t < 14.95) vis = 0;
    group.current.visible = vis > 0 && rise > 0.01;
    group.current.position.set(pos[0], (rise - 1) * 2.75, pos[2]);
    group.current.rotation.y = RACK_YAW;

    let flash = 0;
    for (const p of PACKETS) {
      for (const s of [p.s, p.s - LOOP]) {
        const d = t - (s + T_ALL);
        if (d >= 0 && d < 0.45 && destOf(p, s + T_IN) === id) flash = Math.max(flash, 1 - d / 0.45);
      }
    }
    const health = id === 'usersA' ? S.usersAHealth(t) : 1;
    const alarm = health < 0.9 ? (Math.sin(t * 10) > 0 ? 1 : 0.35) : 0;
    if (face.current) {
      face.current.emissive.copy(white).lerp(RED, (1 - health) * 0.85);
      face.current.emissiveIntensity = (1.6 + flash * 1.6) * (0.25 + 0.75 * health) + alarm * (1 - health) * 1.5;
    }
    tmp.copy(health < 0.5 ? RED : base.color).multiplyScalar(0.7 + flash * 1.3 + (health < 0.5 ? alarm : 0));
    if (strip.current) strip.current.color.copy(tmp);
    if (status.current) status.current.color.copy(tmp);
    if (light.current) {
      light.current.color.copy(health < 0.5 ? RED : base.color).multiplyScalar(0.3);
      light.current.intensity = (0.8 + flash * 2.5) * (group.current.visible ? 1 : 0);
    }
    if (sign.current) {
      const want = health < 0.5 ? signTex[1] : signTex[0];
      if (sign.current.map !== want) { sign.current.map = want; sign.current.needsUpdate = true; }
      sign.current.color.setScalar(1.25 + flash * 0.5);
    }
  });
  return (
    <group ref={group} position={base.pos}>
      {/* the cabinet: powder-coated body, interior, steel hardware, plastic parts (merged) */}
      <mesh geometry={geo.powder} material={kit.powder} />
      <mesh geometry={geo.void} material={kit.void} />
      <mesh geometry={geo.steel} material={kit.steel} />
      <mesh geometry={geo.plastic} material={kit.plastic} />
      {/* the servers, recessed behind the door */}
      <mesh position={[-0.405, 1.33, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.88, 2.3]} />
        <meshStandardMaterial ref={face} map={rackMap} bumpMap={rackMap} bumpScale={3} emissiveMap={rackEmit} emissive="#ffffff" emissiveIntensity={1.6} metalness={0.45} roughness={0.5} toneMapped={false} />
      </mesh>
      {/* perforated door sheet */}
      <mesh material={kit.door} position={[-0.51, 1.39, 0]} rotation-y={-Math.PI / 2}><planeGeometry args={[0.94, 2.36]} /></mesh>
      {/* service-coloured light bar on the door edge + roof status */}
      <mesh position={[-0.523, 1.39, -0.457]}>
        <boxGeometry args={[0.006, 2.2, 0.01]} />
        <meshBasicMaterial ref={strip} toneMapped={false} />
      </mesh>
      <mesh position={[-0.505, 2.72, 0]}>
        <boxGeometry args={[0.012, 0.012, 0.9]} />
        <meshBasicMaterial ref={status} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[-1.0, 1.4, 0]} distance={3.2} intensity={1} />
      {/* lit header panel on the door: the rack's name + state */}
      <mesh position={[-0.535, 2.57, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.9, 0.22]} />
        <meshBasicMaterial ref={sign} map={signTex[0]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Racks({ timeRef }) {
  const kit = useRackKit();
  return (
    <group>
      {Object.keys(RACKS).map((id) => <Rack key={id} id={id} timeRef={timeRef} kit={kit} />)}
    </group>
  );
}

/* ---------- live xDS push: beam from the control plane ---------- */
function XdsBeam({ timeRef }) {
  const beam = useRef();
  const ring = useRef();
  useFrame(() => {
    const t = timeRef.current;
    const b = S.beam(t);
    beam.current.visible = b > 0.001;
    beam.current.scale.set(1 + b * 0.5, b, 1 + b * 0.5);
    beam.current.material.opacity = b;
    const r = ramp(t, 10.7, 11.9);
    ring.current.visible = r > 0 && r < 1;
    ring.current.scale.setScalar(0.3 + r * 3.2);
    ring.current.material.opacity = (1 - r) * 0.9;
  });
  return (
    <group position={[GATE_X, 0, 0]}>
      <mesh ref={beam} position={[0, 4.75 + 6, 0]}>
        <cylinderGeometry args={[0.03, 0.06, 12, 16, 1, true]} />
        <meshBasicMaterial color={[0.4, 3, 1.6]} transparent toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring} position={[0, 4.75, 0]} rotation-y={EMBLEM_YAW}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial color={[0.4, 3, 1.6]} transparent toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------- API discovery constellation ---------- */
const NODES = [
  { id: 'api', label: '/api', p: [2.3, 4.15, 0.9], parent: null, at: 15.3 },
  { id: 'orders', label: '/orders', p: [2.2, 4.95, 2.4], parent: 'api', at: 15.8 },
  { id: 'oid', label: '/orders/{id}', p: [3.1, 5.65, 3.0], parent: 'orders', at: 16.3 },
  { id: 'users', label: '/users/{id}', p: [3.8, 4.45, 2.6], parent: 'api', at: 16.8 },
  { id: 'prefs', label: '/users/{id}/prefs', p: [4.8, 5.05, 3.2], parent: 'users', at: 17.3 },
  { id: 'pay', label: '/payments', p: [5.5, 3.95, 3.0], parent: 'api', at: 17.8 },
  { id: 'status', label: '/payments/{id}', p: [6.4, 4.55, 3.8], parent: 'pay', at: 18.3 },
];
const EMBLEM_PT = [GATE_X, 4.75, 0];

function Discovery({ timeRef }) {
  const group = useRef();
  const dots = useRef([]);
  const lines = useRef([]);
  const labels = useRef([]);
  const holo = useMemo(() => NODES.map((n) => holoTexture(n.label)), []);
  const lineGeos = useMemo(() => NODES.map((n) => {
    const from = n.parent ? NODES.find((m) => m.id === n.parent).p : EMBLEM_PT;
    return new THREE.BufferGeometry().setFromPoints([v3(from), v3(n.p)]);
  }), []);
  useFrame(() => {
    const t = timeRef.current;
    const fade = S.discover(t);
    group.current.visible = fade > 0.001;
    if (!group.current.visible) {
      labels.current.forEach((m) => m && (m.opacity = 0));
      return;
    }
    NODES.forEach((n, i) => {
      const k = smooth(ramp(t, n.at, n.at + 0.35)) * fade;
      const isNew = 1 - ramp(t, n.at, n.at + 1.2);
      const from = n.parent ? NODES.find((m) => m.id === n.parent).p : EMBLEM_PT;
      const pos = lineGeos[i].attributes.position;
      const lk = smooth(ramp(t, n.at - 0.3, n.at + 0.1));
      pos.setXYZ(1, from[0] + (n.p[0] - from[0]) * lk, from[1] + (n.p[1] - from[1]) * lk, from[2] + (n.p[2] - from[2]) * lk);
      pos.needsUpdate = true;
      if (lines.current[i]) lines.current[i].opacity = 0.55 * fade * (lk > 0 ? 1 : 0);
      if (dots.current[i]) {
        dots.current[i].scale.setScalar(k * (1 + isNew * 1.4));
        dots.current[i].material.color.setRGB(1.4 + isNew * 1.6, 1.5 + isNew * 1.5, 3.2);
      }
      if (labels.current[i]) labels.current[i].opacity = k * (0.85 + 0.15 * Math.sin(t * 7 + i));
    });
  });
  return (
    <group ref={group}>
      {NODES.map((n, i) => (
        <group key={n.id}>
          <line geometry={lineGeos[i]}>
            <lineBasicMaterial ref={(m) => (lines.current[i] = m)} color={[0.7, 0.75, 2.2]} transparent toneMapped={false} depthWrite={false} />
          </line>
          <mesh ref={(m) => (dots.current[i] = m)} position={n.p}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial toneMapped={false} />
          </mesh>
          <Billboard position={n.p}>
            <mesh position={[0.95, 0, 0]}>
              <planeGeometry args={[1.7, 0.266]} />
              <meshBasicMaterial ref={(m) => (labels.current[i] = m)} map={holo[i]} transparent opacity={0} toneMapped={false} depthWrite blending={THREE.AdditiveBlending} />
            </mesh>
          </Billboard>
        </group>
      ))}
    </group>
  );
}
