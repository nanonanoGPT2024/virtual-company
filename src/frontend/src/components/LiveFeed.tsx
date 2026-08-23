import { useState, useEffect, useRef } from 'react';
import { Terminal, Radio } from 'lucide-react';

export interface FeedEvent {
  id: string | number;
  time: string;
  agent: string;
  agentNameOnly: string;
  role?: string;
  action: string;
  details: string;
  deptColor?: string;
  deptBg?: string;
}

interface LiveFeedProps {
  mode?: 'fullscreen' | 'widget';
  apiBase?: string;
  authToken?: string | null;
  inspectUserId?: string | null;
}

const DEFAULT_AGENTS_META: Record<string, { role: string; color: string; bg: string }> = {
  'Chief Aura': { role: 'CEO', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
  'Marcus Sterling': { role: 'CTO', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.2)' },
  'Viktor Cruz': { role: 'Architect', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' },
  'Devron': { role: 'Fullstack Dev', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  'Cipher': { role: 'DevOps / SRE', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
  'Sarah Jenkins': { role: 'PM', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.2)' },
  'Elena Vance': { role: 'CPO', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
  'Tessa': { role: 'SQA Engineer', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' },
  'Sentinel': { role: 'Sec Auditor', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.2)' },
  'Morgan Drake': { role: 'CFO', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
  'Justicia': { role: 'Legal Counsel', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
  'Vibe': { role: 'Marketing Copy', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.2)' },
  'Hunter': { role: 'Sales Lead', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.2)' },
  'Dr. Aris': { role: 'Researcher', color: '#a3e635', bg: 'rgba(163, 230, 53, 0.2)' },
  'Page': { role: 'Tech Writer', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' },
  'Kaelen': { role: 'UI/UX Spec', color: '#fda4af', bg: 'rgba(253, 164, 175, 0.2)' }
};

export default function LiveFeed({ mode = 'widget', apiBase, authToken, inspectUserId }: LiveFeedProps) {
  const [filter, setFilter] = useState<'ALL' | 'TECH' | 'PROD' | 'GROWTH'>('ALL');
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const getApiUrl = () => {
    if (apiBase) return apiBase;
    let stored = localStorage.getItem('API_URL');
    if (stored) return stored;
    if (window.location.port === '5173' || window.location.port === '5174') {
      return `http://${window.location.hostname}:4000/api`;
    }
    return `${window.location.origin}/api`;
  };

  const fetchActivities = async () => {
    try {
      const token = authToken || localStorage.getItem('company_os_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let url = `${getApiUrl()}/activities?limit=50&sort=ASC`;
      if (inspectUserId) {
        url += `&user_id=${encodeURIComponent(inspectUserId)}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: FeedEvent[] = data.map((item: any) => {
            const rawAgentName = item.agent_name || (item.agent_id ? item.agent_id.replace('EMP-', '') : 'System');
            const agentRole = item.agent_role || 'Agent';
            const timeStr = item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const metaKey = Object.keys(DEFAULT_AGENTS_META).find(k => rawAgentName.includes(k) || agentRole.includes(k));
            const deptColor = metaKey ? DEFAULT_AGENTS_META[metaKey].color : '#38bdf8';
            const deptBg = metaKey ? DEFAULT_AGENTS_META[metaKey].bg : 'rgba(56, 189, 248, 0.2)';

            return {
              id: item.id || `act-${Math.random()}`,
              time: timeStr,
              agent: `${rawAgentName} (${agentRole})`,
              agentNameOnly: rawAgentName,
              role: agentRole,
              action: item.action_type || 'ACTIVITY',
              details: item.summary || (typeof item.details === 'string' ? item.details : JSON.stringify(item.details || {})),
              deptColor,
              deptBg
            };
          });

          setEvents(mapped);
        }
      }
    } catch (err) {
      console.warn('Fetch activities warning:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const filteredEvents = events.filter((e) => {
    if (filter === 'TECH') {
      return ['Architect', 'Fullstack Dev', 'Developer', 'DevOps', 'DevOps / SRE', 'SQA Engineer', 'QA', 'Sec Auditor', 'Security Auditor', 'CTO'].includes(e.role || '');
    }
    if (filter === 'PROD') {
      return ['Product Manager', 'PM', 'CPO', 'UI/UX Spec', 'UX', 'Researcher', 'Tech Writer'].includes(e.role || '');
    }
    if (filter === 'GROWTH') {
      return ['CEO', 'Marketing Copy', 'Marketer', 'Sales Lead', 'Sales', 'Sales / CRO', 'CRO', 'CFO', 'Legal Counsel', 'Legal'].includes(e.role || '');
    }
    return true;
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      backgroundColor: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      width: mode === 'fullscreen' ? '100%' : '100%',
      maxWidth: '100%',
      margin: mode === 'fullscreen' ? '0 auto' : '0'
    }}>
      {/* Header bar */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'linear-gradient(to right, #020617, #0f172a, #1e1b4b)',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div style={{
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            <Radio size={14} color="#38bdf8" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#34d399' }} />
              <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#f8fafc', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Live Activity Feed
              </h2>
            </div>
            <p style={{ fontSize: '0.6875rem', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Real-time Autonomous Events
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          backgroundColor: '#020617',
          padding: '0.25rem',
          borderRadius: '0.5rem',
          border: '1px solid #1e293b',
          flexShrink: 0
        }}>
          {(['ALL', 'TECH', 'PROD', 'GROWTH'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: '0.6875rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: filter === tab ? '#0284c7' : 'transparent',
                color: filter === tab ? '#ffffff' : '#94a3b8'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Style Feed Stream with visible scrollbar and legible font size */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {filteredEvents.map((e, idx) => (
          <div
            key={e.id || idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem'
            }}
          >
            {/* Avatar initial badge */}
            <div 
              style={{ 
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: `1px solid ${e.deptColor || '#38bdf8'}`,
                backgroundColor: e.deptBg || 'rgba(56, 189, 248, 0.2)',
                color: e.deptColor || '#38bdf8',
                flexShrink: 0,
                marginTop: '0.125rem'
              }}
            >
              {e.agentNameOnly.charAt(0).toUpperCase()}
            </div>

            {/* Message bubble */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '92%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <span 
                  style={{ 
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    color: e.deptColor || '#38bdf8'
                  }}
                >
                  {e.agentNameOnly}
                </span>
                {e.role && (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontFamily: 'monospace',
                    padding: '0.0625rem 0.375rem',
                    borderRadius: '0.25rem',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155'
                  }}>
                    {e.role}
                  </span>
                )}
                <span style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#22d3ee',
                  backgroundColor: 'rgba(8, 145, 178, 0.25)',
                  padding: '0.0625rem 0.375rem',
                  borderRadius: '0.25rem',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  {e.action}
                </span>
                <span style={{ fontSize: '0.6875rem', color: '#64748b', fontFamily: 'monospace', marginLeft: 'auto' }}>
                  {e.time}
                </span>
              </div>

              {/* Speech bubble with comfortable font size */}
              <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.875rem',
                borderTopLeftRadius: '0.125rem',
                padding: '0.625rem 0.875rem',
                fontSize: '0.8125rem',
                color: '#e2e8f0',
                lineHeight: 1.55,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {e.details}
              </div>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div style={{
            height: '100%',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1rem',
            color: '#64748b'
          }}>
            <Terminal size={24} style={{ color: '#475569', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Belum ada aktivitas yang tercatat.</p>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
