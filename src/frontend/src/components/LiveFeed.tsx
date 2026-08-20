import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface FeedEvent {
  time: string;
  agent: string;
  action: string;
  details: string;
}

export default function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([
    { time: '08:30:15', agent: 'Sovereign (CEO)', action: 'Meeting Started', details: 'Initialized weekly executive alignment meeting' },
    { time: '08:29:02', agent: 'Alex (Architect)', action: 'DB Seeding Verified', details: 'Confirmed 9 relational tables seeded in PostgreSQL' },
    { time: '08:26:45', agent: 'Sovereign (CEO)', action: 'Approved Idea', details: 'Approved AI Agent Cost Accounting Auditor (IDEA-001)' },
    { time: '08:24:12', agent: 'Alex (Architect)', action: 'Modified Dockerfiles', details: 'Upgraded Node base image to node:22-alpine' },
    { time: '08:15:30', agent: 'System', action: 'Heartbeat Check', details: 'All services reported online' }
  ]);

  useEffect(() => {
    const actions = [
      { agent: 'Alex (Architect)', action: 'Refactoring Code', details: 'Optimizing DB query parameters for tasks router' },
      { agent: 'Sovereign (CEO)', action: 'Reviewing KPI', details: 'Calculating executive performance targets' },
      { agent: 'Alex (Architect)', action: 'Writing LLD', details: 'Drafting database schema for long-term memory' },
      { agent: 'System', action: 'Vector Store Sync', details: 'Synchronized 14 document segments to Qdrant' },
      { agent: 'Sovereign (CEO)', action: 'Analyzing Market', details: 'Triggered trends scan loop for software products' }
    ];

    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEvent: FeedEvent = {
        time: timeStr,
        agent: randomAction.agent,
        action: randomAction.action,
        details: randomAction.details
      };
      setEvents(prev => [newEvent, ...prev.slice(0, 14)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Terminal size={20} style={{ color: '#38bdf8' }} />
        <h2 style={{ margin: 0 }}>Company Activity Feed</h2>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Live event stream showing real-time decisions, task progress, and agent collaborations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', background: '#0f172a', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        {events.map((e, idx) => (
          <div key={idx} style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', display: 'grid', gridTemplateColumns: '80px 150px 150px 1fr', gap: '0.5rem' }}>
            <span style={{ color: '#64748b' }}>[{e.time}]</span>
            <span style={{ color: e.agent.startsWith('Alex') ? '#4ade80' : e.agent.startsWith('Sovereign') ? '#38bdf8' : '#f43f5e', fontWeight: 600 }}>{e.agent}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{e.action}</span>
            <span style={{ color: '#94a3b8' }}>{e.details}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
