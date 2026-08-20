

interface Agent {
  id: string;
  name: string;
  title: string;
  autonomy_level: number;
}

interface VirtualOfficeProps {
  agents: Agent[];
}

export default function VirtualOffice({ agents }: VirtualOfficeProps) {
  return (
    <div className="card">
      <h2>Virtual Office Floor Plan</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Top-down layout of the autonomous workspace. Active agents are highlighted at their designated workstations.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* SVG Office Map */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <svg width="100%" height="300" viewBox="0 0 600 300" style={{ maxWidth: '600px' }}>
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="8" />
            
            {/* Office Walls / Rooms */}
            <rect x="10" y="10" width="580" height="280" fill="none" stroke="#334155" strokeWidth="2" rx="4" />
            
            {/* Executive Room */}
            <rect x="20" y="20" width="180" height="120" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="30" y="40" fill="#64748b" fontSize="12" fontWeight="600">EXECUTIVE SUITE</text>
            
            {/* Engineering Hub */}
            <rect x="220" y="20" width="360" height="260" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="230" y="40" fill="#64748b" fontSize="12" fontWeight="600">ENGINEERING HUBS</text>

            {/* Conference Room */}
            <rect x="20" y="160" width="180" height="120" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
            <text x="30" y="180" fill="#64748b" fontSize="12" fontWeight="600">WAR ROOM (DEBATES)</text>
            
            {/* Desks & Workstations */}
            {/* CEO Desk in Executive Suite */}
            <rect x="70" y="60" width="60" height="40" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
            <text x="100" y="85" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">CEO Desk</text>
            
            {/* CEO Avatar if present */}
            {agents.some(a => a.title === 'CEO') && (
              <g>
                <circle cx="100" cy="115" r="14" fill="#0284c7" stroke="#f8fafc" strokeWidth="1.5" />
                <text x="100" y="119" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">👑</text>
                <text x="100" y="140" fill="#38bdf8" fontSize="10" textAnchor="middle">Sovereign (CEO)</text>
              </g>
            )}

            {/* Architect Desk in Engineering Hub */}
            <rect x="270" y="90" width="60" height="40" fill="#1e293b" stroke="#4ade80" strokeWidth="2" rx="4" />
            <text x="300" y="115" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">Desk ENG1</text>
            
            {/* Architect Avatar if present */}
            {agents.some(a => a.id === 'EMP-ENG-001') && (
              <g>
                <circle cx="300" cy="145" r="14" fill="#15803d" stroke="#f8fafc" strokeWidth="1.5" />
                <text x="300" y="149" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">💻</text>
                <text x="300" y="170" fill="#4ade80" fontSize="10" textAnchor="middle">Alex (Architect)</text>
              </g>
            )}

            {/* Empty Workstation for future scaling */}
            <rect x="420" y="90" width="60" height="40" fill="#0f172a" stroke="#475569" strokeWidth="1.5" strokeDasharray="3" rx="4" />
            <text x="450" y="115" fill="#475569" fontSize="10" textAnchor="middle">Desk ENG2</text>
            <text x="450" y="145" fill="#475569" fontSize="9" textAnchor="middle">(Vacant)</text>

            <rect x="350" y="200" width="60" height="40" fill="#0f172a" stroke="#475569" strokeWidth="1.5" strokeDasharray="3" rx="4" />
            <text x="380" y="225" fill="#475569" fontSize="10" textAnchor="middle">Desk PM</text>
            <text x="380" y="255" fill="#475569" fontSize="9" textAnchor="middle">(Vacant)</text>
          </svg>
        </div>

        {/* Sidebar Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Agent Status Board</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {agents.map(a => (
              <div key={a.id} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '0.375rem', borderLeft: a.title === 'CEO' ? '3px solid #38bdf8' : '3px solid #4ade80' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{a.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.title} &bull; Autonomy Lv.{a.autonomy_level}</div>
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Online &bull; Idle (Awaiting Tasks)</span>
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
