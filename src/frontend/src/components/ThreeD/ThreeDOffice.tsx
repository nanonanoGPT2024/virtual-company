import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane, Cylinder, RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';

interface Agent {
  id: string;
  name: string;
  title: string;
  autonomy_level: number;
}

interface VirtualOfficeProps {
  agents: Agent[];
  onStartChatWithAgent?: (agent: Agent) => void;
}

// 14 stations mapped accurately to the 2D layout
const ALL_STATIONS = [
  // Executive Suite (Left Top)
  { id: 'ceo', x: -14, z: -5, label: 'CEO Room', roleMatch: 'CEO', color: '#0284c7', emoji: '👑' },
  { id: 'cfo', x: -9, z: -5, label: 'CFO Desk', roleMatch: 'CFO', color: '#f59e0b', emoji: '📊' },
  
  // Finance & Recreation (Left Bottom)
  { id: 'finops', x: -11.5, z: 2, label: 'FinOps Desk', roleMatch: 'Financial Ops', color: '#eab308', emoji: '🪙' },

  // Open Space - Row 1 (Top)
  { id: 'cto', x: -2.5, z: -5.5, label: 'CTO Desk', roleMatch: 'CTO', color: '#38bdf8', emoji: '🛠️' },
  { id: 'cpo', x: 2.5, z: -5.5, label: 'CPO Desk', roleMatch: 'CPO', color: '#10b981', emoji: '💡' },
  { id: 'cmo', x: 7.5, z: -5.5, label: 'CMO Desk', roleMatch: 'CMO', color: '#a855f7', emoji: '📢' },
  { id: 'cro', x: 12.5, z: -5.5, label: 'CRO Desk', roleMatch: 'CRO', color: '#ec4899', emoji: '🤝' },

  // Open Space - Row 2 (Middle)
  { id: 'arch', x: -2.5, z: -0.5, label: 'Architect Desk', roleMatch: 'Architect', color: '#15803d', emoji: '💻' },
  { id: 'be', x: 2.5, z: -0.5, label: 'BE Dev Desk', roleMatch: 'Backend', color: '#047857', emoji: '💾' },
  { id: 'fe', x: 7.5, z: -0.5, label: 'FE Dev Desk', roleMatch: 'Frontend', color: '#0891b2', emoji: '🎨' },
  { id: 'qa', x: 12.5, z: -0.5, label: 'QA Desk', roleMatch: 'QA', color: '#b91c1c', emoji: '🔍' },

  // Open Space - Row 3 (Bottom)
  { id: 'pm', x: 2.5, z: 4.5, label: 'PM Desk', roleMatch: 'Product Manager', color: '#6366f1', emoji: '📅' },
  { id: 'ux', x: 7.5, z: 4.5, label: 'UX Desk', roleMatch: 'UX', color: '#f43f5e', emoji: '✏️' },
  { id: 'research', x: 12.5, z: 4.5, label: 'Researcher Desk', roleMatch: 'Researcher', color: '#84cc16', emoji: '🔬' },
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
function Workstation({ station, agent, isSelected, onClick }: any) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, 'pointer', 'auto');
  
  const isOccupied = !!agent;
  const activeColor = isOccupied ? station.color : '#475569';
  
  // Bobbing animation for seated avatar
  const avatarRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (avatarRef.current && isOccupied) {
      avatarRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5 + station.x) * 0.04 + 0.95;
    }
  });

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
          <meshStandardMaterial color="#334155" roughness={0.3} />
        </Box>
        {/* Screen Display Face with Role Accent Glow */}
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[1.44, 0.39]} />
          <meshBasicMaterial color={isOccupied ? activeColor : '#0f172a'} />
        </mesh>
        {/* Stand */}
        <Cylinder args={[0.02, 0.02, 0.22]} position={[0, -0.22, -0.05]}><meshStandardMaterial color="#10b981" /></Cylinder>
        <Cylinder args={[0.15, 0.15, 0.02]} position={[0, -0.33, 0]}><meshStandardMaterial color="#10b981" /></Cylinder>
      </group>

      {/* Vertical Secondary Monitor on the Left */}
      <group position={[-0.95, 1.02, -0.25]} rotation={[0.05, 0.35, 0]}>
        <Box args={[0.32, 0.55, 0.02]} castShadow><meshStandardMaterial color="#94a3b8" /></Box>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.28, 0.5]} />
          <meshBasicMaterial color={isOccupied ? '#10b981' : '#0f172a'} />
        </mesh>
      </group>

      {/* Keyboard & Mouse */}
      <Box args={[0.7, 0.015, 0.22]} position={[0, 0.77, 0.08]}><meshStandardMaterial color="#cbd5e1" /></Box>
      <Box args={[0.08, 0.015, 0.12]} position={[0.55, 0.77, 0.08]}><meshStandardMaterial color="#94a3b8" /></Box>

      {/* Coffee Mug with Role Color */}
      <Cylinder args={[0.045, 0.04, 0.09]} position={[-0.55, 0.81, 0.1]} castShadow>
        <meshStandardMaterial color={activeColor} />
      </Cylinder>

      {/* Ergonomic Mesh Office Chair */}
      <group position={[0, 0, 0.55]}>
        <RoundedBox args={[0.55, 0.08, 0.5]} radius={0.02} position={[0, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" />
        </RoundedBox>
        <RoundedBox args={[0.5, 0.55, 0.08]} radius={0.02} position={[0, 0.7, 0.22]} castShadow>
          <meshStandardMaterial color="#94a3b8" />
        </RoundedBox>
        {/* Chair Base & Wheel Hub */}
        <Cylinder args={[0.04, 0.04, 0.4]} position={[0, 0.2, 0]}><meshStandardMaterial color="#10b981" /></Cylinder>
        <Cylinder args={[0.25, 0.25, 0.03, 5]} position={[0, 0.02, 0]}><meshStandardMaterial color="#cbd5e1" /></Cylinder>
      </group>

      {/* Roblox-Style Character (Boxy, Vibrant & Cute) */}
      {isOccupied ? (
        <group ref={avatarRef} position={[0, 0.95, 0.5]}>
          {/* Head (Yellow Classic Roblox) */}
          <RoundedBox args={[0.36, 0.36, 0.36]} radius={0.04} position={[0, 0.58, 0]} castShadow>
            <meshStandardMaterial color="#fcd34d" roughness={0.3} />
          </RoundedBox>
          {/* Emoji Badge floating right on face */}
          <Text position={[0, 0.6, 0.19]} fontSize={0.16} anchorX="center" anchorY="middle">
            {station.emoji}
          </Text>

          {/* Torso (Colored to Agent Role) */}
          <RoundedBox args={[0.48, 0.52, 0.28]} radius={0.04} position={[0, 0.18, 0]} castShadow>
            <meshStandardMaterial color={activeColor} roughness={0.4} />
          </RoundedBox>

          {/* Left & Right Arms resting forward toward keyboard */}
          <RoundedBox args={[0.16, 0.42, 0.16]} radius={0.03} position={[-0.32, 0.18, -0.1]} rotation={[0.4, 0, 0.1]} castShadow>
            <meshStandardMaterial color={activeColor} />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.42, 0.16]} radius={0.03} position={[0.32, 0.18, -0.1]} rotation={[0.4, 0, -0.1]} castShadow>
            <meshStandardMaterial color={activeColor} />
          </RoundedBox>

          {/* Floating Agent Name Tag */}
          <group position={[0, 0.92, 0]}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[agent.name.length * 0.12 + 0.3, 0.22]} />
              <meshBasicMaterial color="#0f172a" opacity={0.85} transparent />
            </mesh>
            <Text fontSize={0.13} color="#0f172a" fontWeight="bold" anchorX="center" anchorY="middle">
              {agent.name}
            </Text>
          </group>
        </group>
      ) : (
        /* Vacant Label */
        <Text position={[0, 1.2, 0.2]} fontSize={0.18} color="#64748b" anchorX="center" anchorY="middle" rotation={[-Math.PI / 6, 0, 0]}>
          (Vacant)
        </Text>
      )}

      {/* Desk Title Sign */}
      <Text position={[0, 0.8, -0.6]} fontSize={0.15} color={isOccupied ? '#f8fafc' : '#64748b'} fontWeight={isOccupied ? 'bold' : 'normal'} anchorX="center" anchorY="middle">
        {station.label}
      </Text>

      {/* Floor Spotlight Highlight when Hovered or Selected */}
      {(hovered || isSelected) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 2.2]} />
          <meshBasicMaterial color={activeColor} opacity={0.25} transparent />
        </mesh>
      )}
    </group>
  );
}

// Complete Room with Floor Tiles, Transparent Walls, and Office Zones
function FullOfficeEnvironment() {
  return (
    <group>
      {/* 1. Main Office Floor (Bright slate blue-grey) */}
      <Plane args={[38, 22]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#d6870f" roughness={0.5} />
      </Plane>
      {/* Grid Floor Pattern */}
      <gridHelper args={[38, 38, '#b45309', '#eab308']} position={[0, 0.01, 0]} />

      {/* 2. Executive Suite Glass Room (Left Top) */}
      <group position={[-11.5, 0, -5]}>
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
      <group position={[-11.5, 0, 5.5]}>
        <RoundedBox args={[11, 0.02, 6.5]} radius={0.2} position={[0, 0.015, 0]} receiveShadow>
          <meshStandardMaterial color="#475569" opacity={0.1} transparent />
        </RoundedBox>
        <PingPongTable position={[-1.5, 0, 0.5]} />
        <Text position={[-5, 0.03, -2.8]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#334155" fontWeight="bold">
          RECREATION & FINANCE ZONE
        </Text>
      </group>

      {/* 4. Conference Boardroom (Right Top) */}
      <group position={[10, 0, -5]}>
        <BoardroomArea position={[0, 0, 0]} />
        <Text position={[-2.8, 0.03, -3.2]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#38bdf8" fontWeight="bold">
          CONFERENCE BOARDROOM
        </Text>
      </group>

      {/* 5. Lounge & Breakout Area (Right Bottom) */}
      <group position={[10, 0, 5.5]}>
        <LoungeArea position={[0, 0, 0]} />
        <Text position={[-2.8, 0.03, -2.8]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.22} color="#334155" fontWeight="bold">
          LOUNGE & BREAKOUT ZONE
        </Text>
      </group>

      {/* 6. Coffee Bar & Pantry */}
      <CoffeeBar position={[-0.5, 0, -8.5]} />
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
        
        {/* Render all 14 Workstations */}
        {ALL_STATIONS.map((station) => {
          const matchedAgent = agents.find(a => 
            a.title.toLowerCase().includes(station.roleMatch.toLowerCase())
          );
          
          return (
            <Workstation 
              key={station.id} 
              station={station}
              agent={matchedAgent}
              isSelected={matchedAgent && matchedAgent.id === selectedAgentId}
              onClick={() => matchedAgent && setSelectedAgentId(matchedAgent.id)}
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

      {/* Selected Agent Quick Inspector Card */}
      {selectedAgent && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #38bdf8',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
          zIndex: 35,
          maxWidth: '320px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 'bold' }}>{selectedAgent.name}</h3>
            <button 
              onClick={() => setSelectedAgentId(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>
            {selectedAgent.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span>ID: <code style={{ color: '#94a3b8' }}>{selectedAgent.id}</code></span>
            <span>&bull;</span>
            <span>Autonomy: <strong style={{ color: '#22c55e' }}>Lv. {selectedAgent.autonomy_level}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                if (selectedAgent && onStartChatWithAgent) {
                  onStartChatWithAgent(selectedAgent);
                }
              }}
              style={{ flex: 1, padding: '8px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              💬 Chat With {selectedAgent.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
