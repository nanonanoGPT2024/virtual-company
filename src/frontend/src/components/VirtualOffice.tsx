import { useState } from 'react';
import ThreeDOffice from './ThreeD/ThreeDOffice';

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
  viewMode?: '2d' | '3d';
  onToggleViewMode?: (mode: '2d' | '3d') => void;
  onStartChatWithAgent?: (agent: Agent) => void;
}

interface StationLayout {
  cx: number;
  cy: number;
  label: string;
  color: string;
  emoji: string;
  roleMatch: string;
}

export default function VirtualOffice({ agents, viewMode = '2d', onToggleViewMode, onStartChatWithAgent }: VirtualOfficeProps) {
  const [internalMode, setInternalMode] = useState<'2d' | '3d'>('2d');
  const currentMode = onToggleViewMode ? viewMode : internalMode;
  const setMode = onToggleViewMode || setInternalMode;

  // 14 stations mapped accurately to the 2D layout and DB Seed roles
  const stations: StationLayout[] = [
    { cx: 90, cy: 95, label: 'CEO Room', color: '#0284c7', emoji: '👑', roleMatch: 'CEO' },
    { cx: 190, cy: 95, label: 'CFO Desk', color: '#f59e0b', emoji: '📊', roleMatch: 'CFO' },
    { cx: 140, cy: 240, label: 'Legal/Fin Desk', color: '#eab308', emoji: '⚖️', roleMatch: 'Legal' },
    { cx: 350, cy: 90, label: 'CTO Desk', color: '#38bdf8', emoji: '🛠️', roleMatch: 'CTO' },
    { cx: 450, cy: 90, label: 'CPO Desk', color: '#10b981', emoji: '💡', roleMatch: 'CPO' },
    { cx: 550, cy: 90, label: 'CMO Desk', color: '#a855f7', emoji: '📢', roleMatch: 'Marketing' },
    { cx: 650, cy: 90, label: 'CRO Desk', color: '#ec4899', emoji: '🤝', roleMatch: 'Sales' },
    { cx: 350, cy: 190, label: 'Architect Desk', color: '#15803d', emoji: '💻', roleMatch: 'Architect' },
    { cx: 450, cy: 190, label: 'Dev Desk', color: '#047857', emoji: '💾', roleMatch: 'Developer' },
    { cx: 550, cy: 190, label: 'DevOps Desk', color: '#0891b2', emoji: '🚀', roleMatch: 'DevOps' },
    { cx: 650, cy: 190, label: 'QA Desk', color: '#b91c1c', emoji: '🔍', roleMatch: 'QA' },
    { cx: 450, cy: 290, label: 'PM Desk', color: '#6366f1', emoji: '📅', roleMatch: 'Product Manager' },
    { cx: 550, cy: 290, label: 'UX Desk', color: '#f43f5e', emoji: '✏️', roleMatch: 'UX' },
    { cx: 650, cy: 290, label: 'Researcher Desk', color: '#84cc16', emoji: '🔬', roleMatch: 'Researcher' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* If inside normal view without external toggle, show toggle buttons */}
      {!onToggleViewMode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button 
              onClick={() => setMode('2d')}
              style={{ 
                padding: '6px 14px', 
                borderRadius: '6px', 
                border: 'none', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                background: currentMode === '2d' ? '#0284c7' : 'transparent',
                color: currentMode === '2d' ? '#ffffff' : '#94a3b8'
              }}
            >
              🗺️ 2D Floorplan
            </button>
            <button 
              onClick={() => setMode('3d')}
              style={{ 
                padding: '6px 14px', 
                borderRadius: '6px', 
                border: 'none', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                background: currentMode === '3d' ? '#0284c7' : 'transparent',
                color: currentMode === '3d' ? '#ffffff' : '#94a3b8'
              }}
            >
              🎮 3D Roblox Mode
            </button>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {currentMode === '3d' ? 'Drag to rotate • Scroll to zoom' : 'Click agent desk to inspect'}
          </span>
        </div>
      )}

      {currentMode === '3d' ? (
        <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', background: '#020617' }}>
          <ThreeDOffice agents={agents} onStartChatWithAgent={onStartChatWithAgent} />
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg
            viewBox="0 0 800 400"
            className="w-full h-auto max-h-full rounded-lg border border-slate-700 bg-slate-900 shadow-2xl select-none"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          >
            {/* Background Floor Texture Grid */}
            <defs>
              <pattern id="officeGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#0f172a" />
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#officeGrid)" />

            {/* 1. EXECUTIVE SUITE ZONE */}
            <rect x="20" y="20" width="240" height="150" fill="#0369a1" opacity="0.08" rx="4" />
            <rect x="20" y="20" width="240" height="150" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
            <text x="30" y="35" fill="#38bdf8" fontSize="8" fontWeight="bold">EXECUTIVE SUITE (C-LEVEL)</text>
            
            <rect x="30" y="45" width="220" height="95" fill="#0b1329" opacity="0.4" rx="3" />
            <rect x="30" y="45" width="220" height="95" fill="none" stroke="#1e293b" strokeWidth="1" rx="3" />
            
            <rect x="235" y="20" width="20" height="4" fill="#f59e0b" rx="0.5" />
            <rect x="25" y="135" width="20" height="4" fill="#f59e0b" rx="0.5" />
            
            <circle cx="245" cy="30" r="4" fill="#d97706" />
            <circle cx="245" cy="28" r="5" fill="#16a34a" />
            <circle cx="245" cy="26" r="3" fill="#22c55e" />
            
            <circle cx="35" cy="142" r="3" fill="#d97706" />
            <circle cx="35" cy="140" r="4" fill="#15803d" />
            
            {/* 2. RECREATION & FINANCE ZONE */}
            <rect x="20" y="190" width="240" height="190" fill="#111827" opacity="0.05" rx="4" />
            <rect x="20" y="190" width="240" height="190" fill="none" stroke="#475569" strokeWidth="1.5" rx="4" />
            <text x="30" y="208" fill="#475569" fontSize="9" fontWeight="700" letterSpacing="0.05em">RECREATION & FINANCE ZONE</text>
            
            <g transform="translate(45, 290)">
              <rect x="-2" y="-2" width="64" height="38" fill="#000000" opacity="0.15" rx="2" />
              <rect x="0" y="0" width="60" height="34" fill="#15803d" stroke="#ffffff" strokeWidth="1" rx="1.5" />
              <line x1="30" y1="0" x2="30" y2="34" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="0" y1="17" x2="60" y2="17" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 1" />
              <rect x="-1" y="16" width="2" height="2" fill="#334155" />
              <rect x="59" y="16" width="2" height="2" fill="#334155" />
              <circle cx="15" cy="10" r="2.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
              <circle cx="45" cy="24" r="2.5" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" />
              <circle cx="22" cy="17" r="1.5" fill="#ffffff" />
            </g>

            {/* 3. ENGINEERING, PRODUCT & RESEARCH OPEN SPACE */}
            <rect x="280" y="20" width="500" height="360" fill="#1e293b" opacity="0.08" rx="6" />
            <rect x="280" y="20" width="500" height="360" fill="none" stroke="#334155" strokeWidth="1.5" rx="6" />
            <text x="290" y="35" fill="#64748b" fontSize="8" fontWeight="bold">ENGINEERING & PRODUCT OPEN SPACE</text>

            <rect x="280" y="20" width="20" height="4" fill="#f59e0b" rx="0.2" />
            <rect x="760" y="20" width="20" height="4" fill="#f59e0b" rx="0.2" />
            <rect x="320" y="20" width="14" height="14" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" rx="1" />
            <rect x="324" y="28" width="6" height="5" fill="#1f2937" rx="0.5" />
            <circle cx="327" cy="23" r="1.5" fill="#ffffff" />
            <rect x="345" y="20" width="12" height="14" fill="#1f2937" stroke="#111827" strokeWidth="0.5" rx="1" />
            <text x="365" y="32" fill="#64748b" fontSize="8" fontWeight="bold">Coffee Bar & Pantry</text>

            <rect x="520" y="20" width="260" height="130" fill="#0b1329" opacity="0.4" rx="4" />
            <rect x="520" y="20" width="260" height="130" fill="none" stroke="#0284c7" strokeWidth="1.5" rx="4" />
            <text x="530" y="35" fill="#38bdf8" fontSize="8" fontWeight="bold">CONFERENCE BOARDROOM</text>
            
            <ellipse cx="650" cy="85" rx="45" ry="22" fill="#7a4b3a" stroke="#5c382b" strokeWidth="1.5" />
            <ellipse cx="650" cy="85" rx="35" ry="15" fill="#5c382b" stroke="none" />
            
            <circle cx="593" cy="85" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />
            <circle cx="707" cy="85" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />
            <circle cx="625" cy="55" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />
            <circle cx="675" cy="55" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />
            <circle cx="625" cy="115" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />
            <circle cx="675" cy="115" r="4.5" fill="#2b343d" stroke="#4a6785" strokeWidth="1.5" />

            <g transform="translate(520, 255)">
              <rect x="0" y="0" width="260" height="115" fill="#3b82f6" opacity="0.1" rx="8" />
              <rect x="0" y="0" width="260" height="115" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" rx="8" />
              <text x="10" y="15" fill="#64748b" fontSize="8" fontWeight="bold">LOUNGE & BREAKOUT ZONE</text>
              
              <rect x="20" y="30" width="45" height="20" fill="#4B9FE1" stroke="#2563eb" strokeWidth="1" rx="3" />
              <rect x="24" y="33" width="37" height="12" fill="#1d4ed8" rx="1.5" />
              
              <rect x="80" y="30" width="45" height="20" fill="#E06A6A" stroke="#dc2626" strokeWidth="1" rx="3" />
              <rect x="84" y="33" width="37" height="12" fill="#b91c1c" rx="1.5" />
              
              <rect x="140" y="30" width="45" height="20" fill="#7C7DA0" stroke="#555680" strokeWidth="1" rx="3" />
              <rect x="144" y="33" width="37" height="12" fill="#404160" rx="1.5" />
              
              <rect x="40" y="65" width="120" height="26" fill="#78350f" stroke="#451a03" strokeWidth="1.5" rx="3" />
              <circle cx="100" cy="78" r="3" fill="#ffffff" />
              <circle cx="100" cy="78" r="2" fill="#16a34a" />

              <g transform="translate(210, 45)">
                <circle cx="0" cy="40" r="6" fill="#475569" />
                <line x1="0" y1="40" x2="0" y2="5" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M -10 5 L 10 5 L 7 -10 L -7 -10 Z" fill="#fef08a" stroke="#eab308" strokeWidth="0.5" />
                <circle cx="0" cy="-2" r="4" fill="#fef08a" opacity="0.7" />
              </g>
            </g>

            <rect x="480" y="330" width="18" height="50" fill="#1e293b" stroke="#334155" rx="2" />
            <rect x="483" y="335" width="12" height="15" fill="#38bdf8" rx="1" opacity="0.8" />
            <path d="M 483 335 Q 489 320 495 335 Z" fill="#38bdf8" opacity="0.6" stroke="#0ea5e9" strokeWidth="0.5" />
            <circle cx="486" cy="356" r="1.5" fill="#ef4444" />
            <circle cx="492" cy="356" r="1.5" fill="#3b82f6" />

            <rect x="286" y="240" width="22" height="20" fill="#4b5563" stroke="#334155" rx="2" />
            <rect x="290" y="243" width="14" height="2" fill="#10b981" />
            <rect x="288" y="252" width="18" height="3" fill="#cbd5e1" rx="0.5" />

            <circle cx="295" cy="100" r="4" fill="#d97706" />
            <circle cx="295" cy="98" r="5" fill="#16a34a" />
            <circle cx="760" cy="180" r="4" fill="#d97706" />
            <circle cx="760" cy="178" r="5" fill="#16a34a" />

            {/* Department dividers */}
            <line x1="400" y1="55" x2="400" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="500" y1="55" x2="500" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="600" y1="55" x2="600" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="400" y1="155" x2="400" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="500" y1="155" x2="500" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="600" y1="155" x2="600" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Render Workstations */}
            {stations.map((station, index) => {
              const matchedAgent = agents.find((a) =>
                a.title.toLowerCase().includes(station.roleMatch.toLowerCase())
              );
              const isOccupied = !!matchedAgent;
              const activeColor = isOccupied ? station.color : '#475569';

              return (
                <g key={index} style={{ cursor: matchedAgent ? 'pointer' : 'default' }} onClick={() => matchedAgent && onStartChatWithAgent && onStartChatWithAgent(matchedAgent)}>
                  <rect 
                    x={station.cx - 27} 
                    y={station.cy - 12} 
                    width="54" 
                    height="24" 
                    fill="#1e293b" 
                    stroke={activeColor} 
                    strokeWidth={isOccupied ? 2 : 1} 
                    rx="3" 
                  />
                  <rect 
                    x={station.cx - 18} 
                    y={station.cy - 10} 
                    width="36" 
                    height="18" 
                    fill="#0f172a" 
                    rx="1.5" 
                  />
                  <path 
                    d={`M ${station.cx - 25} ${station.cy - 15} Q ${station.cx} ${station.cy - 20} ${station.cx + 25} ${station.cy - 15}`} 
                    fill="none" 
                    stroke="#020617" 
                    strokeWidth="6" 
                  />
                  <path 
                    d={`M ${station.cx - 24} ${station.cy - 14.5} Q ${station.cx} ${station.cy - 19.5} ${station.cx + 24} ${station.cy - 14.5}`} 
                    fill="none" 
                    stroke={isOccupied ? '#06b6d4' : '#475569'} 
                    strokeWidth="2.5" 
                  />
                  <path 
                    d={`M ${station.cx - 6} ${station.cy - 11} L ${station.cx + 6} ${station.cy - 11} L ${station.cx} ${station.cy - 7} Z`} 
                    fill="#64748b" 
                  />
                  <rect 
                    x={station.cx - 25} 
                    y={station.cy - 7} 
                    width="3" 
                    height="11" 
                    fill="#020617" 
                    stroke={isOccupied ? '#0ea5e9' : '#475569'} 
                    strokeWidth="0.5" 
                    rx="0.5" 
                    transform={`rotate(-15, ${station.cx - 23.5}, ${station.cy - 1.5})`}
                  />
                  <rect 
                    x={station.cx + 17} 
                    y={station.cy - 11} 
                    width="8" 
                    height="20" 
                    fill="#020617" 
                    stroke="#475569" 
                    rx="1" 
                  />
                  <line 
                    x1={station.cx + 18} 
                    y1={station.cy - 9} 
                    x2={station.cx + 18} 
                    y2={station.cy + 7} 
                    stroke={isOccupied ? station.color : '#475569'} 
                    strokeWidth="0.75" 
                  />
                  <rect 
                    x={station.cx - 9} 
                    y={station.cy + 1} 
                    width="18" 
                    height="4" 
                    fill="#334155" 
                    rx="0.5" 
                  />
                  <circle cx={station.cx + 12} cy={station.cy + 3} r="1.5" fill="#475569" />
                  <circle cx={station.cx - 13} cy={station.cy - 4} r="2" fill="#ef4444" />
                  {(index % 2 === 0 || station.roleMatch === 'CEO') && (
                    <rect x={station.cx - 20} y={station.cy - 10} width="5" height="5" fill="#030712" rx="0.5" />
                  )}
                  {index % 3 === 1 && station.roleMatch !== 'CEO' && (
                    <g>
                      <circle cx={station.cx - 22} cy={station.cy - 4} r="2" fill="#b45309" />
                      <circle cx={station.cx - 22} cy={station.cy - 5} r="1.5" fill="#22c55e" />
                    </g>
                  )}
                  <circle cx={station.cx - 31} cy={station.cy + 6} r="3" fill="#475569" stroke="#334155" strokeWidth="0.5" />
                  <line x1={station.cx - 31} y1={station.cy + 4} x2={station.cx - 31} y2={station.cy + 8} stroke="#111827" strokeWidth="0.5" />
                  
                  {(index % 3 === 0 || station.roleMatch === 'CFO' || station.roleMatch === 'CEO') && (
                    <g>
                      <rect x={station.cx + 10} y={station.cy - 7} width="6" height="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" transform="rotate(10)" />
                      <rect x={station.cx + 9} y={station.cy - 6} width="6" height="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                    </g>
                  )}

                  {isOccupied && (
                    <path 
                      d={`M ${station.cx - 13} ${station.cy - 6} Q ${station.cx - 14} ${station.cy - 8} ${station.cx - 13} ${station.cy - 10} T ${station.cx - 13} ${station.cy - 13}`} 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="0.5" 
                      className="animate-steam"
                    />
                  )}

                  <rect 
                    x={station.cx - 9} 
                    y={station.cy + 19} 
                    width="18" 
                    height="4" 
                    fill="#4a6785" 
                    stroke="#2b343d" 
                    strokeWidth="1.5" 
                    rx="0.5" 
                  />
                  <rect 
                    x={station.cx - 10} 
                    y={station.cy + 11} 
                    width="20" 
                    height="9" 
                    fill="#4a6785" 
                    stroke="#2b343d" 
                    strokeWidth="1.5" 
                    rx="1.5" 
                  />
                  <text
                    x={station.cx}
                    y={station.cy - 16}
                    fill={isOccupied ? '#f8fafc' : '#64748b'}
                    fontSize="8"
                    fontWeight={isOccupied ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {station.label}
                  </text>

                  {isOccupied ? (
                    <g>
                      <g className="animate-head">
                        <path 
                          d={`M ${station.cx - 7} ${station.cy + 17} Q ${station.cx} ${station.cy + 13} ${station.cx + 7} ${station.cy + 17} L ${station.cx + 6} ${station.cy + 11} L ${station.cx - 6} ${station.cy + 11} Z`} 
                          fill={station.color} 
                        />
                        <circle cx={station.cx} cy={station.cy + 9} r="7.5" fill="#fbcfe8" stroke="#db2777" strokeWidth="0.5" />
                        <path d={`M ${station.cx - 6.5} ${station.cy + 6} A 6.5 6.5 0 0 1 ${station.cx + 6.5} ${station.cy + 6}`} fill="none" stroke="#374151" strokeWidth="1.5" />
                        <circle cx={station.cx - 4.5} cy={station.cy + 10} r="1.5" fill="#f43f5e" opacity="0.4" />
                        <circle cx={station.cx + 4.5} cy={station.cy + 10} r="1.5" fill="#f43f5e" opacity="0.4" />
                        <circle cx={station.cx - 2.5} cy={station.cy + 7.5} r="1" fill="#000" />
                        <circle cx={station.cx + 2.5} cy={station.cy + 7.5} r="1" fill="#000" />
                        <path d={`M ${station.cx - 1.5} ${station.cy + 10} Q ${station.cx} ${station.cy + 11.5} ${station.cx + 1.5} ${station.cy + 10}`} fill="none" stroke="#000" strokeWidth="0.5" />
                        <text x={station.cx} y={station.cy + 4} fill="#fff" fontSize="7" textAnchor="middle">
                          {station.emoji}
                        </text>
                      </g>
                      <circle cx={station.cx - 4} cy={station.cy + 2} r="1.5" fill="#fbcfe8" className="animate-typing-left" />
                      <circle cx={station.cx + 4} cy={station.cy + 2} r="1.5" fill="#fbcfe8" className="animate-typing-right" />
                      <text
                        x={station.cx}
                        y={station.cy + 27}
                        fill={station.color}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {matchedAgent.name}
                      </text>
                    </g>
                  ) : (
                    <text
                      x={station.cx}
                      y={station.cy + 7}
                      fill="#475569"
                      fontSize="8"
                      textAnchor="middle"
                      opacity="0.7"
                    >
                      (Vacant)
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
