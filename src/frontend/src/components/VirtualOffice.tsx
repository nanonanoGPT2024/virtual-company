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
        Top-down layout of the autonomous workspace. Active agents ({agents.length} online) are highlighted working at their realistic workstations.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* SVG Office Map */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
          <svg width="100%" height="500" viewBox="0 0 600 320" style={{ maxWidth: '900px' }}>
            <defs>
              {/* Floor tile texture pattern */}
              <pattern id="office-floor" width="30" height="30" patternUnits="userSpaceOnUse">
                <rect width="30" height="30" fill="#0f172a" />
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                <circle cx="15" cy="15" r="0.75" fill="#334155" opacity="0.3" />
              </pattern>
              
              {/* Wood tile texture for Executive Suite */}
              <pattern id="wood-floor" width="20" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="20" height="60" fill="#1e1b4b" />
                <path d="M 0 0 L 20 0 M 10 0 L 10 60" stroke="#312e81" strokeWidth="0.75" />
              </pattern>
            </defs>
            
            <style>{`
              @keyframes typing-left {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-1.5px); }
              }
              @keyframes typing-right {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
              }
              @keyframes head-bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(0.75px); }
              }
              @keyframes coffee-steam {
                0% { transform: translateY(0) scaleX(1); opacity: 0; }
                50% { transform: translateY(-3px) scaleX(1.2); opacity: 0.5; }
                100% { transform: translateY(-6px) scaleX(0.8); opacity: 0; }
              }
              .animate-typing-left {
                animation: typing-left 0.18s infinite ease-in-out;
              }
              .animate-typing-right {
                animation: typing-right 0.22s infinite ease-in-out;
              }
              .animate-head {
                animation: head-bob 3s infinite ease-in-out;
              }
              .animate-steam {
                animation: coffee-steam 2.5s infinite linear;
              }
            `}</style>
            
            {/* Background Floor */}
            <rect width="100%" height="100%" fill="url(#office-floor)" rx="8" />
            
            {/* Outer Walls */}
            <rect x="10" y="10" width="580" height="300" fill="none" stroke="#475569" strokeWidth="3" rx="6" />
            
            {/* 1. EXECUTIVE SUITE (CEO & CFO Office) */}
            <rect x="20" y="20" width="180" height="130" fill="url(#wood-floor)" opacity="0.8" rx="4" />
            <rect x="20" y="20" width="180" height="130" fill="none" stroke="#b45309" strokeWidth="2" rx="4" />
            {/* Glass panel indicators */}
            <line x1="80" y1="20" x2="140" y2="20" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
            <text x="30" y="38" fill="#fb923c" fontSize="10" fontWeight="700" letterSpacing="0.05em">EXECUTIVE SUITE</text>
            {/* Plants/Decorations */}
            <circle cx="30" cy="130" r="4" fill="#d97706" />
            <circle cx="30" cy="128" r="5" fill="#16a34a" />
            <circle cx="30" cy="126" r="3" fill="#22c55e" />
            
            {/* 2. FINANCE & WAR ROOM (CFO/FinOps Area) */}
            <rect x="20" y="170" width="180" height="130" fill="#111827" rx="4" />
            <rect x="20" y="170" width="180" height="130" fill="none" stroke="#6b7280" strokeWidth="2" rx="4" />
            <text x="30" y="188" fill="#9ca3af" fontSize="10" fontWeight="700" letterSpacing="0.05em">FINANCE & WAR ROOM</text>
            {/* Safe Box representation */}
            <rect x="30" y="270" width="14" height="14" fill="#374151" stroke="#4b5563" rx="1" />
            <circle cx="34" cy="277" r="2" fill="#9ca3af" />
            
            {/* 3. ENGINEERING & PRODUCT HUB (Large Open Space) */}
            <rect x="220" y="20" width="360" height="280" fill="#0b1329" rx="6" />
            <rect x="220" y="20" width="360" height="280" fill="none" stroke="#0ea5e9" strokeWidth="2" rx="6" />
            <text x="230" y="38" fill="#38bdf8" fontSize="10" fontWeight="700" letterSpacing="0.05em">PRODUCTION & ENGINEERING HUB</text>
            {/* Water Dispenser */}
            <rect x="550" y="260" width="12" height="22" fill="#334155" rx="2" />
            <rect x="552" y="262" width="8" height="8" fill="#38bdf8" rx="1" />
            <circle cx="556" cy="274" r="1.5" fill="#ef4444" />
            <circle cx="556" cy="278" r="1.5" fill="#3b82f6" />
            
            {/* Render Workstation Desks and Occupying Agents */}
            {stations.map((station, idx) => {
              // Find agent occupying this desk based on role match
              const occupant = agents.find(a => a.title.toLowerCase().includes(station.roleMatch.toLowerCase()));
              const deskStroke = occupant ? station.color : '#475569';
              
              return (
                <g key={idx}>
                  {/* WORKSTATION DESK (Realistic office desk) */}
                  <rect 
                    x={station.cx - 22} 
                    y={station.cy - 12} 
                    width="44" 
                    height="18" 
                    fill="#1e293b" 
                    stroke={deskStroke} 
                    strokeWidth={occupant ? 2 : 1}
                    rx="2" 
                  />
                  {/* Desk Mat */}
                  <rect 
                    x={station.cx - 14} 
                    y={station.cy - 10} 
                    width="28" 
                    height="14" 
                    fill="#0f172a" 
                    rx="1" 
                  />
                  {/* PC Monitor Setup */}
                  <rect 
                    x={station.cx - 10} 
                    y={station.cy - 12} 
                    width="20" 
                    height="1.5" 
                    fill="#000" 
                  />
                  <rect 
                    x={station.cx - 3} 
                    y={station.cy - 11} 
                    width="6" 
                    height="2" 
                    fill="#64748b" 
                  />
                  {/* Keyboard */}
                  <rect 
                    x={station.cx - 7} 
                    y={station.cy - 2} 
                    width="14" 
                    height="3" 
                    fill="#334155" 
                    rx="0.5" 
                  />
                  {/* Mouse */}
                  <circle 
                    cx={station.cx + 9} 
                    cy={station.cy - 2} 
                    r="1" 
                    fill="#475569" 
                  />
                  {/* Coffee Mug */}
                  <circle 
                    cx={station.cx - 10} 
                    cy={station.cy - 5} 
                    r="1.5" 
                    fill="#ef4444" 
                  />
                  
                  {/* Coffee Steam Animation */}
                  {occupant && (
                    <path 
                      d={`M ${station.cx - 10} ${station.cy - 7} Q ${station.cx - 11} ${station.cy - 9} ${station.cx - 10} ${station.cy - 11} T ${station.cx - 10} ${station.cy - 14}`} 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="0.5" 
                      className="animate-steam" 
                    />
                  )}
                  
                  {/* OFFICE CHAIR */}
                  {/* Backrest */}
                  <rect 
                    x={station.cx - 7} 
                    y={station.cy + 13} 
                    width="14" 
                    height="3" 
                    fill="#020617" 
                    stroke={deskStroke} 
                    strokeWidth="1" 
                    rx="0.5" 
                  />
                  {/* Seat Cushion */}
                  <rect 
                    x={station.cx - 8} 
                    y={station.cy + 7} 
                    width="16" 
                    height="7" 
                    fill="#0f172a" 
                    stroke={deskStroke} 
                    strokeWidth="1" 
                    rx="1" 
                  />
                  
                  {/* Workstation Label */}
                  <text 
                    x={station.cx} 
                    y={station.cy - 16} 
                    fill={occupant ? '#f8fafc' : '#64748b'} 
                    fontSize="8" 
                    fontWeight={occupant ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {station.label}
                  </text>
                  
                  {/* OCCUPANT (Mini Person / Avatar) */}
                  {occupant ? (
                    <g>
                      {/* Group for bobbing head/torso together */}
                      <g className="animate-head">
                        {/* Shirt / Shoulders */}
                        <path 
                          d={`M ${station.cx - 6} ${station.cy + 13} Q ${station.cx} ${station.cy + 10} ${station.cx + 6} ${station.cy + 13} L ${station.cx + 5} ${station.cy + 7} L ${station.cx - 5} ${station.cy + 7} Z`} 
                          fill={station.color} 
                        />
                        {/* Head */}
                        <circle 
                          cx={station.cx} 
                          cy={station.cy + 7} 
                          r="5" 
                          fill="#fbcfe8" 
                          stroke="#db2777" 
                          strokeWidth="0.5" 
                        />
                        {/* Hair/Cap outline */}
                        <path 
                          d={`M ${station.cx - 4} ${station.cy + 5} A 4 4 0 0 1 ${station.cx + 4} ${station.cy + 5}`} 
                          fill="none" 
                          stroke="#374151" 
                          strokeWidth="1" 
                        />
                        {/* Emoji Icon Overlay */}
                        <text 
                          x={station.cx} 
                          y={station.cy + 9} 
                          fill="#fff" 
                          fontSize="7" 
                          textAnchor="middle"
                        >
                          {station.emoji}
                        </text>
                      </g>
                      
                      {/* Hands typing on keyboard (with individual bouncing keyframes) */}
                      <circle 
                        cx={station.cx - 4} 
                        cy={station.cy - 1} 
                        r="1.5" 
                        fill="#fbcfe8" 
                        className="animate-typing-left"
                      />
                      <circle 
                        cx={station.cx + 4} 
                        cy={station.cy - 1} 
                        r="1.5" 
                        fill="#fbcfe8" 
                        className="animate-typing-right"
                      />
                      
                      {/* Occupant Name below desk */}
                      <text 
                        x={station.cx} 
                        y={station.cy + 25} 
                        fill={station.color} 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {occupant.name}
                      </text>
                    </g>
                  ) : (
                    /* Vacant label */
                    <text 
                      x={station.cx} 
                      y={station.cy + 5} 
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
