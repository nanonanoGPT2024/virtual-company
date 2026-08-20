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
    { cx: 110, cy: 215, label: 'FinOps Desk', color: '#eab308', emoji: '🪙', roleMatch: 'Financial Ops' }
  ];

  return (
    <div className="card">
      <h2>Virtual Office Floor Plan</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Top-down layout of the autonomous workspace. Active agents ({agents.length} online) are highlighted working at their realistic, detailed workstations.
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
              @keyframes led-blink-g {
                0%, 100% { fill: #22c55e; }
                50% { fill: #052e16; }
              }
              @keyframes led-blink-r {
                0%, 100% { fill: #ef4444; }
                50% { fill: #450a0a; }
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
              .led-blink-green {
                animation: led-blink-g 1s infinite steps(1);
              }
              .led-blink-red {
                animation: led-blink-r 1.4s infinite steps(1);
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
            
            {/* Executive Suite carpets under desks */}
            <rect x="50" y="60" width="60" height="60" fill="#312e81" opacity="0.35" rx="3" />
            <rect x="110" y="60" width="60" height="60" fill="#312e81" opacity="0.35" rx="3" />
            
            {/* Whiteboard in Executive Suite */}
            <rect x="60" y="22" width="50" height="3" fill="#f8fafc" stroke="#475569" strokeWidth="0.5" />
            
            {/* Sofa Lounge in Executive Suite */}
            <rect x="30" y="125" width="45" height="15" fill="#374151" stroke="#4b5563" rx="2" />
            <rect x="34" y="129" width="37" height="8" fill="#1f2937" rx="1" />
            <rect x="35" y="112" width="35" height="8" fill="#78350f" rx="1" /> {/* Coffee table */}
            <circle cx="50" cy="116" r="1.5" fill="#ef4444" /> {/* mug */}
            
            {/* Executive Plants */}
            <circle cx="185" cy="30" r="4" fill="#d97706" />
            <circle cx="185" cy="28" r="5" fill="#16a34a" />
            <circle cx="185" cy="26" r="3" fill="#22c55e" />
            
            <circle cx="30" cy="80" r="3" fill="#d97706" />
            <circle cx="30" cy="78" r="4" fill="#15803d" />
            
            {/* 2. FINANCE & WAR ROOM (CFO/FinOps Area - Centered Desks) */}
            <rect x="20" y="170" width="180" height="130" fill="#111827" rx="4" />
            <rect x="20" y="170" width="180" height="130" fill="none" stroke="#6b7280" strokeWidth="2" rx="4" />
            <text x="30" y="188" fill="#9ca3af" fontSize="10" fontWeight="700" letterSpacing="0.05em">FINANCE & WAR ROOM</text>
            
            {/* Whiteboard in War Room */}
            <rect x="60" y="172" width="50" height="3" fill="#f8fafc" stroke="#475569" strokeWidth="0.5" />
            
            {/* Safe Box representation */}
            <rect x="25" y="275" width="14" height="14" fill="#374151" stroke="#4b5563" rx="1" />
            <circle cx="29" cy="282" r="2" fill="#9ca3af" />
            
            {/* Cabinet Shelves with Files */}
            <rect x="140" y="275" width="45" height="14" fill="#1e293b" stroke="#475569" rx="1" />
            <rect x="145" y="277" width="5" height="10" fill="#ef4444" rx="0.5" />
            <rect x="152" y="277" width="5" height="10" fill="#3b82f6" rx="0.5" />
            <rect x="159" y="277" width="5" height="10" fill="#10b981" rx="0.5" />
            <rect x="166" y="277" width="5" height="10" fill="#f59e0b" rx="0.5" />
            
            {/* War Room round table (Centered at cx=110, cy=265) */}
            <circle cx="110" cy="265" r="22" fill="#1e293b" opacity="0.5" /> {/* Rug */}
            <circle cx="110" cy="265" r="14" fill="#4b5563" stroke="#374151" strokeWidth="1.5" />
            <circle cx="110" cy="265" r="11" fill="#374151" />
            {/* Small stools around table */}
            <circle cx="110" cy="245" r="4" fill="#1f2937" stroke="#4b5563" /> {/* Top stool */}
            <circle cx="110" cy="285" r="4" fill="#1f2937" stroke="#4b5563" /> {/* Bottom stool */}
            <circle cx="90" cy="265" r="4" fill="#1f2937" stroke="#4b5563" />  {/* Left stool */}
            <circle cx="130" cy="265" r="4" fill="#1f2937" stroke="#4b5563" />  {/* Right stool */}
            
            {/* War Room Plants */}
            <circle cx="185" cy="180" r="4" fill="#d97706" />
            <circle cx="185" cy="178" r="5" fill="#16a34a" />
            
            {/* 3. ENGINEERING & PRODUCT HUB (Large Open Space) */}
            <rect x="220" y="20" width="360" height="280" fill="#0b1329" rx="6" />
            <rect x="220" y="20" width="360" height="280" fill="none" stroke="#0ea5e9" strokeWidth="2" rx="6" />
            <text x="230" y="38" fill="#38bdf8" fontSize="10" fontWeight="700" letterSpacing="0.05em">PRODUCTION & ENGINEERING HUB</text>
            
            {/* Server Room Dividers (Fenced network area) */}
            <rect x="222" y="235" width="60" height="62" fill="#111827" opacity="0.3" />
            <line x1="282" y1="235" x2="282" y2="297" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
            
            {/* Server Rack 1 (with blinking LED animation) */}
            <rect x="228" y="245" width="18" height="24" fill="#030712" stroke="#475569" rx="2" />
            <rect x="230" y="249" width="14" height="2" fill="#1f2937" />
            <circle cx="232" cy="250" r="0.75" fill="#22c55e" className="led-blink-green" />
            <circle cx="235" cy="250" r="0.75" fill="#ef4444" className="led-blink-red" />
            <rect x="230" y="254" width="14" height="2" fill="#1f2937" />
            <circle cx="232" cy="255" r="0.75" fill="#ef4444" className="led-blink-red" style={{ animationDelay: '0.3s' }} />
            <rect x="230" y="259" width="14" height="2" fill="#1f2937" />
            <circle cx="232" cy="260" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.6s' }} />
            <circle cx="235" cy="260" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.1s' }} />
            
            {/* Server Rack 2 (Extra Server) */}
            <rect x="252" y="245" width="18" height="24" fill="#030712" stroke="#475569" rx="2" />
            <rect x="254" y="249" width="14" height="2" fill="#1f2937" />
            <circle cx="256" cy="250" r="0.75" fill="#ef4444" className="led-blink-red" style={{ animationDelay: '0.2s' }} />
            <rect x="254" y="254" width="14" height="2" fill="#1f2937" />
            <circle cx="256" cy="255" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.5s' }} />
            <rect x="254" y="259" width="14" height="2" fill="#1f2937" />
            <circle cx="256" cy="260" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.8s' }} />
            
            {/* Water Dispenser & Break Corner Area */}
            <rect x="548" y="240" width="16" height="42" fill="#1e293b" stroke="#334155" rx="2" />
            <rect x="551" y="244" width="10" height="12" fill="#38bdf8" rx="1" opacity="0.8" />
            <path d="M 551 244 Q 556 232 561 244 Z" fill="#38bdf8" opacity="0.6" stroke="#0ea5e9" strokeWidth="0.5" />
            <circle cx="554" cy="262" r="1.5" fill="#ef4444" />
            <circle cx="558" cy="262" r="1.5" fill="#3b82f6" />
            
            {/* Coffee machine */}
            <rect x="550" y="270" width="12" height="10" fill="#030712" rx="1" />
            <rect x="554" y="275" width="4" height="4" fill="#f59e0b" />
            
            {/* Printer Station */}
            <rect x="226" y="125" width="16" height="14" fill="#4b5563" stroke="#334155" rx="2" />
            <rect x="229" y="127" width="10" height="2" fill="#10b981" />
            <rect x="228" y="134" width="12" height="2" fill="#cbd5e1" />
            
            {/* Collaborative Lounge Area (Couch & Table in the middle) */}
            <rect x="375" y="130" width="50" height="14" fill="#1e293b" stroke="#334155" rx="2" />
            <rect x="379" y="132" width="42" height="10" fill="#0f172a" rx="1" />
            <rect x="385" y="118" width="30" height="8" fill="#78350f" rx="1" /> {/* Wooden table */}
            <circle cx="390" cy="121" r="1" fill="#ef4444" />
            <circle cx="400" cy="121" r="1" fill="#3b82f6" />
            
            {/* Plants in open space */}
            <circle cx="235" cy="100" r="4" fill="#d97706" />
            <circle cx="235" cy="98" r="5" fill="#16a34a" />
            
            <circle cx="560" cy="100" r="4" fill="#d97706" />
            <circle cx="560" cy="98" r="5" fill="#16a34a" />
            
            {/* Desk Dividers / Partitions */}
            {/* Row 1 Dividers */}
            <line x1="310" y1="55" x2="310" y2="105" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="390" y1="55" x2="390" y2="105" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="470" y1="55" x2="470" y2="105" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Row 2 Dividers */}
            <line x1="310" y1="155" x2="310" y2="205" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="390" y1="155" x2="390" y2="205" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="470" y1="155" x2="470" y2="205" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Row 3 Dividers */}
            <line x1="310" y1="225" x2="310" y2="275" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="390" y1="225" x2="390" y2="275" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="470" y1="225" x2="470" y2="275" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            
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
                  
                  {/* Desktop Phone details on some desks */}
                  {(idx % 2 === 0 || station.roleMatch === 'CEO') && (
                    <rect 
                      x={station.cx + 10} 
                      y={station.cy - 10} 
                      width="5" 
                      height="4" 
                      fill="#030712" 
                      rx="0.5" 
                    />
                  )}
                  
                  {/* Little Desk Plant on some other desks */}
                  {(idx % 3 === 1 && station.roleMatch !== 'CEO') && (
                    <g>
                      <circle cx={station.cx - 16} cy={station.cy - 8} r="2" fill="#b45309" />
                      <circle cx={station.cx - 16} cy={station.cy - 9} r="1.5" fill="#22c55e" />
                    </g>
                  )}
                  
                  {/* Trash Bin next to desk */}
                  <circle 
                    cx={station.cx - 25} 
                    cy={station.cy + 2} 
                    r="2.5" 
                    fill="#475569" 
                    stroke="#334155" 
                    strokeWidth="0.5" 
                  />
                  <line 
                    x1={station.cx - 25} 
                    y1={station.cy} 
                    x2={station.cx - 25} 
                    y2={station.cy + 4} 
                    stroke="#111827" 
                    strokeWidth="0.5" 
                  />
                  
                  {/* Paper Pile details on some desks */}
                  {(idx % 3 === 0 || station.roleMatch === 'CFO' || station.roleMatch === 'CEO') && (
                    <g>
                      <rect 
                        x={station.cx + 12} 
                        y={station.cy - 8} 
                        width="5" 
                        height="4" 
                        fill="#f8fafc" 
                        stroke="#cbd5e1" 
                        strokeWidth="0.5" 
                        transform="rotate(10)" 
                      />
                      <rect 
                        x={station.cx + 11} 
                        y={station.cy - 7} 
                        width="5" 
                        height="4" 
                        fill="#ffffff" 
                        stroke="#cbd5e1" 
                        strokeWidth="0.5" 
                      />
                    </g>
                  )}
                  
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
