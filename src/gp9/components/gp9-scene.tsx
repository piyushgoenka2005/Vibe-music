"use client";

/**
 * GP-9 3D scene — consolidated React Three Fiber showroom (code-split chunk).
 */
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerformanceMonitor,
  useGLTF,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { AmbientLight, DirectionalLight, Group, MeshStandardMaterial } from "three";
import {
  buildMeshRegistry,
  getKeyPressOffset,
  getCameraPreset,
  getEnvironmentHdrPath,
  getFinish,
  getPerformanceMode,
  GP9_GRAND_GLB_PATH,
  isBlackKey,
  PIANO_KEYS,
  whiteKeyIndex,
  type Gp9CameraPresetId,
  type Gp9FinishId,
  type Gp9PerformanceModeId,
  type Gp9SceneChoreography,
} from "@/gp9/lib/gp9-runtime";

// ============================================================================
// MODEL ERROR BOUNDARY
// ============================================================================

type ModelErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type State = { hasError: boolean };

export class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ============================================================================
// PIANO MODEL (PROCEDURAL)
// ============================================================================

export type PianoModelProps = {
  lidOpen: number;
  activeNotes?: Set<number>;
  performanceModeId?: Gp9PerformanceModeId;
  finishId?: Gp9FinishId;
  sustain?: boolean;
  softPedal?: boolean;
  sostenuto?: boolean;
  playingBoost?: number;
};

const IVORY = "#f0ebe3";
const KEYBOARD_WIDTH = 6.2;
const KEYBOARD_Y = 0.68;
const KEYBOARD_Z = 0.35;
const WHITE_DEPTH = 0.5;
const BLACK_DEPTH = 0.3;

type Key3DProps = {
  black: boolean;
  x: number;
  width: number;
  active: boolean;
  emissive: string;
  emissiveIntensity: number;
};

function Key3D({ black, x, width, active, emissive, emissiveIntensity }: Key3DProps) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const pressRef = useRef(0);

  useFrame((_, delta) => {
    const target = active ? 1 : 0;
    pressRef.current += (target - pressRef.current) * Math.min(1, delta * 14);
    const press = pressRef.current;

    if (groupRef.current) {
      groupRef.current.position.y = KEYBOARD_Y + 0.02 - press * (black ? 0.022 : 0.018);
      groupRef.current.rotation.x = press * (black ? 0.04 : 0.03);
    }

    if (matRef.current) {
      matRef.current.emissiveIntensity = emissiveIntensity * press;
    }
  });

  const height = black ? 0.038 : 0.048;
  const z = black ? KEYBOARD_Z + 0.02 : KEYBOARD_Z;
  const depth = black ? BLACK_DEPTH : WHITE_DEPTH;

  return (
    <group ref={groupRef} position={[x, KEYBOARD_Y + 0.02, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width * 0.92, height, depth]} />
        <meshStandardMaterial
          ref={matRef}
          color={black ? "#111" : IVORY}
          emissive={emissive}
          emissiveIntensity={0}
          metalness={black ? 0.15 : 0.08}
          roughness={black ? 0.5 : 0.58}
        />
      </mesh>
    </group>
  );
}

function Pedal3D({
  x,
  pressed,
  accent,
}: {
  x: number;
  pressed: boolean;
  accent: string;
}) {
  const ref = useRef<Group>(null);
  const pressRef = useRef(0);

  useFrame((_, delta) => {
    const target = pressed ? 1 : 0;
    pressRef.current += (target - pressRef.current) * Math.min(1, delta * 10);
    if (ref.current) {
      ref.current.rotation.x = pressRef.current * 0.22;
      ref.current.position.y = -0.02 - pressRef.current * 0.025;
    }
  });

  return (
    <group ref={ref} position={[x, 0.02, 0.72]}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.04, 0.5]} />
        <meshStandardMaterial
          color="#1a1a1a"
          emissive={accent}
          emissiveIntensity={pressed ? 0.25 : 0}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

export function PianoModel({
  lidOpen,
  activeNotes,
  performanceModeId = "recital",
  finishId = "polished_ebony",
  sustain = false,
  softPedal = false,
  sostenuto = false,
  playingBoost = 0,
}: PianoModelProps) {
  const lidRef = useRef<Group>(null);
  const bodyMatRef = useRef<MeshStandardMaterial>(null);
  const targetLid = useRef(-1.15);

  const finish = getFinish(finishId);
  const mode = getPerformanceMode(performanceModeId);
  const { accent, activeKeyEmissive } = mode.lighting;

  const lidAngle = -1.15 * Math.max(0, Math.min(1, lidOpen));
  targetLid.current = lidAngle;

  const { whiteKeys, blackKeys, whiteWidth } = useMemo(() => {
    const whites = PIANO_KEYS.filter((k) => !k.black);
    const blacks = PIANO_KEYS.filter((k) => k.black);
    const wWidth = KEYBOARD_WIDTH / whites.length;
    return { whiteKeys: whites, blackKeys: blacks, whiteWidth: wWidth };
  }, []);

  const startX = -KEYBOARD_WIDTH / 2;

  useFrame((_, delta) => {
    if (lidRef.current) {
      const current = lidRef.current.rotation.x;
      lidRef.current.rotation.x =
        current + (targetLid.current - current) * Math.min(1, delta * 4);
    }
    if (bodyMatRef.current) {
      const target = playingBoost * 0.18;
      bodyMatRef.current.emissiveIntensity +=
        (target - bodyMatRef.current.emissiveIntensity) * Math.min(1, delta * 4);
    }
  });

  return (
    <group position={[0, -0.6, 0]} scale={1.1}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.55, 1.6]} />
        <meshStandardMaterial
          ref={bodyMatRef}
          color={finish.body}
          emissive={accent}
          emissiveIntensity={0}
          metalness={finish.metalness}
          roughness={finish.roughness}
        />
      </mesh>

      <mesh position={[0, 0.62, 0.55]} castShadow>
        <boxGeometry args={[4.2, 0.12, 0.5]} />
        <meshStandardMaterial
          color={finish.bodyLight}
          metalness={finish.metalness + 0.05}
          roughness={finish.roughness - 0.05}
        />
      </mesh>

      <mesh position={[0, KEYBOARD_Y - 0.01, KEYBOARD_Z]} castShadow receiveShadow>
        <boxGeometry args={[KEYBOARD_WIDTH + 0.08, 0.03, WHITE_DEPTH + 0.06]} />
        <meshStandardMaterial color="#1a1814" metalness={0.2} roughness={0.7} />
      </mesh>

      {whiteKeys.map((key) => {
        const idx = whiteKeyIndex(key.midi);
        const x = startX + idx * whiteWidth + whiteWidth / 2;
        return (
          <Key3D
            key={key.midi}
            black={false}
            x={x}
            width={whiteWidth}
            active={activeNotes?.has(key.midi) ?? false}
            emissive={accent}
            emissiveIntensity={activeKeyEmissive}
          />
        );
      })}

      {blackKeys.map((key) => {
        const idx = whiteKeyIndex(key.midi);
        const x = startX + (idx + 0.65) * whiteWidth;
        return (
          <Key3D
            key={key.midi}
            black
            x={x}
            width={whiteWidth * 0.58}
            active={activeNotes?.has(key.midi) ?? false}
            emissive={accent}
            emissiveIntensity={activeKeyEmissive * 1.2}
          />
        );
      })}

      <group ref={lidRef} position={[0, 0.62, -0.35]}>
        <mesh position={[0, 0.08, 0.45]} castShadow>
          <boxGeometry args={[4.3, 0.08, 1.35]} />
          <meshStandardMaterial
            color={finish.body}
            metalness={finish.metalness + 0.1}
            roughness={finish.roughness - 0.08}
          />
        </mesh>
        <mesh position={[0, 0.22, 0.1]} castShadow>
          <boxGeometry args={[2.8, 0.02, 0.9]} />
          <meshStandardMaterial color={finish.bodyLight} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {[
        [-1.2, -0.05, 0.5],
        [1.2, -0.05, 0.5],
        [-1.2, -0.05, -0.5],
        [1.2, -0.05, -0.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
          <meshStandardMaterial color={finish.body} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      <mesh position={[0, 0.95, -0.15]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[1.4, 0.03, 0.5]} />
        <meshStandardMaterial color={finish.bodyLight} metalness={0.35} roughness={0.45} />
      </mesh>

      <group position={[0, 0.08, 0.85]}>
        <Pedal3D x={-0.35} pressed={softPedal} accent={accent} />
        <Pedal3D x={0} pressed={sustain} accent={accent} />
        <Pedal3D x={0.35} pressed={sostenuto} accent={accent} />
      </group>
    </group>
  );
}

/** @deprecated use PianoModel — kept for GLB fallback import alias */
export { PianoModel as PianoModelProcedural };

// ============================================================================
// PIANO MODEL (GLB)
// ============================================================================

const restTransforms = new WeakMap<
  THREE.Object3D,
  { position: THREE.Vector3; rotation: THREE.Euler }
>();

function cacheRestTransform(obj: THREE.Object3D) {
  if (!restTransforms.has(obj)) {
    restTransforms.set(obj, {
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
    });
  }
}

export function PianoModelGlb(props: PianoModelProps) {
  const { scene } = useGLTF(GP9_GRAND_GLB_PATH);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const registry = useMemo(() => buildMeshRegistry(cloned), [cloned]);

  const lidRef = useRef(props.lidOpen);
  const sustainRef = useRef(props.sustain);
  const softRef = useRef(props.softPedal);
  const sostenutoRef = useRef(props.sostenuto);
  const activeRef = useRef(props.activeNotes);
  const boostRef = useRef(props.playingBoost ?? 0);

  lidRef.current = props.lidOpen;
  sustainRef.current = props.sustain ?? false;
  softRef.current = props.softPedal ?? false;
  sostenutoRef.current = props.sostenuto ?? false;
  activeRef.current = props.activeNotes;
  boostRef.current = props.playingBoost ?? 0;

  useEffect(() => {
    registry.keys.forEach((obj) => cacheRestTransform(obj));
    if (registry.lid) cacheRestTransform(registry.lid);
    [registry.pedalSustain, registry.pedalSoft, registry.pedalSostenuto].forEach((p) => {
      if (p) cacheRestTransform(p);
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.8 / maxDim : 1;
    cloned.scale.setScalar(scale);
    cloned.position.set(-box.getCenter(new THREE.Vector3()).multiplyScalar(scale).x, -0.55, 0);
  }, [cloned, registry]);

  useFrame((_, delta) => {
    const lerp = Math.min(1, delta * 8);
    const notes = activeRef.current;
    const lidOpen = lidRef.current;

    registry.keys.forEach((obj, midi) => {
      const rest = restTransforms.get(obj);
      if (!rest) return;
      const active = notes?.has(midi) ?? false;
      const { y, rotX } = getKeyPressOffset(isBlackKey(midi));
      const press = active ? 1 : 0;
      obj.position.y = rest.position.y + y * press;
      obj.rotation.x = rest.rotation.x + rotX * press;
    });

    if (registry.lid) {
      const rest = restTransforms.get(registry.lid);
      if (rest) {
        const target = -0.85 * Math.max(0, Math.min(1, lidOpen));
        registry.lid.rotation.x = rest.rotation.x + (target - registry.lid.rotation.x) * lerp;
      }
    }

    const pedalMap: [THREE.Object3D | null, boolean][] = [
      [registry.pedalSoft, softRef.current ?? false],
      [registry.pedalSustain, sustainRef.current ?? false],
      [registry.pedalSostenuto, sostenutoRef.current ?? false],
    ];

    for (const [pedal, pressed] of pedalMap) {
      if (!pedal) continue;
      const rest = restTransforms.get(pedal);
      if (!rest) continue;
      const target = pressed ? 0.18 : 0;
      pedal.rotation.x = rest.rotation.x + (target - pedal.rotation.x) * lerp;
    }
  });

  return <primitive object={cloned} />;
}

useGLTF.preload(GP9_GRAND_GLB_PATH);

// ============================================================================
// PIANO MODEL UNIFIED
// ============================================================================

const USE_GLB = process.env.NEXT_PUBLIC_GP9_GLB !== "0";

function ProceduralFallback(props: PianoModelProps) {
  return <PianoModel {...props} />;
}

export function PianoModelUnified(props: PianoModelProps) {
  if (!USE_GLB) return <ProceduralFallback {...props} />;

  return (
    <ModelErrorBoundary fallback={<ProceduralFallback {...props} />}>
      <Suspense fallback={<ProceduralFallback {...props} />}>
        <PianoModelGlb {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// ============================================================================
// SHOWROOM CAMERA
// ============================================================================

const CAMERA_BLEND_TAU = 1.2;

type ShowroomCameraProps = {
  preset: Gp9CameraPresetId;
  performanceModeId?: Gp9PerformanceModeId;
  choreography?: Gp9SceneChoreography;
  enableOrbit?: boolean;
};

export function ShowroomCameraRig({
  preset,
  performanceModeId = "recital",
  choreography = "static",
  enableOrbit = true,
}: ShowroomCameraProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const orbitPhase = useRef(0);
  const orbitEnabled = useRef(preset === "orbit" && enableOrbit);

  useEffect(() => {
    orbitEnabled.current = preset === "orbit" && enableOrbit;
    const p = getCameraPreset(preset);
    desiredPos.current.set(...p.position);
    desiredTarget.current.set(...p.target);
    if (p.fov && camera instanceof THREE.PerspectiveCamera) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
  }, [preset, enableOrbit, camera, performanceModeId]);

  useFrame((_, delta) => {
    if (orbitEnabled.current && choreography !== "night-orbit") return;

    const smooth = 1 - Math.exp(-delta / (CAMERA_BLEND_TAU * 0.32));
    let px = desiredPos.current.x;
    let py = desiredPos.current.y;
    let pz = desiredPos.current.z;

    if (choreography === "night-orbit" && !orbitEnabled.current) {
      orbitPhase.current += delta * 0.1;
      const radius = 0.34;
      px += Math.sin(orbitPhase.current) * radius;
      pz += Math.cos(orbitPhase.current) * radius;
    }

    camera.position.lerp(new THREE.Vector3(px, py, pz), smooth);
    target.current.lerp(desiredTarget.current, smooth);
    camera.lookAt(target.current);
  });

  if (!enableOrbit || preset !== "orbit") return null;

  return (
    <OrbitControls
      enablePan={false}
      minDistance={2.8}
      maxDistance={9}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 0.2, 0]}
      enableDamping
      dampingFactor={0.06}
      autoRotate={choreography === "night-orbit"}
      autoRotateSpeed={0.42}
    />
  );
}

// ============================================================================
// SCENE CHOREOGRAPHY
// ============================================================================

function SceneChoreography({
  performanceModeId = "recital",
  choreography = "static",
  playingBoost = 0,
}: {
  performanceModeId?: Gp9PerformanceModeId;
  choreography?: Gp9SceneChoreography;
  playingBoost?: number;
}) {
  const rimRef = useRef<THREE.SpotLight>(null);
  const boostRef = useRef(playingBoost);
  boostRef.current = playingBoost;
  const accent = getPerformanceMode(performanceModeId).lighting.accent;

  useFrame((state) => {
    if (choreography !== "showcase-rim" || !rimRef.current) return;
    const angle = state.clock.elapsedTime * 0.48;
    const radius = 4.6;
    rimRef.current.position.set(
      Math.sin(angle) * radius,
      2.35 + Math.sin(angle * 2) * 0.12,
      Math.cos(angle) * radius
    );
    rimRef.current.intensity = 0.75 + boostRef.current * 0.85;
    rimRef.current.lookAt(0, 0.55, 0);
  });

  if (choreography !== "showcase-rim") return null;

  return (
    <spotLight
      ref={rimRef}
      angle={0.32}
      penumbra={0.92}
      intensity={0.75}
      color={accent}
      distance={14}
      castShadow={false}
    />
  );
}

export type ShowroomSceneState = {
  lidOpen: number;
  activeNotes?: Set<number>;
  performanceModeId?: Gp9PerformanceModeId;
  finishId?: Gp9FinishId;
  sustain?: boolean;
  softPedal?: boolean;
  sostenuto?: boolean;
  playingBoost?: number;
  cameraPreset?: Gp9CameraPresetId;
  enableOrbit?: boolean;
  showroomQuality?: "high" | "low";
};

// ============================================================================
// SHOWROOM EFFECTS
// ============================================================================

type ShowroomEffectsProps = {
  playingBoost?: number;
  performanceModeId?: Gp9PerformanceModeId;
  enabled?: boolean;
};

export function ShowroomEffects({
  playingBoost = 0,
  performanceModeId = "recital",
  enabled = true,
}: ShowroomEffectsProps) {
  if (!enabled) return null;

  const mode = getPerformanceMode(performanceModeId);
  const { postFx } = mode;
  const bloom =
    postFx.bloomIntensity + playingBoost * mode.lighting.playBoost * 0.38;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={postFx.bloomThreshold}
        luminanceSmoothing={postFx.bloomSmoothing}
        intensity={bloom}
        mipmapBlur
        levels={postFx.bloomLevels}
      />
      <Vignette
        eskil
        offset={postFx.vignetteOffset}
        darkness={postFx.vignetteDarkness + playingBoost * 0.1}
      />
    </EffectComposer>
  );
}

// ============================================================================
// SHOWROOM FLOOR
// ============================================================================

export function ShowroomFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.66, 0]} receiveShadow>
      <planeGeometry args={[24, 24]} />
      <MeshReflectorMaterial
        blur={[280, 120]}
        resolution={512}
        mixBlur={0.65}
        mixStrength={0.45}
        roughness={0.85}
        depthScale={0.9}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.25}
        color="#0a0a0c"
        metalness={0.35}
        mirror={0.55}
        mixContrast={1.1}
        reflectorOffset={0.01}
      />
    </mesh>
  );
}

// ============================================================================
// SHOWROOM PARTICLES
// ============================================================================

type ShowroomParticlesProps = {
  playingBoost?: number;
  performanceModeId?: Gp9PerformanceModeId;
};

export function ShowroomParticles({ playingBoost = 0, performanceModeId = "recital" }: ShowroomParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const boostRef = useRef(playingBoost);
  boostRef.current = playingBoost;

  const accent = getPerformanceMode(performanceModeId).lighting.accent;

  const { positions, velocities } = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      vel[i] = 0.2 + Math.random() * 0.6;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const boost = boostRef.current;
    const speedMul = 1 + boost * 2.5;

    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      y += velocities[i] * delta * speedMul * 0.35;
      if (y > 2.8) y = Math.random() * 0.2;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.12 + boost * 0.35;
    mat.size = 0.018 + boost * 0.012;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={accent}
        size={0.02}
        transparent
        opacity={0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================================================
// SHOWROOM SCENE
// ============================================================================

export type ShowroomSceneProps = {
  lidOpen: number | boolean;
  activeNotes?: Set<number>;
  performanceModeId?: Gp9PerformanceModeId;
  finishId?: Gp9FinishId;
  sustain?: boolean;
  softPedal?: boolean;
  sostenuto?: boolean;
  enableOrbit?: boolean;
  playingBoost?: number;
  cameraPreset?: Gp9CameraPresetId;
  quality?: "high" | "low";
  effectsEnabled?: boolean;
};

function normalizeLid(lidOpen: number | boolean) {
  if (typeof lidOpen === "boolean") return lidOpen ? 1 : 0;
  return Math.max(0, Math.min(1, lidOpen));
}

function PerformanceLights({
  performanceModeId,
  playingBoost = 0,
}: {
  performanceModeId: Gp9PerformanceModeId;
  playingBoost?: number;
}) {
  const ambientRef = useRef<AmbientLight>(null);
  const keyRef = useRef<DirectionalLight>(null);
  const fillRef = useRef<DirectionalLight>(null);
  const ambientTarget = useRef(0.4);
  const keyTarget = useRef(1.2);
  const fillTarget = useRef(0.35);
  const keyPos = useRef(new THREE.Vector3());
  const fillPos = useRef(new THREE.Vector3());
  const keyPosTarget = useRef(new THREE.Vector3());
  const fillPosTarget = useRef(new THREE.Vector3());

  const mode = getPerformanceMode(performanceModeId);
  const { lighting } = mode;

  useEffect(() => {
    ambientTarget.current = lighting.ambient + playingBoost * lighting.playBoost;
    keyTarget.current = lighting.keyLightIntensity + playingBoost * lighting.playBoost * 0.6;
    fillTarget.current = lighting.fillIntensity + playingBoost * lighting.playBoost * 0.4;
    keyPosTarget.current.set(...lighting.keyLightPosition);
    fillPosTarget.current.set(...lighting.fillPosition);
    keyPos.current.copy(keyPosTarget.current);
    fillPos.current.copy(fillPosTarget.current);
  }, [lighting, playingBoost, performanceModeId]);

  useFrame((_, delta) => {
    const lerp = Math.min(1, delta * 2.8);
    if (ambientRef.current) {
      ambientRef.current.intensity += (ambientTarget.current - ambientRef.current.intensity) * lerp;
    }
    if (keyRef.current) {
      keyRef.current.intensity += (keyTarget.current - keyRef.current.intensity) * lerp;
      keyPos.current.lerp(keyPosTarget.current, lerp);
      keyRef.current.position.copy(keyPos.current);
    }
    if (fillRef.current) {
      fillRef.current.intensity += (fillTarget.current - fillRef.current.intensity) * lerp;
      fillPos.current.lerp(fillPosTarget.current, lerp);
      fillRef.current.position.copy(fillPos.current);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={lighting.ambient} />
      <directionalLight
        ref={keyRef}
        position={lighting.keyLightPosition}
        intensity={lighting.keyLightIntensity}
        color={lighting.accent}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        ref={fillRef}
        position={lighting.fillPosition}
        intensity={lighting.fillIntensity}
        color={lighting.fillColor}
      />
      <spotLight
        position={[0, 3.5, 2]}
        angle={0.45}
        penumbra={0.8}
        intensity={playingBoost * lighting.playBoost * 2}
        color={lighting.accent}
        castShadow={false}
      />
      <pointLight
        position={[0, 1.2, 1.5]}
        intensity={playingBoost * lighting.playBoost * 1.8}
        color={lighting.accent}
        distance={8}
      />
    </>
  );
}

function SceneContent({
  lidOpen,
  activeNotes,
  performanceModeId = "recital",
  finishId = "polished_ebony",
  sustain = false,
  softPedal = false,
  sostenuto = false,
  enableOrbit = true,
  playingBoost = 0,
  cameraPreset,
  quality = "high",
  effectsEnabled = true,
}: ShowroomSceneProps) {
  const mode = getPerformanceMode(performanceModeId);
  const activeCameraPreset = cameraPreset ?? mode.cameraPreset;
  const highQuality = quality === "high";

  return (
    <>
      <PerformanceLights performanceModeId={performanceModeId} playingBoost={playingBoost} />
      <SceneChoreography
        performanceModeId={performanceModeId}
        choreography={mode.choreography}
        playingBoost={playingBoost}
      />
      <ShowroomCameraRig
        preset={activeCameraPreset}
        performanceModeId={performanceModeId}
        choreography={mode.choreography}
        enableOrbit={enableOrbit}
      />
      <PianoModelUnified
        lidOpen={normalizeLid(lidOpen)}
        activeNotes={activeNotes}
        performanceModeId={performanceModeId}
        finishId={finishId}
        sustain={sustain}
        softPedal={softPedal}
        sostenuto={sostenuto}
        playingBoost={playingBoost}
      />
      {highQuality && <ShowroomFloor />}
      <ContactShadows
        position={[0, -0.65, 0]}
        opacity={0.5}
        scale={14}
        blur={2.8}
        far={4.5}
      />
      <Environment files={getEnvironmentHdrPath(mode.lighting.environment)} />
      {highQuality && (
        <ShowroomParticles
          playingBoost={playingBoost}
          performanceModeId={performanceModeId}
        />
      )}
      <ShowroomEffects
        playingBoost={playingBoost}
        performanceModeId={performanceModeId}
        enabled={effectsEnabled && highQuality}
      />
    </>
  );
}

export function ShowroomScene({
  lidOpen,
  activeNotes,
  performanceModeId = "recital",
  finishId = "polished_ebony",
  sustain = false,
  softPedal = false,
  sostenuto = false,
  enableOrbit = true,
  playingBoost = 0,
  cameraPreset,
  quality = "high",
  effectsEnabled = true,
}: ShowroomSceneProps) {
  return (
    <Suspense fallback={null}>
      <PerformanceMonitor
        onDecline={() => undefined}
        flipflops={3}
        onFallback={() => undefined}
      />
      <SceneContent
        lidOpen={lidOpen}
        activeNotes={activeNotes}
        performanceModeId={performanceModeId}
        finishId={finishId}
        sustain={sustain}
        softPedal={softPedal}
        sostenuto={sostenuto}
        enableOrbit={enableOrbit}
        playingBoost={playingBoost}
        cameraPreset={cameraPreset}
        quality={quality}
        effectsEnabled={effectsEnabled}
      />
    </Suspense>
  );
}

// ============================================================================
// SHOWROOM CANVAS
// ============================================================================

export type ShowroomCanvasProps = {
  lidOpen: number;
  activeNotes?: Set<number>;
  performanceModeId?: Gp9PerformanceModeId;
  finishId?: Gp9FinishId;
  sustain?: boolean;
  softPedal?: boolean;
  sostenuto?: boolean;
  enableOrbit?: boolean;
  playingBoost?: number;
  cameraPreset?: Gp9CameraPresetId;
  className?: string;
};

export function ShowroomCanvas({
  lidOpen,
  activeNotes,
  performanceModeId = "recital",
  finishId = "polished_ebony",
  sustain = false,
  softPedal = false,
  sostenuto = false,
  enableOrbit = true,
  playingBoost = 0,
  cameraPreset,
  className = "h-full w-full touch-none",
}: ShowroomCanvasProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  const [quality, setQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setDpr(mobile ? [1, 1.25] : [1, 1.75]);
    setQuality(mobile || coarse ? "low" : "high");
  }, []);

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: [0, 1.8, 5.2], fov: 42, near: 0.1, far: 50 }}
      className={className}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      performance={{ min: 0.5, max: 1, debounce: 200 }}
    >
      <Suspense fallback={null}>
        <ShowroomScene
          lidOpen={lidOpen}
          activeNotes={activeNotes}
          performanceModeId={performanceModeId}
          finishId={finishId}
          sustain={sustain}
          softPedal={softPedal}
          sostenuto={sostenuto}
          enableOrbit={enableOrbit}
          playingBoost={playingBoost}
          cameraPreset={cameraPreset}
          quality={quality}
          effectsEnabled={quality === "high"}
        />
      </Suspense>
    </Canvas>
  );
}

// ============================================================================
// PIANO SCENE DEFAULT
// ============================================================================

/** Legacy entry — delegates to premium showroom canvas. */
export type PianoSceneProps = ShowroomSceneProps & {
  className?: string;
};

export function PianoScene({
  className,
  ...props
}: PianoSceneProps & { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const lid =
    typeof props.lidOpen === "boolean" ? (props.lidOpen ? 1 : 0) : (props.lidOpen ?? 0.65);

  return (
    <ShowroomCanvas
      lidOpen={lid}
      activeNotes={props.activeNotes}
      performanceModeId={props.performanceModeId}
      finishId={props.finishId}
      sustain={props.sustain}
      softPedal={props.softPedal}
      sostenuto={props.sostenuto}
      enableOrbit={props.enableOrbit}
      playingBoost={props.playingBoost}
      cameraPreset={props.cameraPreset}
      className={className ?? "h-full w-full touch-none"}
    />
  );
}

export default PianoScene;
