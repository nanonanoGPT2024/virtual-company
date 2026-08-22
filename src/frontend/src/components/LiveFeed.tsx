import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export interface FeedEvent {
  id: string | number;
  time: string;
  agent: string;
  role?: string;
  action: string;
  details: string;
  deptColor?: string;
}

interface LiveFeedProps {
  mode?: 'fullscreen' | 'widget';
  apiBase?: string;
}

const DEFAULT_AGENTS_META: Record<string, { role: string; color: string }> = {
  'Chief Aura': { role: 'CEO', color: '#38bdf8' },
  'Marcus Sterling': { role: 'CTO', color: '#0ea5e9' },
  'Viktor Cruz': { role: 'Architect', color: '#4ade80' },
  'Devron': { role: 'Fullstack Dev', color: '#22c55e' },
  'Cipher': { role: 'DevOps / SRE', color: '#06b6d4' },
  'Sarah Jenkins': { role: 'PM', color: '#a78bfa' },
  'Elena Vance': { role: 'CPO', color: '#10b981' },
  'Tessa': { role: 'SQA Engineer', color: '#f87171' },
  'Sentinel': { role: 'Sec Auditor', color: '#fb7185' },
  'Morgan Drake': { role: 'CFO', color: '#fbbf24' },
  'Justicia': { role: 'Legal Counsel', color: '#f59e0b' },
  'Vibe': { role: 'Marketing Copy', color: '#c084fc' },
  'Hunter': { role: 'Sales Lead', color: '#f472b6' },
  'Dr. Aris': { role: 'Researcher', color: '#a3e635' },
  'Page': { role: 'Tech Writer', color: '#38bdf8' },
  'Kaelen': { role: 'UI/UX Spec', color: '#fda4af' }
};

export default function LiveFeed({ mode = 'widget', apiBase }: LiveFeedProps) {
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
      const res = await fetch(`${getApiUrl()}/activities?limit=50`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: FeedEvent[] = data.map((item: any) => {
            const agentName = item.agent_name || (item.agent_id ? item.agent_id.replace('EMP-', '') : 'System');
            const agentRole = item.agent_role || 'Agent';
            const timeStr = item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const metaKey = Object.keys(DEFAULT_AGENTS_META).find(k => agentName.includes(k) || agentRole.includes(k));
            const deptColor = metaKey ? DEFAULT_AGENTS_META[metaKey].color : '#38bdf8';

            return {
              id: item.id || `act-${Math.random()}`,
              time: timeStr,
              agent: `${agentName} (${agentRole})`,
              role: agentRole,
              action: item.action_type || 'ACTIVITY',
              details: item.summary || (typeof item.details === 'string' ? item.details : JSON.stringify(item.details || {})),
              deptColor
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
    <div className={`card flex flex-col h-full m-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden ${mode === 'fullscreen' ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 m-0 leading-tight">
              Company Activity Feed
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-400 m-0">Live event stream direct from database (activity_logs table)</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['ALL', 'TECH', 'PROD', 'GROWTH'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                filter === tab
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Classic Log View Table / Stream */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredEvents.map((e, idx) => (
          <div
            key={e.id || idx}
            className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-2 pb-1.5 border-b border-slate-900/80 text-[11px] leading-relaxed hover:bg-slate-900/50 px-1 rounded transition"
          >
            <span className="text-slate-500 font-mono flex-shrink-0">
              [{e.time}]
            </span>
            <span
              className="font-bold flex-shrink-0"
              style={{ color: e.deptColor || '#38bdf8' }}
            >
              {e.agent}
            </span>
            <span className="text-slate-100 font-semibold flex-shrink-0 sm:border-l sm:border-slate-800 sm:pl-2">
              {e.action}:
            </span>
            <span className="text-slate-400 flex-1 break-words">
              {e.details}
            </span>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="text-slate-500 text-center py-8 text-xs font-sans">
            Belum ada aktivitas yang tercatat. Inisiasi project baru atau berikan arahan di Company Chat.
          </div>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  );
}
