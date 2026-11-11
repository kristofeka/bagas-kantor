"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCursor, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { K, POSE_IDS, poseLayout, type PoseId } from "../lib/poses";
import { wibNow, type PropId } from "../lib/lines";

const INK = "#2B1A12";
const EYE_Y = 1.45;
const DESK_Y = 0.62;
const WALL_Z = -1.6;

type PickHandler = (id: PropId) => void;

const inkMaterial = (thickness: number) =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { thickness: { value: thickness }, color: { value: new THREE.Color(INK) } },
    vertexShader:
      "uniform float thickness; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normalize(normal) * thickness, 1.0); }",
    fragmentShader:
      "uniform vec3 color; void main() { gl_FragColor = vec4(color, 1.0);\n#include <colorspace_fragment>\n}",
  });

// Garis tinta: salinan geometri induk yang digembungkan dan dibalik.
const Ink = ({ thickness = 0.016 }: { thickness?: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(() => inkMaterial(thickness), [thickness]);
  useEffect(() => {
    const parent = ref.current?.parent as THREE.Mesh | undefined;
    if (ref.current && parent?.geometry) ref.current.geometry = parent.geometry;
  }, []);
  return <mesh ref={ref} material={material} raycast={() => null} />;
};

const Flat = ({ color }: { color: string }) => <meshToonMaterial color={color} />;

// Bungkus properti yang bisa diklik: membesar saat disorot, sesekali bergoyang sebagai petunjuk.
const Clickable = ({
  id,
  position,
  onPick,
  phase = 0,
  children,
}: {
  id: PropId;
  position: [number, number, number];
  onPick: PickHandler;
  phase?: number;
  children: ReactNode;
}) => {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pop = useRef(0);
  useCursor(hovered);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    pop.current = Math.max(0, pop.current - delta * 3);
    const t = (clock.elapsedTime + phase * 1.7) % 9;
    const wiggle = t < 0.6 ? Math.sin((t / 0.6) * Math.PI * 4) * 0.06 * (1 - t / 0.6) : 0;
    const target = (hovered ? 1.1 : 1) + Math.sin(pop.current * Math.PI) * 0.18;
    const s = THREE.MathUtils.lerp(group.current.scale.x, target, 1 - Math.exp(-delta * 14));
    group.current.scale.setScalar(s);
    group.current.rotation.z = wiggle;
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        pop.current = 1;
        onPick(id);
      }}
    >
      {children}
    </group>
  );
};

const makeLidTexture = (skin: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 150;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(90, 69, 86, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2A120F";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(30, 101);
  ctx.quadraticCurveTo(90, 139, 148, 101);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const Bagas = ({ pose, bump, onPick }: { pose: PoseId; bump: number; onPick: PickHandler }) => {
  const textures = useTexture(POSE_IDS.map((id) => `/bagas/${id}.webp`));
  const map = useMemo(() => {
    const result = {} as Record<PoseId, THREE.Texture>;
    POSE_IDS.forEach((id, index) => {
      textures[index].colorSpace = THREE.SRGBColorSpace;
      textures[index].anisotropy = 8;
      result[id] = textures[index];
    });
    return result;
  }, [textures]);

  const layout = useMemo(() => poseLayout(pose), [pose]);
  const lid = useMemo(() => makeLidTexture(layout.skin), [layout.skin]);
  useEffect(() => () => lid.dispose(), [lid]);

  const body = useRef<THREE.Group>(null);
  const lids = useRef<THREE.Group>(null);
  const squash = useRef(0);
  const nextBlink = useRef(2);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useEffect(() => {
    squash.current = 1;
  }, [bump]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    squash.current = Math.max(0, squash.current - delta * 2.6);
    const wobble = Math.sin(squash.current * Math.PI * 3) * squash.current * 0.07;
    if (body.current) {
      const breathe = Math.sin(t * 1.6) * 0.006;
      body.current.scale.set(1 - wobble * 0.6, 1 + wobble + breathe, 1);
      body.current.rotation.z = Math.sin(t * 0.7) * 0.008;
    }
    if (lids.current) {
      if (t > nextBlink.current + 0.13) {
        nextBlink.current = t + 2 + Math.random() * 3.5;
      }
      lids.current.visible = t >= nextBlink.current;
    }
  });

  return (
    <group position={[0, DESK_Y, 0]}>
      <group ref={body}>
        <group position={[-layout.mid[0], EYE_Y - DESK_Y - layout.mid[1], 0]}>
          <mesh
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
            onClick={(event) => {
              event.stopPropagation();
              onPick("bagas");
            }}
          >
            <planeGeometry args={[layout.w, layout.h]} />
            <meshBasicMaterial map={map[pose]} transparent alphaTest={0.4} toneMapped={false} />
          </mesh>
          <group ref={lids} visible={false}>
            {[layout.eyeL, layout.eyeR].map((eye, index) => (
              <mesh key={index} position={[eye[0], eye[1], 0.004]} scale={[index ? -1 : 1, 1, 1]}>
                <planeGeometry args={[90 * K, 75 * K]} />
                <meshBasicMaterial map={lid} transparent toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
};

const skyFor = (hours: number) => {
  if (hours >= 6 && hours < 16) return { sky: "#BFE3F5", orb: "#FFF3B8", orbY: 0.22 };
  if (hours >= 16 && hours < 18) return { sky: "#F3A25C", orb: "#FFE0A3", orbY: -0.12 };
  return { sky: "#2A3554", orb: "#F4EFD8", orbY: 0.18 };
};

const Room = () => {
  const { sky, orb, orbY } = useMemo(() => skyFor(wibNow().hours), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial color="#D8BC95" />
      </mesh>
      <mesh position={[0, 6, WALL_Z]}>
        <planeGeometry args={[40, 12]} />
        <meshBasicMaterial color="#F1DDBA" />
      </mesh>
      <mesh position={[0, 0.09, WALL_Z + 0.02]}>
        <boxGeometry args={[40, 0.18, 0.04]} />
        <Flat color="#B9946B" />
      </mesh>

      {/* Jendela */}
      <group position={[2.15, 2.0, WALL_Z + 0.03]}>
        <mesh>
          <boxGeometry args={[1.5, 1.1, 0.06]} />
          <Flat color="#8A5E3C" />
          <Ink />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.34, 0.94]} />
          <meshBasicMaterial color={sky} />
        </mesh>
        <mesh position={[0.3, orbY, 0.04]}>
          <circleGeometry args={[0.13, 32]} />
          <meshBasicMaterial color={orb} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.05, 0.94, 0.02]} />
          <Flat color="#8A5E3C" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.34, 0.05, 0.02]} />
          <Flat color="#8A5E3C" />
        </mesh>
      </group>

      {/* Papan gabus */}
      <group position={[-2.3, 1.75, WALL_Z + 0.03]}>
        <mesh>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <Flat color="#C99562" />
          <Ink />
        </mesh>
        {(
          [
            [-0.32, 0.12, "#FFF1B5", 0.08],
            [0.08, -0.1, "#F8C7B0", -0.06],
            [0.36, 0.16, "#CFE6C4", 0.04],
          ] as const
        ).map(([x, y, color, tilt], index) => (
          <mesh key={index} position={[x, y, 0.03]} rotation={[0, 0, tilt]}>
            <planeGeometry args={[0.24, 0.24]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>

      {/* Lampu gantung */}
      <group position={[0, 3.05, -0.3]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.03, 1, 0.03]} />
          <Flat color={INK} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.5, 0.1, 0.3]} />
          <Flat color="#6B5646" />
          <Ink />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[1.3, 0.04, 0.16]} />
          <meshBasicMaterial color="#FFF3C2" />
        </mesh>
      </group>
    </group>
  );
};

const Desk = () => (
  <group>
    <mesh position={[0, DESK_Y - 0.04, 0.42]}>
      <boxGeometry args={[3.9, 0.08, 0.78]} />
      <Flat color="#E3C596" />
      <Ink />
    </mesh>
    <mesh position={[0, (DESK_Y - 0.08) / 2, 0.76]}>
      <boxGeometry args={[3.7, DESK_Y - 0.08, 0.05]} />
      <Flat color="#C7A57C" />
      <Ink />
    </mesh>
    {[-1.8, 1.8].map((x) => (
      <mesh key={x} position={[x, (DESK_Y - 0.08) / 2, 0.4]}>
        <boxGeometry args={[0.08, DESK_Y - 0.08, 0.7]} />
        <Flat color="#B48F66" />
        <Ink />
      </mesh>
    ))}
  </group>
);

const Laptop = () => (
  <group rotation={[0, 0.35, 0]}>
    <mesh position={[0, 0.015, 0]}>
      <boxGeometry args={[0.56, 0.03, 0.36]} />
      <Flat color="#8C8A88" />
      <Ink />
    </mesh>
    <group position={[0, 0.03, 0.17]} rotation={[0.22, 0, 0]}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.56, 0.36, 0.025]} />
        <Flat color="#77757A" />
        <Ink />
      </mesh>
      <mesh position={[0, 0.18, 0.014]}>
        <circleGeometry args={[0.04, 24]} />
        <meshBasicMaterial color="#5A585D" />
      </mesh>
    </group>
  </group>
);

const Steam = () => {
  const puffs = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    puffs.current?.children.forEach((child, index) => {
      const p = (clock.elapsedTime * 0.35 + index / 3) % 1;
      child.position.set(Math.sin(p * 6 + index) * 0.025, 0.1 + p * 0.3, 0);
      child.scale.setScalar(0.6 + p * 0.9);
      ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.sin(p * Math.PI) * 0.55;
    });
  });
  return (
    <group ref={puffs}>
      {[0, 1, 2].map((index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const Mug = () => (
  <group>
    <mesh position={[0, 0.085, 0]}>
      <cylinderGeometry args={[0.075, 0.068, 0.17, 24]} />
      <Flat color="#F7F1E3" />
      <Ink />
    </mesh>
    <mesh position={[0, 0.171, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.062, 24]} />
      <meshBasicMaterial color="#4A2E20" />
    </mesh>
    <mesh position={[0.09, 0.085, 0]}>
      <torusGeometry args={[0.042, 0.013, 10, 20]} />
      <Flat color="#F7F1E3" />
      <Ink thickness={0.01} />
    </mesh>
    <Steam />
  </group>
);

const Phone = () => {
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!screen.current) return;
    const on = clock.elapsedTime % 4 < 1.2;
    screen.current.color.set(on ? "#7FD0FF" : "#26303F");
  });
  return (
    <group rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.13, 0.022, 0.25]} />
        <Flat color="#2A2F3A" />
        <Ink thickness={0.01} />
      </mesh>
      <mesh position={[0, 0.0225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.105, 0.21]} />
        <meshBasicMaterial ref={screen} color="#26303F" />
      </mesh>
    </group>
  );
};

const Calendar = () => {
  const texture = useMemo(() => {
    const { dayName, date } = wibNow();
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#FFFDF6";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#D2553F";
    ctx.fillRect(0, 0, 256, 76);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFDF6";
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillText(dayName.toUpperCase(), 128, 54);
    ctx.fillStyle = INK;
    ctx.font = "800 136px system-ui, sans-serif";
    ctx.fillText(String(date), 128, 214);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  return (
    <group rotation={[-0.25, -0.2, 0]}>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.03]} />
        <Flat color="#FFFDF6" />
        <Ink />
      </mesh>
      <mesh position={[0, 0.14, 0.017]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Plant = () => (
  <group>
    <mesh position={[0, 0.08, 0]}>
      <cylinderGeometry args={[0.1, 0.075, 0.16, 20]} />
      <Flat color="#C4683F" />
      <Ink />
    </mesh>
    {(
      [
        [0, 0.3, 0, 0],
        [-0.1, 0.24, 0.02, 0.6],
        [0.1, 0.25, -0.02, -0.6],
        [-0.05, 0.4, 0, 0.3],
        [0.07, 0.38, 0.02, -0.35],
      ] as const
    ).map(([x, y, z, tilt], index) => (
      <mesh key={index} position={[x, y, z]} rotation={[0, 0, tilt]} scale={[0.6, 1, 0.35]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <Flat color={index % 2 ? "#6E8F4E" : "#84A65E"} />
        <Ink thickness={0.012} />
      </mesh>
    ))}
  </group>
);

const WallClock = () => {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  useFrame(() => {
    const { hours, minutes, seconds } = wibNow();
    const m = minutes + seconds / 60;
    if (hour.current) hour.current.rotation.z = -(((hours % 12) + m / 60) / 12) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (second.current) second.current.rotation.z = -(Math.floor(seconds) / 60) * Math.PI * 2;
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 40]} />
        <Flat color="#6B4A35" />
        <Ink />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <circleGeometry args={[0.29, 40]} />
        <meshBasicMaterial color="#FAF5E3" />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.sin(angle) * 0.245, Math.cos(angle) * 0.245, 0.034]}
            rotation={[0, 0, -angle]}
          >
            <planeGeometry args={[0.014, index % 3 === 0 ? 0.05 : 0.028]} />
            <meshBasicMaterial color={INK} />
          </mesh>
        );
      })}
      <group ref={hour} position={[0, 0, 0.036]}>
        <mesh position={[0, 0.07, 0]}>
          <planeGeometry args={[0.03, 0.16]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.038]}>
        <mesh position={[0, 0.105, 0]}>
          <planeGeometry args={[0.02, 0.23]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      <group ref={second} position={[0, 0, 0.04]}>
        <mesh position={[0, 0.1, 0]}>
          <planeGeometry args={[0.008, 0.25]} />
          <meshBasicMaterial color="#D2553F" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.042]}>
        <circleGeometry args={[0.02, 16]} />
        <meshBasicMaterial color={INK} />
      </mesh>
    </group>
  );
};

// Kamera mengikuti kursor atau jari, dan mundur di layar sempit agar meja tetap terlihat.
const CameraRig = () => {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ pointer }, delta) => {
    const aspect = size.width / size.height;
    const halfWidth = aspect < 1 ? 1.5 : 2.1;
    const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
    const distance = Math.max(5.2, halfWidth / (Math.tan(fov / 2) * aspect));
    const lookY = aspect < 1 ? 1.2 : 1.3;
    const ease = 1 - Math.exp(-delta * 3);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.9, ease);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.3 + pointer.y * 0.18, ease);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, distance, ease);
    look.set(camera.position.x * 0.15, lookY, 0);
    camera.lookAt(look);
  });
  return null;
};

// Di layar sempit properti dirapatkan ke tengah supaya semuanya tetap terlihat.
const Props = ({ onPick }: { onPick: PickHandler }) => {
  const narrow = useThree((state) => state.size.width < state.size.height);
  const f = narrow ? 0.72 : 1;
  return (
    <>
      <Clickable id="jam" position={[-0.95 * f, 2.55, WALL_Z + 0.04]} onPick={onPick} phase={0}>
        <WallClock />
      </Clickable>
      <Clickable id="tanaman" position={[-1.72 * f, DESK_Y, 0.36]} onPick={onPick} phase={1}>
        <Plant />
      </Clickable>
      <Clickable id="laptop" position={[-1.12 * f, DESK_Y, 0.42]} onPick={onPick} phase={2}>
        <Laptop />
      </Clickable>
      <Clickable id="mug" position={[0.92 * f, DESK_Y, 0.5]} onPick={onPick} phase={3}>
        <Mug />
      </Clickable>
      <Clickable id="hp" position={[1.3 * f, DESK_Y, 0.56]} onPick={onPick} phase={4}>
        <Phone />
      </Clickable>
      <Clickable id="kalender" position={[1.66 * f, DESK_Y, 0.3]} onPick={onPick} phase={5}>
        <Calendar />
      </Clickable>
    </>
  );
};

export default function Scene({
  pose,
  bump,
  onPick,
}: {
  pose: PoseId;
  bump: number;
  onPick: PickHandler;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ fov: 35, position: [0, 1.3, 6], near: 0.1, far: 60 }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#F1DDBA"]} />
      <ambientLight intensity={2.4} />
      <directionalLight position={[2, 5, 4]} intensity={1.1} />
      <CameraRig />
      <Room />
      <Suspense fallback={null}>
        <Bagas pose={pose} bump={bump} onPick={onPick} />
      </Suspense>
      <Desk />
      <Props onPick={onPick} />
    </Canvas>
  );
}
