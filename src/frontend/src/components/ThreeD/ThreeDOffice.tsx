import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane, Cylinder, RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';

interface Agent {
  id: string;
  name: string;
  title: string;
  role?: string;
  department_id?: string;
  department_code?: string;
  autonomy_level?: number;
  avatar_url?: string;
}

interface VirtualOfficeProps {
  agents: Agent[];
  onStartChatWithAgent?: (agent: Agent) => void;
}

// Default fallback agent mapping so avatars are NEVER empty
const DEFAULT_FALLBACK_AGENTS: Record<string, Partial<Agent>> = {
  ceo: { id: 'EMP-CEO', name: 'Chief Aura (CEO)', title: 'Chief Executive Officer', role: 'CEO', autonomy_level: 5 },
  cfo: { id: 'EMP-CFO', name: 'Morgan Drake (CFO)', title: 'Chief Financial Officer', role: 'CFO', autonomy_level: 4 },
  legal: { id: 'EMP-LEG', name: 'Justicia (Legal & Terms)', title: 'Software Legal & Compliance Specialist', role: 'Legal Counsel', autonomy_level: 4 },
  cto: { id: 'EMP-CTO', name: 'Marcus Sterling (CTO)', title: 'Chief Technology Officer', role: 'CTO', autonomy_level: 5 },
  cpo: { id: 'EMP-CPO', name: 'Elena Vance (CPO)', title: 'Chief Product Officer', role: 'CPO', autonomy_level: 5 },
  cmo: { id: 'EMP-MKT', name: 'Vibe (Marketing Copy)', title: 'Growth & Marketing Copywriter', role: 'Marketer', autonomy_level: 4 },
  cro: { id: 'EMP-CRO', name: 'Hunter (Sales Lead)', title: 'Chief Revenue & Client Acquisition', role: 'Sales / CRO', autonomy_level: 4 },
  arch: { id: 'EMP-ARCH', name: 'Viktor Cruz (Architect)', title: 'Principal Software Architect', role: 'Architect', autonomy_level: 4 },
  dev: { id: 'EMP-DEV', name: 'Devron (Fullstack Dev)', title: 'Lead Fullstack Engineer', role: 'Developer', autonomy_level: 4 },
  ops: { id: 'EMP-OPS', name: 'Cipher (DevOps / SRE)', title: 'Cloud & Site Reliability Engineer', role: 'DevOps', autonomy_level: 4 },
  qa: { id: 'EMP-QA', name: 'Tessa (SQA Engineer)', title: 'Lead Quality Assurance Engineer', role: 'QA Engineer', autonomy_level: 4 },
  pm: { id: 'EMP-PM', name: 'Sarah Jenkins (PM)', title: 'Senior Product Manager', role: 'Product Manager', autonomy_level: 4 },
  ux: { id: 'EMP-UX', name: 'Kaelen (UI/UX Spec)', title: 'Lead UI/UX Architect', role: 'UX Designer', autonomy_level: 4 },
  research: { id: 'EMP-RES', name: 'Dr. Aris (Researcher)', title: 'Lead Market Researcher', role: 'Researcher', autonomy_level: 4 }
};

// 14 stations mapped accurately to the 2D layout and PRD v2.0 roles
const ALL_STATIONS = [
  // Zone 1: Executive Glass Suite (Far Left Top: X: -16 to -10, Z: -6)
  { id: 'ceo', empId: 'EMP-CEO', x: -16.5, z: -6.5, label: 'CEO Suite', roleMatch: 'CEO', color: '#0284c7', emoji: '👑' },
  { id: 'cfo', empId: 'EMP-CFO', x: -11.5, z: -6.5, label: 'CFO Desk', roleMatch: 'CFO', color: '#f59e0b', emoji: '📊' },
  
  // Zone 2: Legal & Compliance (Far Left Mid: X: -14, Z: 0)
  { id: 'legal', empId: 'EMP-LEG', x: -14, z: 0.5, label: 'Legal & Terms Desk', roleMatch: 'Legal', color: '#eab308', emoji: '⚖️' },

  // Zone 3: Main Open Workspace (Center Grid: X: -5 to +7, Z: -6 to +6)
  // Row 1 - Engineering & Tech (Top Center)
  { id: 'cto', empId: 'EMP-CTO', x: -5, z: -5.5, label: 'CTO Desk', roleMatch: 'CTO', color: '#38bdf8', emoji: '🛠️' },
  { id: 'arch', empId: 'EMP-ARCH', x: 0, z: -5.5, label: 'Architect Desk', roleMatch: 'Architect', color: '#15803d', emoji: '💻' },
  { id: 'dev', empId: 'EMP-DEV', x: 5, z: -5.5, label: 'Dev Desk', roleMatch: 'Developer', color: '#047857', emoji: '💾' },

  // Row 2 - Product, Design & QA (Middle Center)
  { id: 'cpo', empId: 'EMP-CPO', x: -5, z: 0, label: 'CPO Desk', roleMatch: 'CPO', color: '#10b981', emoji: '💡' },
  { id: 'pm', empId: 'EMP-PM', x: 0, z: 0, label: 'PM Desk', roleMatch: 'Product', color: '#6366f1', emoji: '📅' },
  { id: 'ux', empId: 'EMP-UX', x: 5, z: 0, label: 'UX Desk', roleMatch: 'UX', color: '#f43f5e', emoji: '✏️' },

  // Row 3 - Operations, Security & QA (Bottom Center)
  { id: 'ops', empId: 'EMP-OPS', x: -5, z: 5.5, label: 'DevOps Desk', roleMatch: 'DevOps', color: '#0891b2', emoji: '🚀' },
  { id: 'qa', empId: 'EMP-QA', x: 0, z: 5.5, label: 'QA Desk', roleMatch: 'QA', color: '#b91c1c', emoji: '🔍' },
  { id: 'research', empId: 'EMP-RES', x: 5, z: 5.5, label: 'Researcher Desk', roleMatch: 'Research', color: '#84cc16', emoji: '🔬' },

  // Growth & Commercial Suite (Top Right Transition)
  { id: 'cmo', empId: 'EMP-MKT', x: 10, z: -5.5, label: 'Marketing Desk', roleMatch: 'Marketing', color: '#a855f7', emoji: '📢' },
  { id: 'cro', empId: 'EMP-CRO', x: 10, z: 0, label: 'Sales / CRO Desk', roleMatch: 'Sales', color: '#ec4899', emoji: '🤝' },
];

// Potted Plant Component
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Terracotta Pot */}
      <Cylinder args={[0.35, 0.25, 0.7, 16]} position={[0, 0.35, 0]} castShadow>
        <meshStandardMaterial color="#d97706" roughness={0.8} />
      </Cylinder>
      {/* Soil */}
      <Cylinder args={[0.33, 0.33, 0.1, 16]} position={[0, 0.68, 0]}>
        <meshStandardMaterial color="#451a03" />
      </Cylinder>
      {/* Foliage / Leaves */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Ping Pong Table Component
function PingPongTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor Shadow / Mat */}
      <Plane args={[4.2, 2.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </Plane>
      {/* Table Legs */}
      <Box args={[0.1, 0.75, 0.1]} position={[-1.7, 0.375, -0.9]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
      <Box args={[0.1, 0.75, 0.1]} position={[1.7, 0.375, -0.9]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
      <Box args={[0.1, 0.75, 0.1]} position={[-1.7, 0.375, 0.9]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
      <Box args={[0.1, 0.75, 0.1]} position={[1.7, 0.375, 0.9]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
      
      {/* Green Tabletop */}
      <RoundedBox args={[3.8, 0.08, 2.2]} radius={0.02} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#15803d" roughness={0.3} />
      </RoundedBox>
      {/* White Net */}
      <Box args={[0.04, 0.3, 2.4]} position={[0, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#ffffff" opacity={0.8} transparent />
      </Box>
      {/* White Center Line */}
      <Box args={[3.8, 0.01, 0.04]} position={[0, 0.795, 0]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>
      {/* Paddles & Ball */}
      <Cylinder args={[0.12, 0.12, 0.02]} position={[-0.8, 0.81, 0.4]} rotation={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color="#ef4444" />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.02]} position={[0.9, 0.81, -0.4]} rotation={[0, -0.4, 0]} castShadow>
        <meshStandardMaterial color="#3b82f6" />
      </Cylinder>
      <mesh position={[0.2, 0.82, 0.1]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Conference Boardroom Table & Chairs
function BoardroomArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor Zone Carpet */}
      <RoundedBox args={[6.5, 0.02, 3.8]} radius={0.2} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#0369a1" opacity={0.15} transparent />
      </RoundedBox>

      {/* Large Oval Wooden Conference Table */}
      <RoundedBox args={[4.5, 0.15, 2.2]} radius={0.3} position={[0, 0.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.3} />
      </RoundedBox>
      {/* Table Pillar Base */}
      <Cylinder args={[0.4, 0.5, 0.8, 16]} position={[-1.2, 0.4, 0]} castShadow><meshStandardMaterial color="#94a3b8" /></Cylinder>
      <Cylinder args={[0.4, 0.5, 0.8, 16]} position={[1.2, 0.4, 0]} castShadow><meshStandardMaterial color="#94a3b8" /></Cylinder>

      {/* Boardroom Rolling Chairs around table */}
      {[-1.4, 0, 1.4].map((offset, i) => (
        <group key={`chair-top-${i}`} position={[offset, 0, -1.4]}>
          <Box args={[0.5, 0.08, 0.5]} position={[0, 0.45, 0]} castShadow><meshStandardMaterial color="#e2e8f0" /></Box>
          <Box args={[0.5, 0.5, 0.08]} position={[0, 0.7, -0.22]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
          <Cylinder args={[0.04, 0.04, 0.45]} position={[0, 0.225, 0]}><meshStandardMaterial color="#10b981" /></Cylinder>
        </group>
      ))}
      {[-1.4, 0, 1.4].map((offset, i) => (
        <group key={`chair-bot-${i}`} position={[offset, 0, 1.4]}>
          <Box args={[0.5, 0.08, 0.5]} position={[0, 0.45, 0]} castShadow><meshStandardMaterial color="#e2e8f0" /></Box>
          <Box args={[0.5, 0.5, 0.08]} position={[0, 0.7, 0.22]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
          <Cylinder args={[0.04, 0.04, 0.45]} position={[0, 0.225, 0]}><meshStandardMaterial color="#10b981" /></Cylinder>
        </group>
      ))}
    </group>
  );
}

// Lounge & Breakout Area Component
function LoungeArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Soft Lounge Area Rug */}
      <RoundedBox args={[6.5, 0.02, 3.8]} radius={0.2} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#3b82f6" opacity={0.12} transparent />
      </RoundedBox>

      {/* Blue Couch */}
      <group position={[-1.6, 0, -0.6]}>
        <RoundedBox args={[1.3, 0.35, 0.8]} radius={0.05} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#2563eb" /></RoundedBox>
        <RoundedBox args={[1.3, 0.5, 0.25]} radius={0.05} position={[0, 0.5, -0.3]} castShadow><meshStandardMaterial color="#1d4ed8" /></RoundedBox>
      </group>

      {/* Red Couch */}
      <group position={[0, 0, -0.6]}>
        <RoundedBox args={[1.3, 0.35, 0.8]} radius={0.05} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#dc2626" /></RoundedBox>
        <RoundedBox args={[1.3, 0.5, 0.25]} radius={0.05} position={[0, 0.5, -0.3]} castShadow><meshStandardMaterial color="#b91c1c" /></RoundedBox>
      </group>

      {/* Grey Couch */}
      <group position={[1.6, 0, -0.6]}>
        <RoundedBox args={[1.3, 0.35, 0.8]} radius={0.05} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#10b981" /></RoundedBox>
        <RoundedBox args={[1.3, 0.5, 0.25]} radius={0.05} position={[0, 0.5, -0.3]} castShadow><meshStandardMaterial color="#059669" /></RoundedBox>
      </group>

      {/* Low Wooden Coffee Table */}
      <RoundedBox args={[2.5, 0.08, 0.9]} radius={0.04} position={[0, 0.4, 0.6]} castShadow receiveShadow>
        <meshStandardMaterial color="#78350f" roughness={0.5} />
      </RoundedBox>
      {/* Table Legs */}
      <Cylinder args={[0.03, 0.03, 0.4]} position={[-1.1, 0.2, 0.3]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.4]} position={[1.1, 0.2, 0.3]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.4]} position={[-1.1, 0.2, 0.9]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.4]} position={[1.1, 0.2, 0.9]}><meshStandardMaterial color="#94a3b8" /></Cylinder>

      {/* Standing Floor Lamp with Warm Light */}
      <group position={[2.6, 0, 1.2]}>
        <Cylinder args={[0.25, 0.25, 0.05]} position={[0, 0.025, 0]}><meshStandardMaterial color="#059669" /></Cylinder>
        <Cylinder args={[0.02, 0.02, 2.0]} position={[0, 1.0, 0]}><meshStandardMaterial color="#cbd5e1" /></Cylinder>
        {/* Lamp Shade */}
        <Cylinder args={[0.25, 0.4, 0.4, 16]} position={[0, 1.9, 0]} castShadow>
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </Cylinder>
        <pointLight position={[0, 1.85, 0]} color="#fef08a" intensity={0.8} distance={3.5} />
      </group>
    </group>
  );
}

// Coffee Bar & Pantry
function CoffeeBar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Counter Cabinet */}
      <RoundedBox args={[3.2, 0.85, 0.9]} radius={0.04} position={[0, 0.425, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e8f0" />
      </RoundedBox>
      <RoundedBox args={[3.3, 0.05, 1.0]} radius={0.02} position={[0, 0.875, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </RoundedBox>
      
      {/* Red Espresso Machine */}
      <RoundedBox args={[0.6, 0.5, 0.5]} radius={0.04} position={[-0.9, 1.15, 0]} castShadow>
        <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </RoundedBox>
      {/* Coffee Mugs */}
      <Cylinder args={[0.06, 0.05, 0.12]} position={[-0.4, 0.96, 0.2]} castShadow><meshStandardMaterial color="#38bdf8" /></Cylinder>
      <Cylinder args={[0.06, 0.05, 0.12]} position={[-0.2, 0.96, 0.2]} castShadow><meshStandardMaterial color="#f59e0b" /></Cylinder>
    </group>
  );
}

// Water Dispenser
function WaterCooler({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <RoundedBox args={[0.4, 0.85, 0.4]} radius={0.02} position={[0, 0.425, 0]} castShadow>
        <meshStandardMaterial color="#e2e8f0" />
      </RoundedBox>
      {/* Blue Water Bottle on top */}
      <Cylinder args={[0.18, 0.18, 0.5, 16]} position={[0, 1.05, 0]} castShadow>
        <meshStandardMaterial color="#38bdf8" opacity={0.65} transparent roughness={0.1} />
      </Cylinder>
    </group>
  );
}

// Interactive Workstation with Dual Monitors and Roblox Avatar
// Dedicated Character Avatar Component with Natural Animated Legs, Arms & Walking Dynamics
function CharacterAvatar({ agent, station, isWorking, isSelected, onClick, activeColor }: any) {
  const avatarRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  // Unique deterministic idle patrol path
  const stationHash = Math.abs(station.x * 7 + station.z * 13);
  const idleType = Math.floor(stationHash) % 3; // 0: Hallway Patrol, 1: Lounge Sofa, 2: Pantry Break

  useFrame((state) => {
    if (!avatarRef.current) return;
    const t = state.clock.elapsedTime;

    if (isWorking) {
      // Sitting at desk typing, facing monitor at -Z
      avatarRef.current.position.set(station.x, Math.sin(t * 3.5) * 0.02 + 0.95, station.z + 0.48);
      avatarRef.current.rotation.set(0, 0, 0); // facing desk at -Z
      
      // Arms typing towards desk
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5 + Math.sin(t * 8) * 0.08;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5 + Math.cos(t * 8) * 0.08;

      // Legs bent sitting
      if (leftLegRef.current) leftLegRef.current.rotation.set(-Math.PI / 2, 0, 0);
      if (rightLegRef.current) rightLegRef.current.rotation.set(-Math.PI / 2, 0, 0);
    } else {
      // IDLE STATES:
      if (idleType === 0) {
        // Natural Linear Walking Patrol (bolak-balik lurus di lorong)
        const walkSpeed = 0.6;
        const walkDistance = 4.0;
        const phase = Math.sin(t * walkSpeed + stationHash);
        const posX = station.x * 0.3 + phase * walkDistance;
        const posZ = 1.2 + (stationHash % 2) * 1.5;

        // Facing direction based on movement derivative
        const isMovingRight = Math.cos(t * walkSpeed + stationHash) > 0;
        const targetRotY = isMovingRight ? Math.PI / 2 : -Math.PI / 2;

        avatarRef.current.position.set(posX, Math.abs(Math.sin(t * 5)) * 0.06 + 0.95, posZ);
        avatarRef.current.rotation.set(0, targetRotY, 0);

        // Natural Walking Limb Swings (Kaki & Tangan Mengayun Alami)
        const swingSpeed = 6;
        const swingAngle = 0.55;
        const legSwing = Math.sin(t * swingSpeed);

        if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing * swingAngle;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing * swingAngle;
        if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * swingAngle;
        if (rightArmRef.current) rightArmRef.current.rotation.x = legSwing * swingAngle;
      } else if (idleType === 1) {
        // Sitting naturally in Lounge Sofa area
        const sofaOffset = (stationHash % 4) * 0.9 - 1.5;
        avatarRef.current.position.set(16.5 + sofaOffset, Math.sin(t * 1.5) * 0.01 + 0.9, 5.2);
        avatarRef.current.rotation.set(0, -Math.PI / 2, 0); // facing into room

        // Relaxed limbs
        if (leftLegRef.current) leftLegRef.current.rotation.set(-Math.PI / 2.2, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(-Math.PI / 2.2, 0, 0);
        if (leftArmRef.current) leftArmRef.current.rotation.set(0.1, 0, 0.2);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0.1, 0, -0.2);
      } else {
        // Standing at Coffee Pantry drinking / looking around
        const pantryOffset = (stationHash % 5) * 1.2 - 2.4;
        avatarRef.current.position.set(pantryOffset, Math.sin(t * 2) * 0.015 + 0.95, -8.2);
        avatarRef.current.rotation.set(0, Math.PI + Math.sin(t * 0.8) * 0.3, 0); // subtle looking around

        // Idle standing legs
        if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
        // Arm holding mug
        if (leftArmRef.current) leftArmRef.current.rotation.set(-0.4, 0, 0.2);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0.1, 0, -0.1);
      }
    }
  });

  return (
    <group ref={avatarRef} onClick={onClick}>
      {/* Head (Yellow Classic Roblox) */}
      <RoundedBox args={[0.42, 0.42, 0.42]} radius={0.05} position={[0, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </RoundedBox>

      {/* Visor & Face (Facing Forward into -Z) */}
      <Box args={[0.3, 0.12, 0.04]} position={[0, 0.65, -0.21]}>
        <meshStandardMaterial color="#0f172a" />
      </Box>
      <Box args={[0.06, 0.06, 0.02]} position={[-0.08, 0.65, -0.23]}>
        <meshBasicMaterial color={isWorking ? "#38bdf8" : "#fbbf24"} />
      </Box>
      <Box args={[0.06, 0.06, 0.02]} position={[0.08, 0.65, -0.23]}>
        <meshBasicMaterial color={isWorking ? "#38bdf8" : "#fbbf24"} />
      </Box>
      <Box args={[0.14, 0.03, 0.02]} position={[0, 0.54, -0.215]}>
        <meshBasicMaterial color="#ffffff" />
      </Box>

      {/* Front Face Features (Facing -Z) */}
      <Box args={[0.08, 0.02, 0.02]} position={[0, 0.52, -0.22]}>
        <meshBasicMaterial color="#d97706" />
      </Box>

      {/* Torso (Shirt) */}
      <RoundedBox args={[0.54, 0.58, 0.32]} radius={0.05} position={[0, 0.18, 0]} castShadow>
        <meshStandardMaterial color={activeColor} roughness={0.3} />
      </RoundedBox>

      {/* Left & Right Arms (Shoulder Pivot) */}
      <group ref={leftArmRef} position={[-0.34, 0.38, 0]}>
        <RoundedBox args={[0.16, 0.46, 0.16]} radius={0.03} position={[0, -0.23, 0]} castShadow>
          <meshStandardMaterial color={activeColor} />
        </RoundedBox>
        <mesh position={[0, -0.46, 0]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.34, 0.38, 0]}>
        <RoundedBox args={[0.16, 0.46, 0.16]} radius={0.03} position={[0, -0.23, 0]} castShadow>
          <meshStandardMaterial color={activeColor} />
        </RoundedBox>
        <mesh position={[0, -0.46, 0]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>

      {/* Left & Right Animated Legs (Hip Pivot) */}
      <group ref={leftLegRef} position={[-0.15, -0.12, 0]}>
        {/* Blue/Dark Pants */}
        <RoundedBox args={[0.18, 0.48, 0.2]} radius={0.03} position={[0, -0.24, 0]} castShadow>
          <meshStandardMaterial color="#1e293b" />
        </RoundedBox>
        {/* Shoes */}
        <RoundedBox args={[0.2, 0.1, 0.26]} radius={0.02} position={[0, -0.48, -0.03]} castShadow>
          <meshStandardMaterial color="#0f172a" />
        </RoundedBox>
      </group>

      <group ref={rightLegRef} position={[0.15, -0.12, 0]}>
        {/* Blue/Dark Pants */}
        <RoundedBox args={[0.18, 0.48, 0.2]} radius={0.03} position={[0, -0.24, 0]} castShadow>
          <meshStandardMaterial color="#1e293b" />
        </RoundedBox>
        {/* Shoes */}
        <RoundedBox args={[0.2, 0.1, 0.26]} radius={0.02} position={[0, -0.48, -0.03]} castShadow>
          <meshStandardMaterial color="#0f172a" />
        </RoundedBox>
      </group>

      {/* Selection Aura Ring */}
      {isSelected && (
        <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.6, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating Status Tag */}
      <group position={[0, 1.08, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[(agent.name || station.label).length * 0.13 + 0.6, 0.32]} />
          <meshBasicMaterial color="#020617" opacity={0.92} transparent />
        </mesh>
        <Text fontSize={0.13} color={isWorking ? "#38bdf8" : "#94a3b8"} fontWeight="bold" anchorX="center" anchorY="middle" position={[0, 0.04, 0.01]}>
          {agent.name || station.label}
        </Text>
        <Text fontSize={0.09} color={isWorking ? "#4ade80" : "#fbbf24"} fontWeight="bold" anchorX="center" anchorY="middle" position={[0, -0.07, 0.01]}>
          {isWorking ? "⚡ WORKING AT DESK" : (idleType === 0 ? "🚶 WALKING" : (idleType === 1 ? "☕ LOUNGE SOFA" : "🥤 BREAK / PANTRY"))}
        </Text>
      </group>
    </group>
  );
}

// Interactive Workstation Desk (Always stays at fixed station)
function Workstation({ station, agent, isSelected, onClick }: any) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', 'auto');
  
  const displayAgent = agent || DEFAULT_FALLBACK_AGENTS[station.id];
  const activeColor = station.color || '#0284c7';
  const isWorking = (displayAgent && (displayAgent.status === 'WORKING' || displayAgent.is_working));

  return (
    <group position={[station.x, 0, station.z]} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Desk Surface */}
      <RoundedBox args={[2.4, 0.08, 1.2]} radius={0.02} position={[0, 0.72, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </RoundedBox>
      {/* Desk Border Highlight */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.44, 0.04, 1.24]} />
        <meshBasicMaterial color={hovered || isSelected ? activeColor : '#334155'} />
      </mesh>

      {/* Desk Legs */}
      <Cylinder args={[0.03, 0.03, 0.72]} position={[-1.1, 0.36, -0.5]} castShadow><meshStandardMaterial color="#cbd5e1" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.72]} position={[1.1, 0.36, -0.5]} castShadow><meshStandardMaterial color="#cbd5e1" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.72]} position={[-1.1, 0.36, 0.5]} castShadow><meshStandardMaterial color="#cbd5e1" /></Cylinder>
      <Cylinder args={[0.03, 0.03, 0.72]} position={[1.1, 0.36, 0.5]} castShadow><meshStandardMaterial color="#cbd5e1" /></Cylinder>

      {/* Curved Ultra-Wide Main Monitor */}
      <group position={[0, 0.98, -0.32]} rotation={[0.05, 0, 0]}>
        <Box args={[1.5, 0.45, 0.03]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </Box>
        {/* Monitor Screen Frame */}
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[1.44, 0.39]} />
          <meshBasicMaterial color={isWorking ? "#030712" : "#0f172a"} />
        </mesh>
        
        {isWorking ? (
          <>
            {/* Visual Content: IDE Lines & Charts when WORKING */}
            <mesh position={[0, 0.16, 0.017]}><planeGeometry args={[1.4, 0.04]} /><meshBasicMaterial color="#1e293b" /></mesh>
            <mesh position={[-0.64, 0.16, 0.018]}><planeGeometry args={[0.02, 0.02]} /><meshBasicMaterial color="#ef4444" /></mesh>
            <mesh position={[-0.60, 0.16, 0.018]}><planeGeometry args={[0.02, 0.02]} /><meshBasicMaterial color="#eab308" /></mesh>
            <mesh position={[-0.56, 0.16, 0.018]}><planeGeometry args={[0.02, 0.02]} /><meshBasicMaterial color="#22c55e" /></mesh>
            <mesh position={[-0.2, 0.08, 0.018]}><planeGeometry args={[0.8, 0.025]} /><meshBasicMaterial color={activeColor} /></mesh>
            <mesh position={[-0.3, 0.03, 0.018]}><planeGeometry args={[0.6, 0.02]} /><meshBasicMaterial color="#38bdf8" /></mesh>
            <mesh position={[-0.1, -0.02, 0.018]}><planeGeometry args={[0.9, 0.02]} /><meshBasicMaterial color="#a855f7" /></mesh>
            <mesh position={[-0.25, -0.07, 0.018]}><planeGeometry args={[0.7, 0.02]} /><meshBasicMaterial color="#34d399" /></mesh>
            <mesh position={[0.45, -0.02, 0.018]}><planeGeometry args={[0.38, 0.22]} /><meshBasicMaterial color="#0f172a" /></mesh>
            <mesh position={[0.45, -0.01, 0.019]}><planeGeometry args={[0.32, 0.16]} /><meshBasicMaterial color={activeColor} opacity={0.5} transparent /></mesh>
          </>
        ) : (
          <>
            {/* Standby Screensaver when IDLE */}
            <mesh position={[0, 0, 0.018]}><planeGeometry args={[0.4, 0.12]} /><meshBasicMaterial color="#1e293b" /></mesh>
            <Text position={[0, 0.01, 0.02]} fontSize={0.09} color="#94a3b8" fontWeight="bold" anchorX="center" anchorY="middle">
              STANDBY
            </Text>
          </>
        )}

        {/* Monitor Stand */}
        <Cylinder args={[0.02, 0.02, 0.22]} position={[0, -0.22, -0.05]}><meshStandardMaterial color="#64748b" /></Cylinder>
        <Cylinder args={[0.15, 0.15, 0.02]} position={[0, -0.33, 0]}><meshStandardMaterial color="#475569" /></Cylinder>
      </group>

      {/* Vertical Secondary Monitor with IDE & Terminal Preview */}
      <group position={[-0.95, 1.02, -0.25]} rotation={[0.05, 0.35, 0]}>
        <Box args={[0.32, 0.55, 0.02]} castShadow><meshStandardMaterial color="#1e293b" /></Box>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.28, 0.5]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        {/* Colorful Terminal / Logs lines on vertical screen */}
        <mesh position={[-0.08, 0.18, 0.012]}><planeGeometry args={[0.08, 0.015]} /><meshBasicMaterial color="#22c55e" /></mesh>
        <mesh position={[0.02, 0.18, 0.012]}><planeGeometry args={[0.1, 0.015]} /><meshBasicMaterial color="#38bdf8" /></mesh>
        <mesh position={[-0.02, 0.14, 0.012]}><planeGeometry args={[0.2, 0.012]} /><meshBasicMaterial color="#94a3b8" /></mesh>
        <mesh position={[-0.04, 0.10, 0.012]}><planeGeometry args={[0.16, 0.012]} /><meshBasicMaterial color="#a855f7" /></mesh>
        <mesh position={[0, 0.06, 0.012]}><planeGeometry args={[0.24, 0.012]} /><meshBasicMaterial color="#38bdf8" /></mesh>
        <mesh position={[-0.03, 0.02, 0.012]}><planeGeometry args={[0.18, 0.012]} /><meshBasicMaterial color="#f59e0b" /></mesh>
        <mesh position={[0, -0.02, 0.012]}><planeGeometry args={[0.22, 0.012]} /><meshBasicMaterial color="#34d399" /></mesh>
        <mesh position={[-0.05, -0.06, 0.012]}><planeGeometry args={[0.14, 0.012]} /><meshBasicMaterial color="#64748b" /></mesh>
        <mesh position={[0, -0.10, 0.012]}><planeGeometry args={[0.22, 0.012]} /><meshBasicMaterial color="#38bdf8" /></mesh>
        <mesh position={[-0.02, -0.14, 0.012]}><planeGeometry args={[0.18, 0.012]} /><meshBasicMaterial color="#ec4899" /></mesh>
      </group>

      {/* Keyboard & Mouse */}
      <Box args={[0.7, 0.015, 0.22]} position={[0, 0.77, 0.08]}><meshStandardMaterial color="#334155" /></Box>
      <Box args={[0.08, 0.015, 0.12]} position={[0.55, 0.77, 0.08]}><meshStandardMaterial color="#475569" /></Box>
      <Cylinder args={[0.045, 0.04, 0.09]} position={[-0.55, 0.81, 0.1]} castShadow>
        <meshStandardMaterial color={activeColor} />
      </Cylinder>

      {/* Ergonomic Office Chair */}
      <group position={[0, 0, 0.55]}>
        <RoundedBox args={[0.55, 0.08, 0.5]} radius={0.02} position={[0, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#1e293b" />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.55, 0.08]} radius={0.02} position={[0, 0.7, 0.24]} castShadow>
          <meshStandardMaterial color="#334155" />
        </RoundedBox>
        <Cylinder args={[0.04, 0.04, 0.4]} position={[0, 0.2, 0]}><meshStandardMaterial color="#475569" /></Cylinder>
        <Cylinder args={[0.25, 0.25, 0.03, 5]} position={[0, 0.02, 0]}><meshStandardMaterial color="#0f172a" /></Cylinder>
      </group>

      {/* Desk Title Sign */}
      <Text position={[0, 0.8, -0.6]} fontSize={0.16} color="#f8fafc" fontWeight="bold" anchorX="center" anchorY="middle">
        {station.label}
      </Text>

      {/* Floor Spotlight Highlight */}
      {(hovered || isSelected || isWorking) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 2.2]} />
          <meshBasicMaterial color={activeColor} opacity={isWorking ? 0.35 : 0.15} transparent />
        </mesh>
      )}

      {/* Render the Avatar for this Station */}
      <CharacterAvatar 
        agent={displayAgent}
        station={station}
        isWorking={isWorking}
        isSelected={isSelected}
        onClick={onClick}
        activeColor={activeColor}
      />
    </group>
  );
}

function FullOfficeEnvironment() {
  return (
    <group>
      {/* 1. Main Office Floor (Bright slate blue-grey) */}
      <Plane args={[48, 26]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#d6870f" roughness={0.5} />
      </Plane>
      {/* Grid Floor Pattern */}
      <gridHelper args={[48, 26, '#b45309', '#eab308']} position={[0, 0.01, 0]} />

      {/* 2. Executive Suite Glass Room (Left Top) */}
      <group position={[-14, 0, -6.5]}>
        {/* Soft Blue Luxury Carpet */}
        <RoundedBox args={[11, 0.02, 7.5]} radius={0.2} position={[0, 0.015, 0]} receiveShadow>
          <meshStandardMaterial color="#0284c7" opacity={0.14} transparent />
        </RoundedBox>
        {/* Glass Partition Walls with Blue Frame */}
        {/* Back Wall */}
        <Box args={[11, 2.8, 0.06]} position={[0, 1.4, -3.75]}>
          <meshStandardMaterial color="#38bdf8" opacity={0.25} transparent roughness={0.1} />
        </Box>
        {/* Right Wall */}
        <Box args={[0.06, 2.8, 7.5]} position={[5.5, 1.4, 0]}>
          <meshStandardMaterial color="#38bdf8" opacity={0.25} transparent roughness={0.1} />
        </Box>
        {/* Front Glass Wall with Door Gap */}
        <Box args={[4.5, 2.8, 0.06]} position={[-3.25, 1.4, 3.75]}>
          <meshStandardMaterial color="#38bdf8" opacity={0.25} transparent roughness={0.1} />
        </Box>
        <Box args={[4.5, 2.8, 0.06]} position={[3.25, 1.4, 3.75]}>
          <meshStandardMaterial color="#38bdf8" opacity={0.25} transparent roughness={0.1} />
        </Box>
        {/* Wall Frame Border */}
        <Box args={[11, 0.08, 0.08]} position={[0, 2.8, -3.75]}><meshStandardMaterial color="#0284c7" /></Box>
        <Box args={[0.08, 0.08, 7.5]} position={[5.5, 2.8, 0]}><meshStandardMaterial color="#0284c7" /></Box>
        
        {/* Executive Room Sign */}
        <Text position={[-3.2, 2.5, 3.8]} fontSize={0.22} color="#38bdf8" fontWeight="bold">
          EXECUTIVE SUITE (C-LEVEL)
        </Text>
      </group>

      {/* 3. Recreation & Ping Pong Zone (Left Bottom) */}
      <group position={[-14, 0, 7.5]}>
        <RoundedBox args={[11, 0.02, 6.5]} radius={0.2} position={[0, 0.015, 0]} receiveShadow>
          <meshStandardMaterial color="#475569" opacity={0.1} transparent />
        </RoundedBox>
        <PingPongTable position={[-1.5, 0, 0.5]} />
        <Text position={[-5, 0.03, -2.8]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#334155" fontWeight="bold">
          RECREATION & FINANCE ZONE
        </Text>
      </group>

      {/* 4. Conference Boardroom (Right Top) */}
      <group position={[17, 0, -5]}>
        <BoardroomArea position={[0, 0, 0]} />
        <Text position={[-2.8, 0.03, -3.2]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#38bdf8" fontWeight="bold">
          CONFERENCE BOARDROOM
        </Text>
      </group>

      {/* 5. Lounge & Breakout Area (Right Bottom) */}
      <group position={[17, 0, 5.5]}>
        <LoungeArea position={[0, 0, 0]} />
        <Text position={[-2.8, 0.03, -2.8]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#334155" fontWeight="bold">
          LOUNGE & BREAKOUT ZONE
        </Text>
      </group>

      {/* 6. Coffee Bar & Pantry */}
      <CoffeeBar position={[0, 0, -10.5]} />
      <Text position={[-0.5, 1.7, -8.5]} fontSize={0.2} color="#94a3b8" fontWeight="bold" anchorX="center">
        ☕ Coffee Bar & Pantry
      </Text>

      {/* 7. Water Cooler */}
      <WaterCooler position={[4.5, 0, 7.5]} />

      {/* 8. Lush Decorative Office Plants */}
      <Plant position={[-16.5, 0, -8]} />
      <Plant position={[-6.5, 0, -8]} />
      <Plant position={[-16.5, 0, 8]} />
      <Plant position={[-6.5, 0, 8]} />
      <Plant position={[5.0, 0, -8]} />
      <Plant position={[15.5, 0, -8]} />
      <Plant position={[15.5, 0, 8]} />
    </group>
  );
}

export default function ThreeDOffice({ agents, onStartChatWithAgent }: VirtualOfficeProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="w-full h-full relative" style={{ width: '100%', height: '100%', minHeight: '100%' }}>
      <Canvas shadows camera={{ position: [0, 22, 18], fov: 45 }} style={{ width: '100%', height: '100%' }}>
        {/* Bright, clean environment lighting */}
        <color attach="background" args={['#f1f5f9']} />
        <ambientLight intensity={2.2} />
        
        {/* Main Sun/Ceiling Light */}
        <directionalLight 
          position={[12, 28, 15]} 
          intensity={2.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0001}
        />
        {/* Soft Secondary Fill Light */}
        <directionalLight 
          position={[-15, 20, -10]} 
          intensity={0.8} 
          color="#38bdf8"
        />

        {/* Full 3D Office Environment Matching 2D */}
        <FullOfficeEnvironment />
        
        {/* Render all 14 Workstations with guaranteed fallback agent */}
        {ALL_STATIONS.map((station) => {
          const liveAgent = agents.find(a => {
            if (station.empId && a.id === station.empId) return true;
            const roleStr = (a.role || '').toLowerCase();
            const titleStr = (a.title || '').toLowerCase();
            const nameStr = (a.name || '').toLowerCase();
            const match = station.roleMatch.toLowerCase();
            return roleStr.includes(match) || titleStr.includes(match) || nameStr.includes(match);
          });

          // Always ensure an agent avatar is present
          const agent = liveAgent || (DEFAULT_FALLBACK_AGENTS[station.id] as Agent);
          const isSelected = selectedAgentId ? (agent && agent.id === selectedAgentId) : false;
          
          return (
            <Workstation 
              key={station.id} 
              station={station}
              agent={agent}
              isSelected={isSelected}
              onClick={() => agent && setSelectedAgentId(agent.id)}
            />
          );
        })}

        {/* Camera Orbit Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.15}
          minDistance={6}
          maxDistance={40}
        />
      </Canvas>

      {/* Selected Agent Live Inspector & Command Card */}
      {selectedAgent && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1px solid #38bdf8',
          padding: '1.25rem',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25)',
          zIndex: 40,
          width: '340px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: (selectedAgent as any).status === 'WORKING' ? '#22c55e' : '#f59e0b', boxShadow: `0 0 8px ${(selectedAgent as any).status === 'WORKING' ? '#22c55e' : '#f59e0b'}` }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>{selectedAgent.name}</h3>
            </div>
            <button 
              onClick={() => setSelectedAgentId(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.75rem' }}>
            {selectedAgent.title}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#090d16', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #1e293b', marginBottom: '0.85rem', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>STATUS LIVE</span>
              <strong style={{ color: (selectedAgent as any).status === 'WORKING' ? '#34d399' : '#fbbf24' }}>
                {(selectedAgent as any).status === 'WORKING' ? '⚡ Sedang Bertugas' : '💤 Standby / Idle'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>BIAYA AI HARI INI</span>
              <strong style={{ color: '#38bdf8' }}>
                ${parseFloat((selectedAgent as any).ai_cost_used_today || '0.00').toFixed(4)}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>AGENT ID</span>
              <code style={{ color: '#cbd5e1' }}>{selectedAgent.id}</code>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>AUTONOMI</span>
              <strong style={{ color: '#a855f7' }}>Level {selectedAgent.autonomy_level || 4} / 5</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => {
                if (selectedAgent && onStartChatWithAgent) {
                  onStartChatWithAgent(selectedAgent);
                }
              }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                background: 'linear-gradient(to right, #0284c7, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.6rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ⚡ Tugaskan / Chat Cepat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
