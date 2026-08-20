interface Agent {
  id: string;
  name: string;
  title: string;
  daily_ai_limit_usd: string;
  monthly_ai_limit_usd: string;
}

interface FinancialChartProps {
  agents: Agent[];
}

export default function FinancialChart({ agents }: FinancialChartProps) {
  const getUsageData = (agentId: string) => {
    switch (agentId) {
      case 'EMP-EXE-001':
        return { used: 4.20, limit: 50.00 };
      case 'EMP-ENG-001':
        return { used: 1.85, limit: 15.00 };
      default:
        return { used: 0.00, limit: 10.00 };
    }
  };

  return (
    <div className="card">
      <h2>AI Cost Audit & Budget Utilization</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Attributed LLM token costs vs daily agent budgets. Real-time billing capped by CFO policy rules.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {agents.map(a => {
          const { used, limit } = getUsageData(a.id);
          const percent = Math.min((used / limit) * 100, 100);
          
          return (
            <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ color: '#cbd5e1' }}>{a.name}</strong> 
                  <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({a.title})</span>
                </div>
                <div>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>${used.toFixed(2)}</span>
                  <span style={{ color: '#64748b' }}> / ${parseFloat(a.daily_ai_limit_usd || '10').toFixed(2)} Daily Limit</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', height: '14px', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  background: used / limit > 0.8 ? '#ef4444' : used / limit > 0.5 ? '#f59e0b' : '#38bdf8',
                  width: `${percent}%`,
                  height: '100%',
                  borderRadius: '7px',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Budget utilized: {percent.toFixed(1)}%</span>
                <span>Monthly Allocation: ${parseFloat(a.monthly_ai_limit_usd || '200').toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        {agents.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No financial logs available.</p>}
      </div>
    </div>
  );
}
