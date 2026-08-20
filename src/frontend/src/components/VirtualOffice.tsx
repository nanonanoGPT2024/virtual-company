

interface Agent {
  id: string;
  name: string;
  title: string;
  autonomy_level: number;
}

interface VirtualOfficeProps {
  agents: Agent[];
}

interface StationLayout {
  cx: number;
  cy: number;
  label: string;
  color: string;
  emoji: string;
  roleMatch: string; // matches a keyword in title
}

export default function VirtualOffice({ agents }: VirtualOfficeProps) {
  // Define layout stations for key PRD roles
  const stations: StationLayout[] = [
    { cx: 80, cy: 90, label: 'CEO Room', color: '#0284c7', emoji: '👑', roleMatch: 'CEO' },
    { cx: 140, cy: 90, label: 'CFO Desk', color: '#f59e0b', emoji: '📊', roleMatch: 'CFO' },
    { cx: 270, cy: 80, label: 'CTO Desk', color: '#38bdf8', emoji: '🛠️', roleMatch: 'CTO' },
    { cx: 350, cy: 80, label: 'CPO Desk', color: '#10b981', emoji: '💡', roleMatch: 'CPO' },
    { cx: 430, cy: 80, label: 'CMO Desk', color: '#a855f7', emoji: '📢', roleMatch: 'CMO' },
    { cx: 510, cy: 80, label: 'CRO Desk', color: '#ec4899', emoji: '🤝', roleMatch: 'CRO' },
    { cx: 270, cy: 180, label: 'Architect Desk', color: '#15803d', emoji: '💻', roleMatch: 'Architect' },
    { cx: 350, cy: 180, label: 'BE Dev Desk', color: '#047857', emoji: '💾', roleMatch: 'Backend' },
    { cx: 430, cy: 180, label: 'FE Dev Desk', color: '#0891b2', emoji: '🎨', roleMatch: 'Frontend' },
    { cx: 510, cy: 180, label: 'QA Desk', color: '#b91c1c', emoji: '🔍', roleMatch: 'QA' },
    { cx: 270, cy: 250, label: 'DevOps Desk', color: '#475569', emoji: '🚀', roleMatch: 'DevOps' },
    { cx: 350, cy: 250, label: 'PM Desk', color: '#6366f1', emoji: '📅', roleMatch: 'Product Manager' },
    { cx: 430, cy: 250, label: 'UX Desk', color: '#f43f5e', emoji: '✏️', roleMatch: 'UX' },
    { cx: 510, cy: 250, label: 'Researcher Desk', color: '#84cc16', emoji: '🔬', roleMatch: 'Researcher' },
    { cx: 80, cy: 210, label: 'FinOps Desk', color: '#eab308', emoji: '🪙', roleMatch: 'Financial Ops' }
  ];

  return (
    <div className="card">
      <h2>Virtual Office Floor Plan</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Top-down layout of the autonomous workspace. Active agents ({agents.length} online) are highlighted at their designated workstations.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* SVG Office Map */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
          <svg width="100%" height="500" viewBox="0 0 600 320" style={{ maxWidth: '900px' }}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="8" />
            
            {/* Office Walls / Rooms */}
            <rect x="10" y="10" width="580" height="300" fill="none" stroke="#334155" strokeWidth="2" rx="4" />
            
            {/* Executive Suite Room */}
            <rect x="20" y="20" width="180" height="130" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="30" y="40" fill="#64748b" fontSize="11" fontWeight="600">EXECUTIVE SUITE</text>
            
            {/* Engineering & Product Hub */}
            <rect x="220" y="20" width="360" height="280" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="230" y="40" fill="#64748b" fontSize="11" fontWeight="600">PRODUCTION & ENGINEERING HUB</text>

            {/* War Room & Finance Room */}
            <rect x="20" y="170" width="180" height="130" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="30" y="190" fill="#64748b" fontSize="11" fontWeight="600">FINANCE & WAR ROOM</text>
            
            {/* Render Workstation Desks and Occupying Agents */}
            {stations.map((station, idx) => {
              // Find agent occupying this desk based on role match
              const occupant = agents.find(a => a.title.toLowerCase().includes(station.roleMatch.toLowerCase()));
              
              return (
                <g key={idx}>
                  {/* Workstation Desk */}
                  <rect 
                    x={station.cx - 25} 
                    y={station.cy - 18} 
                    width="50" 
                    height="30" 
                    fill="#1e293b" 
                    stroke={occupant ? station.color : '#475569'} 
                    strokeWidth={occupant ? 2 : 1}
                    strokeDasharray={occupant ? '0' : '2'}
                    rx="3" 
                  />
                  <text 
                    x={station.cx} 
                    y={station.cy - 22} 
                    fill={occupant ? '#f8fafc' : '#64748b'} 
                    fontSize="9" 
                    fontWeight={occupant ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {station.label}
                  </text>
                  
                  {/* Occupant Avatar */}
                  {occupant ? (
                    <g>
                      <circle 
                        cx={station.cx} 
                        cy={station.cy + 3} 
                        r="12" 
                        fill={station.color} 
                        stroke="#f8fafc" 
                        strokeWidth="1.5" 
                      />
                      <text 
                        x={station.cx} 
                        y={station.cy + 7} 
                        fill="#fff" 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {station.emoji}
                      </text>
                      <text 
                        x={station.cx} 
                        y={station.cy + 24} 
                        fill={station.color} 
                        fontSize="9" 
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {occupant.name}
                      </text>
                    </g>
                  ) : (
                    <text 
                      x={station.cx} 
                      y={station.cy + 2} 
                      fill="#475569" 
                      fontSize="9" 
                      textAnchor="middle"
                    >
                      (Vacant)
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Sidebar Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          <h3>Agent Status Board</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {agents.map(a => (
              <div key={a.id} style={{ background: '#0f172a', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', borderLeft: `3px solid ${stations.find(s => a.title.toLowerCase().includes(s.roleMatch.toLowerCase()))?.color || '#cbd5e1'}` }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{a.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.id}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.title} &bull; Lv.{a.autonomy_level}</div>
                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Online &bull; Idle</span>
                </div>
              </div>
            ))}
            {agents.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No active agents online.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
