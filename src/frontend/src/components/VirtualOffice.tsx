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
  // Define layout stations for key PRD roles on an expanded 800x400 grid
  const stations: StationLayout[] = [
    // Executive Suite (x: 20-260, y: 20-150)
    { cx: 90, cy: 95, label: 'CEO Room', color: '#0284c7', emoji: '👑', roleMatch: 'CEO' },
    { cx: 190, cy: 95, label: 'CFO Desk', color: '#f59e0b', emoji: '📊', roleMatch: 'CFO' },
    
    // Finance & War Room (x: 20-260, y: 190-380)
    { cx: 140, cy: 240, label: 'FinOps Desk', color: '#eab308', emoji: '🪙', roleMatch: 'Financial Ops' },
    
    // Engineering & Product Hub (x: 280-780, y: 20-380)
    // Row 1 (y = 90)
    { cx: 350, cy: 90, label: 'CTO Desk', color: '#38bdf8', emoji: '🛠️', roleMatch: 'CTO' },
    { cx: 450, cy: 90, label: 'CPO Desk', color: '#10b981', emoji: '💡', roleMatch: 'CPO' },
    { cx: 550, cy: 90, label: 'CMO Desk', color: '#a855f7', emoji: '📢', roleMatch: 'CMO' },
    { cx: 650, cy: 90, label: 'CRO Desk', color: '#ec4899', emoji: '🤝', roleMatch: 'CRO' },
    
    // Row 2 (y = 190)
    { cx: 350, cy: 190, label: 'Architect Desk', color: '#15803d', emoji: '💻', roleMatch: 'Architect' },
    { cx: 450, cy: 190, label: 'BE Dev Desk', color: '#047857', emoji: '💾', roleMatch: 'Backend' },
    { cx: 550, cy: 190, label: 'FE Dev Desk', color: '#0891b2', emoji: '🎨', roleMatch: 'Frontend' },
    { cx: 650, cy: 190, label: 'QA Desk', color: '#b91c1c', emoji: '🔍', roleMatch: 'QA' },
    
    // Row 3 (y = 290)
    { cx: 450, cy: 290, label: 'PM Desk', color: '#6366f1', emoji: '📅', roleMatch: 'Product Manager' },
    { cx: 550, cy: 290, label: 'UX Desk', color: '#f43f5e', emoji: '✏️', roleMatch: 'UX' },
    { cx: 650, cy: 290, label: 'Researcher Desk', color: '#84cc16', emoji: '🔬', roleMatch: 'Researcher' }
  ];

  return (
    <div className="card">
      <h2>Virtual Office Floor Plan</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Top-down layout of the autonomous workspace. Active agents ({agents.length} online) are highlighted working at their realistic, detailed workstations.
      </p>
      
      {/* SVG Office Map (Enlarged viewport size) */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '520px', width: '100%', boxSizing: 'border-box' }}>
          <svg width="100%" height="520" viewBox="0 0 800 400" style={{ maxWidth: '100%' }}>
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
            <rect x="10" y="10" width="780" height="380" fill="none" stroke="#475569" strokeWidth="3" rx="6" />
            
            {/* 1. EXECUTIVE SUITE (CEO & CFO Office) */}
            <rect x="20" y="20" width="240" height="150" fill="url(#wood-floor)" opacity="0.8" rx="4" />
            <rect x="20" y="20" width="240" height="150" fill="none" stroke="#b45309" strokeWidth="2" rx="4" />
            {/* Glass panel indicators */}
            <line x1="100" y1="20" x2="180" y2="20" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 1" />
            <text x="30" y="38" fill="#fb923c" fontSize="10" fontWeight="700" letterSpacing="0.05em">EXECUTIVE SUITE</text>
            
            {/* Executive Suite carpets under desks */}
            <rect x="50" y="60" width="80" height="75" fill="#312e81" opacity="0.35" rx="3" />
            <rect x="150" y="60" width="80" height="75" fill="#312e81" opacity="0.35" rx="3" />
            
            {/* Whiteboard in Executive Suite */}
            <rect x="95" y="22" width="70" height="3" fill="#f8fafc" stroke="#475569" strokeWidth="0.5" />
            
            {/* Sofa Lounge in Executive Suite */}
            <rect x="35" y="142" width="60" height="18" fill="#374151" stroke="#4b5563" rx="2" />
            <rect x="39" y="146" width="52" height="10" fill="#1f2937" rx="1" />
            <rect x="110" y="142" width="40" height="12" fill="#78350f" rx="1" /> {/* Coffee table */}
            <circle cx="120" cy="148" r="1.5" fill="#ef4444" /> {/* mug */}
            
            {/* Executive Plants */}
            <circle cx="245" cy="30" r="4" fill="#d97706" />
            <circle cx="245" cy="28" r="5" fill="#16a34a" />
            <circle cx="245" cy="26" r="3" fill="#22c55e" />
            
            <circle cx="35" cy="35" r="3" fill="#d97706" />
            <circle cx="35" cy="33" r="4" fill="#15803d" />
            
            {/* 2. FINANCE & WAR ROOM (CFO/FinOps Area - Centered Desks) */}
            <rect x="20" y="190" width="240" height="190" fill="#111827" rx="4" />
            <rect x="20" y="190" width="240" height="190" fill="none" stroke="#6b7280" strokeWidth="2" rx="4" />
            <text x="30" y="208" fill="#9ca3af" fontSize="10" fontWeight="700" letterSpacing="0.05em">FINANCE & WAR ROOM</text>
            
            {/* Whiteboard in War Room */}
            <rect x="95" y="192" width="70" height="3" fill="#f8fafc" stroke="#475569" strokeWidth="0.5" />
            
            {/* Safe Box representation */}
            <rect x="30" y="350" width="16" height="16" fill="#374151" stroke="#4b5563" rx="1" />
            <circle cx="34" cy="358" r="2.5" fill="#9ca3af" />
            
            {/* Cabinet Shelves with Files */}
            <rect x="195" y="350" width="50" height="16" fill="#1e293b" stroke="#475569" rx="1" />
            <rect x="200" y="352" width="6" height="12" fill="#ef4444" rx="0.5" />
            <rect x="208" y="352" width="6" height="12" fill="#3b82f6" rx="0.5" />
            <rect x="216" y="352" width="6" height="12" fill="#10b981" rx="0.5" />
            <rect x="224" y="352" width="6" height="12" fill="#f59e0b" rx="0.5" />
            
            {/* War Room round table (Centered at cx=140, cy=310) */}
            <circle cx="140" cy="310" r="30" fill="#1e293b" opacity="0.5" /> {/* Rug */}
            <circle cx="140" cy="310" r="18" fill="#4b5563" stroke="#374151" strokeWidth="1.5" />
            <circle cx="140" cy="310" r="14" fill="#374151" />
            {/* Small stools around table */}
            <rect x="133" y="282" width="14" height="8" fill="#1f2937" stroke="#4b5563" rx="1" /> {/* Top stool */}
            <rect x="133" y="330" width="14" height="8" fill="#1f2937" stroke="#4b5563" rx="1"  /> {/* Bottom stool */}
            <rect x="112" y="303" width="8" height="14" fill="#1f2937" stroke="#4b5563" rx="1"  />  {/* Left stool */}
            <rect x="160" y="303" width="8" height="14" fill="#1f2937" stroke="#4b5563" rx="1"  />  {/* Right stool */}
            
            {/* War Room Plants */}
            <circle cx="245" cy="200" r="4" fill="#d97706" />
            <circle cx="245" cy="198" r="5" fill="#16a34a" />
            
            {/* 3. ENGINEERING & PRODUCT HUB (Large Open Space) */}
            <rect x="280" y="20" width="500" height="360" fill="#0b1329" rx="6" />
            <rect x="280" y="20" width="500" height="360" fill="none" stroke="#0ea5e9" strokeWidth="2" rx="6" />
            <text x="290" y="38" fill="#38bdf8" fontSize="10" fontWeight="700" letterSpacing="0.05em">PRODUCTION & ENGINEERING HUB</text>
            
            {/* Server Room Dividers (Fenced network area at bottom left of hub) */}
            <rect x="282" y="280" width="100" height="98" fill="#111827" opacity="0.3" />
            <line x1="382" y1="280" x2="382" y2="378" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
            <text x="290" y="295" fill="#475569" fontSize="8" fontWeight="bold">DATACENTER</text>
            
            {/* Server Rack 1 (with blinking LED animation) */}
            <rect x="288" y="305" width="20" height="32" fill="#030712" stroke="#475569" rx="2" />
            <rect x="290" y="310" width="16" height="2" fill="#1f2937" />
            <circle cx="292" cy="311" r="0.75" fill="#22c55e" className="led-blink-green" />
            <circle cx="295" cy="311" r="0.75" fill="#ef4444" className="led-blink-red" />
            <rect x="290" y="316" width="16" height="2" fill="#1f2937" />
            <circle cx="292" cy="317" r="0.75" fill="#ef4444" className="led-blink-red" style={{ animationDelay: '0.3s' }} />
            <rect x="290" y="322" width="16" height="2" fill="#1f2937" />
            <circle cx="292" cy="323" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.6s' }} />
            
            {/* Server Rack 2 */}
            <rect x="314" y="305" width="20" height="32" fill="#030712" stroke="#475569" rx="2" />
            <rect x="316" y="310" width="16" height="2" fill="#1f2937" />
            <circle cx="318" cy="311" r="0.75" fill="#ef4444" className="led-blink-red" style={{ animationDelay: '0.2s' }} />
            <rect x="316" y="316" width="16" height="2" fill="#1f2937" />
            <circle cx="318" cy="317" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.5s' }} />
            <rect x="316" y="322" width="16" height="2" fill="#1f2937" />
            <circle cx="318" cy="323" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.8s' }} />
            
            {/* Server Rack 3 */}
            <rect x="340" y="305" width="20" height="32" fill="#030712" stroke="#475569" rx="2" />
            <rect x="342" y="310" width="16" height="2" fill="#1f2937" />
            <circle cx="344" cy="311" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.1s' }} />
            <rect x="342" y="316" width="16" height="2" fill="#1f2937" />
            <circle cx="344" cy="317" r="0.75" fill="#ef4444" className="led-blink-red" style={{ animationDelay: '0.4s' }} />
            <rect x="342" y="322" width="16" height="2" fill="#1f2937" />
            <circle cx="344" cy="323" r="0.75" fill="#22c55e" className="led-blink-green" style={{ animationDelay: '0.7s' }} />
            
            {/* Water Dispenser & Break Corner Area */}
            <rect x="748" y="310" width="18" height="50" fill="#1e293b" stroke="#334155" rx="2" />
            <rect x="751" y="315" width="12" height="15" fill="#38bdf8" rx="1" opacity="0.8" />
            <path d="M 751 315 Q 757 300 763 315 Z" fill="#38bdf8" opacity="0.6" stroke="#0ea5e9" strokeWidth="0.5" />
            <circle cx="754" cy="336" r="1.5" fill="#ef4444" />
            <circle cx="760" cy="336" r="1.5" fill="#3b82f6" />
            
            {/* Coffee machine */}
            <rect x="710" y="320" width="20" height="20" fill="#030712" rx="1" />
            <rect x="718" y="330" width="4" height="6" fill="#cbd5e1" />
            <rect x="716" y="336" width="8" height="4" fill="#f59e0b" />
            <circle cx="715" cy="325" r="1.5" fill="#ef4444" />
            
            {/* Printer Station */}
            <rect x="286" y="140" width="22" height="20" fill="#4b5563" stroke="#334155" rx="2" />
            <rect x="290" y="143" width="14" height="2" fill="#10b981" />
            <rect x="288" y="152" width="18" height="3" fill="#cbd5e1" rx="0.5" />
            
            {/* Collaborative Lounge Area (Couch & Table in the middle of Hub) */}
            <rect x="475" y="140" width="80" height="20" fill="#1e293b" stroke="#334155" rx="2" />
            <rect x="481" y="143" width="68" height="14" fill="#0f172a" rx="1" />
            <rect x="495" y="122" width="40" height="12" fill="#78350f" rx="1" /> {/* Wooden table */}
            <circle cx="505" cy="128" r="2" fill="#ef4444" />
            <circle cx="525" cy="128" r="2" fill="#3b82f6" />
            
            {/* Plants in open space */}
            <circle cx="295" cy="100" r="4" fill="#d97706" />
            <circle cx="295" cy="98" r="5" fill="#16a34a" />
            
            <circle cx="760" cy="100" r="4" fill="#d97706" />
            <circle cx="760" cy="98" r="5" fill="#16a34a" />
            
            {/* Desk Dividers / Partitions */}
            {/* Row 1 Dividers */}
            <line x1="400" y1="55" x2="400" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="500" y1="55" x2="500" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="600" y1="55" x2="600" y2="120" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Row 2 Dividers */}
            <line x1="400" y1="155" x2="400" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="500" y1="155" x2="500" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="600" y1="155" x2="600" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            
            {/* Render Workstation Desks and Occupying Agents */}
            {stations.map((station, idx) => {
              // Find agent occupying this desk based on role match
              const occupant = agents.find(a => a.title.toLowerCase().includes(station.roleMatch.toLowerCase()));
              const deskStroke = occupant ? station.color : '#475569';
              
              return (
                <g key={idx}>
                  {/* WORKSTATION DESK (Enlarged cool office desk) */}
                  <rect 
                    x={station.cx - 27} 
                    y={station.cy - 12} 
                    width="54" 
                    height="24" 
                    fill="#1e293b" 
                    stroke={deskStroke} 
                    strokeWidth={occupant ? 2 : 1}
                    rx="3" 
                  />
                  {/* Desk Mat */}
                  <rect 
                    x={station.cx - 18} 
                    y={station.cy - 10} 
                    width="36" 
                    height="18" 
                    fill="#0f172a" 
                    rx="1.5" 
                  />
                  
                  {/* HUGE CURVED MONITOR SETUP (Ultra-widescreen, spanning 50px across desk) */}
                  <path 
                    d={`M ${station.cx - 25} ${station.cy - 15} Q ${station.cx} ${station.cy - 20} ${station.cx + 25} ${station.cy - 15}`} 
                    fill="none" 
                    stroke="#020617" 
                    strokeWidth="6" 
                  />
                  {/* Glowing Wide Screen Area */}
                  <path 
                    d={`M ${station.cx - 24} ${station.cy - 14.5} Q ${station.cx} ${station.cy - 19.5} ${station.cx + 24} ${station.cy - 14.5}`} 
                    fill="none" 
                    stroke={occupant ? "#06b6d4" : "#475569"} 
                    strokeWidth="2.5" 
                  />
                  {/* Monitor Stand */}
                  <path 
                    d={`M ${station.cx - 6} ${station.cy - 11} L ${station.cx + 6} ${station.cy - 11} L ${station.cx} ${station.cy - 7} Z`} 
                    fill="#64748b" 
                  />
                  
                  {/* PORTRAIT SECONDARY MONITOR on the left */}
                  <rect 
                    x={station.cx - 25} 
                    y={station.cy - 7} 
                    width="3" 
                    height="11" 
                    fill="#020617" 
                    stroke={occupant ? "#0ea5e9" : "#475569"} 
                    strokeWidth="0.5" 
                    rx="0.5" 
                    transform={`rotate(-15, ${station.cx - 23.5}, ${station.cy - 1.5})`} 
                  />
                  
                  {/* Giant Desktop PC Case (Cool gaming tower with neon lines) */}
                  <rect 
                    x={station.cx + 17} 
                    y={station.cy - 11} 
                    width="8" 
                    height="20" 
                    fill="#020617" 
                    stroke="#475569" 
                    rx="1" 
                  />
                  {/* Neon LED strip on PC case */}
                  <line 
                    x1={station.cx + 18} 
                    y1={station.cy - 9} 
                    x2={station.cx + 18} 
                    y2={station.cy + 7} 
                    stroke={occupant ? station.color : '#475569'} 
                    strokeWidth="0.75" 
                  />
                  
                  {/* Keyboard */}
                  <rect 
                    x={station.cx - 9} 
                    y={station.cy + 1} 
                    width="18" 
                    height="4" 
                    fill="#334155" 
                    rx="0.5" 
                  />
                  {/* Mouse */}
                  <circle 
                    cx={station.cx + 12} 
                    cy={station.cy + 3} 
                    r="1.5" 
                    fill="#475569" 
                  />
                  {/* Coffee Mug */}
                  <circle 
                    cx={station.cx - 13} 
                    cy={station.cy - 4} 
                    r="2" 
                    fill="#ef4444" 
                  />
                  
                  {/* Desktop Phone details on some desks */}
                  {(idx % 2 === 0 || station.roleMatch === 'CEO') && (
                    <rect 
                      x={station.cx - 20} 
                      y={station.cy - 10} 
                      width="5" 
                      height="5" 
                      fill="#030712" 
                      rx="0.5" 
                    />
                  )}
                  
                  {/* Little Desk Plant on some other desks */}
                  {(idx % 3 === 1 && station.roleMatch !== 'CEO') && (
                    <g>
                      <circle cx={station.cx - 22} cy={station.cy - 4} r="2" fill="#b45309" />
                      <circle cx={station.cx - 22} cy={station.cy - 5} r="1.5" fill="#22c55e" />
                    </g>
                  )}
                  
                  {/* Trash Bin next to desk */}
                  <circle 
                    cx={station.cx - 31} 
                    cy={station.cy + 6} 
                    r="3" 
                    fill="#475569" 
                    stroke="#334155" 
                    strokeWidth="0.5" 
                  />
                  <line 
                    x1={station.cx - 31} 
                    y1={station.cy + 4} 
                    x2={station.cx - 31} 
                    y2={station.cy + 8} 
                    stroke="#111827" 
                    strokeWidth="0.5" 
                  />
                  
                  {/* Paper Pile details on some desks */}
                  {(idx % 3 === 0 || station.roleMatch === 'CFO' || station.roleMatch === 'CEO') && (
                    <g>
                      <rect 
                        x={station.cx + 10} 
                        y={station.cy - 7} 
                        width="6" 
                        height="5" 
                        fill="#f8fafc" 
                        stroke="#cbd5e1" 
                        strokeWidth="0.5" 
                        transform="rotate(10)" 
                      />
                      <rect 
                        x={station.cx + 9} 
                        y={station.cy - 6} 
                        width="6" 
                        height="5" 
                        fill="#ffffff" 
                        stroke="#cbd5e1" 
                        strokeWidth="0.5" 
                      />
                    </g>
                  )}
                  
                  {/* Coffee Steam Animation */}
                  {occupant && (
                    <path 
                      d={`M ${station.cx - 13} ${station.cy - 6} Q ${station.cx - 14} ${station.cy - 8} ${station.cx - 13} ${station.cy - 10} T ${station.cx - 13} ${station.cy - 13}`} 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="0.5" 
                      className="animate-steam" 
                    />
                  )}
                  
                  {/* OFFICE CHAIR */}
                  {/* Backrest */}
                  <rect 
                    x={station.cx - 9} 
                    y={station.cy + 19} 
                    width="18" 
                    height="4" 
                    fill="#020617" 
                    stroke={deskStroke} 
                    strokeWidth="1" 
                    rx="0.5" 
                  />
                  {/* Seat Cushion */}
                  <rect 
                    x={station.cx - 10} 
                    y={station.cy + 11} 
                    width="20" 
                    height="9" 
                    fill="#0f172a" 
                    stroke={deskStroke} 
                    strokeWidth="1" 
                    rx="1.5" 
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
                  
                  {/* OCCUPANT (Mini Person / CHIBI Avatar) */}
                  {occupant ? (
                    <g>
                      {/* Group for bobbing head/torso together */}
                      <g className="animate-head">
                        {/* Shirt / Shoulders */}
                        <path 
                          d={`M ${station.cx - 7} ${station.cy + 17} Q ${station.cx} ${station.cy + 13} ${station.cx + 7} ${station.cy + 17} L ${station.cx + 6} ${station.cy + 11} L ${station.cx - 6} ${station.cy + 11} Z`} 
                          fill={station.color} 
                        />
                        {/* CHIBI HEAD (Larger size relative to body) */}
                        <circle 
                          cx={station.cx} 
                          cy={station.cy + 9} 
                          r="7.5" 
                          fill="#fbcfe8" 
                          stroke="#db2777" 
                          strokeWidth="0.5" 
                        />
                        {/* Cute Hair/Cap outline */}
                        <path 
                          d={`M ${station.cx - 6.5} ${station.cy + 6} A 6.5 6.5 0 0 1 ${station.cx + 6.5} ${station.cy + 6}`} 
                          fill="none" 
                          stroke="#374151" 
                          strokeWidth="1.5" 
                        />
                        {/* Cute Chibi Blushing Cheeks */}
                        <circle cx={station.cx - 4.5} cy={station.cy + 10} r="1.5" fill="#f43f5e" opacity="0.4" />
                        <circle cx={station.cx + 4.5} cy={station.cy + 10} r="1.5" fill="#f43f5e" opacity="0.4" />
                        
                        {/* Cute Chibi Eyes */}
                        <circle cx={station.cx - 2.5} cy={station.cy + 7.5} r="1" fill="#000" />
                        <circle cx={station.cx + 2.5} cy={station.cy + 7.5} r="1" fill="#000" />
                        
                        {/* Cute Chibi Smile */}
                        <path 
                          d={`M ${station.cx - 1.5} ${station.cy + 10} Q ${station.cx} ${station.cy + 11.5} ${station.cx + 1.5} ${station.cy + 10}`} 
                          fill="none" 
                          stroke="#000" 
                          strokeWidth="0.5" 
                        />
                        
                        {/* Emoji Icon Overlay (Above the chibi face) */}
                        <text 
                          x={station.cx} 
                          y={station.cy + 4} 
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
                        cy={station.cy + 2} 
                        r="1.5" 
                        fill="#fbcfe8" 
                        className="animate-typing-left"
                      />
                      <circle 
                        cx={station.cx + 4} 
                        cy={station.cy + 2} 
                        r="1.5" 
                        fill="#fbcfe8" 
                        className="animate-typing-right"
                      />
                      
                      {/* Occupant Name below desk */}
                      <text 
                        x={station.cx} 
                        y={station.cy + 27} 
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
    </div>
  );
}
