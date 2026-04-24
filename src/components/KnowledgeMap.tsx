"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CompanyInsight } from "@/lib/types";

export interface KnowledgeMapProps {
  insight: CompanyInsight;
}

type NodeKind = "company" | "competitor" | "person" | "source";
interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  position: [number, number, number];
  size: number;
}
interface GraphEdge {
  from: string;
  to: string;
  strength: number;
}

const KIND_COLOR: Record<NodeKind, string> = {
  company: "#34d399",
  competitor: "#f472b6",
  person: "#60a5fa",
  source: "#fbbf24",
};

export default function KnowledgeMap({ insight }: KnowledgeMapProps) {
  const { nodes, edges } = useMemo(() => buildGraph(insight), [insight]);

  return (
    <div className="relative w-full h-[520px] border border-neutral-800 rounded overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 0, 14], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={["#07080a"]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 8, 8]} intensity={1.1} color="#a7f3d0" />
        <pointLight position={[-10, -6, 4]} intensity={0.5} color="#60a5fa" />
        <Suspense fallback={null}>
          <Stars radius={40} depth={40} count={1800} factor={3.5} fade speed={0.4} />
          <GraphGroup nodes={nodes} edges={edges} />
        </Suspense>
        <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} />
      </Canvas>
      <Legend />
    </div>
  );
}

function GraphGroup({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.07;
  });
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  return (
    <group ref={ref}>
      {edges.map((e, i) => {
        const a = nodeMap.get(e.from);
        const b = nodeMap.get(e.to);
        if (!a || !b) return null;
        return <Edge key={i} a={a.position} b={b.position} strength={e.strength} />;
      })}
      {nodes.map((n) => (
        <Node key={n.id} node={n} />
      ))}
    </group>
  );
}

function Node({ node }: { node: GraphNode }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 1.2 + node.position[0]) * 0.04;
    mesh.current.scale.setScalar(s);
  });
  const color = KIND_COLOR[node.kind];
  return (
    <group position={node.position}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[node.size, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      <Html distanceFactor={12} center position={[0, node.size + 0.55, 0]}>
        <div className="text-[10px] font-mono text-neutral-200 whitespace-nowrap px-1.5 py-0.5 rounded bg-neutral-900/70 border border-neutral-700">
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function Edge({
  a,
  b,
  strength,
}: {
  a: [number, number, number];
  b: [number, number, number];
  strength: number;
}) {
  // Use a tubular geometry so the edges are always visible (SVG `<line>`
  // collision with three.js Line is avoided) and gradient-tinted.
  const { position, quaternion, scale } = useMemo(() => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const length = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return {
      position: mid.toArray() as [number, number, number],
      quaternion: [q.x, q.y, q.z, q.w] as [number, number, number, number],
      scale: [1, length, 1] as [number, number, number],
    };
  }, [a, b]);

  const radius = 0.02 + strength * 0.03;
  const opacity = 0.18 + strength * 0.55;

  return (
    <mesh position={position} quaternion={quaternion} scale={scale}>
      <cylinderGeometry args={[radius, radius, 1, 6, 1, true]} />
      <meshBasicMaterial color="#4ade80" transparent opacity={opacity} />
    </mesh>
  );
}

function Legend() {
  const items: { kind: NodeKind; label: string }[] = [
    { kind: "company", label: "company" },
    { kind: "competitor", label: "competitor" },
    { kind: "person", label: "key person" },
    { kind: "source", label: "source" },
  ];
  return (
    <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] font-mono bg-neutral-950/80 border border-neutral-800 rounded px-2 py-1">
      {items.map((i) => (
        <span key={i.kind} className="flex items-center gap-1.5 text-neutral-300">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: KIND_COLOR[i.kind] }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function buildGraph(insight: CompanyInsight): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const companyId = "co:" + insight.id;
  nodes.push({
    id: companyId,
    label: insight.name,
    kind: "company",
    position: [0, 0, 0],
    size: 1.1,
  });

  insight.competitors.forEach((c, i) => {
    const id = "comp:" + i;
    const p = spherical(4.5, i, insight.competitors.length, 0.4);
    nodes.push({ id, label: c.name, kind: "competitor", position: p, size: 0.55 + c.strength * 0.4 });
    edges.push({ from: companyId, to: id, strength: c.strength });
  });

  insight.keyPeople.forEach((p, i) => {
    const id = "person:" + i;
    const pos = spherical(3.2, i, insight.keyPeople.length, 1.7);
    nodes.push({ id, label: p.name, kind: "person", position: pos, size: 0.45 });
    edges.push({ from: companyId, to: id, strength: 0.7 });
  });

  insight.sources.slice(0, 6).forEach((s, i) => {
    const id = "src:" + i;
    const pos = spherical(6, i, insight.sources.length, 3.1);
    nodes.push({ id, label: s.kind, kind: "source", position: pos, size: 0.32 });
    edges.push({ from: companyId, to: id, strength: 0.35 });
  });

  return { nodes, edges };
}

function spherical(
  radius: number,
  i: number,
  n: number,
  yawOffset: number,
): [number, number, number] {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(n, 1));
  const theta = Math.PI * (1 + Math.sqrt(5)) * i + yawOffset;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}
