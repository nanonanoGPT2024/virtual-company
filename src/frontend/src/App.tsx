import { useState, useEffect } from 'react';
import { Layout, Users, ClipboardList, Lightbulb, RefreshCw, AlertTriangle } from 'lucide-react';
import VirtualOffice from './components/VirtualOffice';
import LiveFeed from './components/LiveFeed';
import FinancialChart from './components/FinancialChart';

interface Agent {
  id: string;
  name: string;
  title: string;
  autonomy_level: number;
  daily_ai_limit_usd: string;
  monthly_ai_limit_usd: string;
}

interface Task {
  id: string;
  title: string;
  goal: string;
  assignee_id: string;
  priority: string;
  status: string;
  deadline: string;
  budget_usd: string;
}

interface Idea {
  id: string;
  title: string;
  problem: string;
  solution: string;
  score: string;
  status: string;
  revenue_projection_usd: string;
  cost_estimate_usd: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'tasks' | 'ideas'>('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramApi = urlParams.get('api');
    if (paramApi) {
      const cleanApi = paramApi.replace(/\/$/, '');
      localStorage.setItem('API_URL', cleanApi);
      return cleanApi;
    }
    const storedApi = localStorage.getItem('API_URL');
    if (storedApi) return storedApi;
    
    return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || `http://${window.location.hostname}:4000/api`;
  };
  const API_BASE = getApiBase();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, tasksRes, ideasRes] = await Promise.all([
        fetch(`${API_BASE}/agents`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch agents');
          return res.json();
        }),
        fetch(`${API_BASE}/tasks`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch tasks');
          return res.json();
        }),
        fetch(`${API_BASE}/ideas`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch ideas');
          return res.json();
        })
      ]);

      if (agentsRes.success) setAgents(agentsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (ideasRes.success) setIdeas(ideasRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch data from backend API. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <Layout size={24} />
          <span>Company OS</span>
        </div>
        <div className="nav-menu">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Layout size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}
          >
            <Users size={18} />
            AI Agents
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            Task Board
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`nav-item ${activeTab === 'ideas' ? 'active' : ''}`}
          >
            <Lightbulb size={18} />
            Idea Hub
          </button>
        </div>
        <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
          Owner Panel &bull; v1.0.0
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div>
            <h1>AI Virtual Company OS</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Phase 6: Virtual Office Live Monitor
            </p>
          </div>
          <button onClick={fetchData} className="btn-refresh" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
              API Base URL: <code>{API_BASE}</code>
            </p>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={48} className="spin" style={{ marginBottom: '1rem', color: '#0284c7' }} />
            <p>Loading company resources...</p>
          </div>
        ) : (
          <>
            {/* Overview / Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Stats */}
                <div className="grid-stats">
                  <div className="card-stat">
                    <span className="title">Active AI Agents</span>
                    <span className="value">{agents.length}</span>
                    <span className="desc">Hierarchical agent workforce</span>
                  </div>
                  <div className="card-stat">
                    <span className="title">Pending Tasks</span>
                    <span className="value">
                      {tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length}
                    </span>
                    <span className="desc">Assigned backlog in progress</span>
                  </div>
                  <div className="card-stat">
                    <span className="title">Approved Ideas</span>
                    <span className="value">
                      {ideas.filter((i) => i.status === 'APPROVED').length}
                    </span>
                    <span className="desc">Validated business ideas</span>
                  </div>
                </div>

                {/* Virtual Office floor plan */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <VirtualOffice agents={agents} />
                </div>

                {/* Live feed and financial logs chart */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <LiveFeed />
                  <FinancialChart agents={agents} />
                </div>

                <div className="card">
                  <h2>Operational Lifecycle</h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center',
                      background: '#0f172a',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}
                  >
                    <span>OBSERVE</span> &rarr;
                    <span>RESEARCH</span> &rarr;
                    <span>THINK</span> &rarr;
                    <span>PLAN</span> &rarr;
                    <span>DOCUMENT</span> &rarr;
                    <span style={{ color: '#38bdf8' }}>EXECUTE</span> &rarr;
                    <span>REVIEW</span> &rarr;
                    <span>MEASURE</span> &rarr;
                    <span>REPORT</span> &rarr;
                    <span>LEARN</span> &rarr;
                    <span>IMPROVE</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Agents Tab */}
            {activeTab === 'agents' && (
              <div>
                <div className="grid-cards">
                  {agents.map((agent) => (
                    <div className="agent-card" key={agent.id}>
                      <div className="agent-header">
                        <div>
                          <div className="agent-title">{agent.name}</div>
                          <div className="agent-subtitle">{agent.title}</div>
                        </div>
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                          Lv. {agent.autonomy_level}
                        </span>
                      </div>
                      <div className="agent-details">
                        <div className="detail-row">
                          <span>Agent ID</span>
                          <span style={{ fontFamily: 'monospace' }}>{agent.id}</span>
                        </div>
                        <div className="detail-row">
                          <span>Daily AI Limit</span>
                          <span>${parseFloat(agent.daily_ai_limit_usd).toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Monthly AI Limit</span>
                          <span>${parseFloat(agent.monthly_ai_limit_usd).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      No agents registered in database.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task Board Tab */}
            {activeTab === 'tasks' && (
              <div className="card">
                <h2>All Assigned Tasks</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Task Title</th>
                        <th>Goal</th>
                        <th>Assignee</th>
                        <th>Priority</th>
                        <th>Budget</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{task.id.slice(0, 8)}</td>
                          <td style={{ fontWeight: 600 }}>{task.title}</td>
                          <td style={{ maxWidth: '300px', fontSize: '0.85rem', color: '#94a3b8' }}>{task.goal}</td>
                          <td>{task.assignee_id || 'Unassigned'}</td>
                          <td>
                            <span className={`badge badge-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td>${parseFloat(task.budget_usd || '0').toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${task.status.toLowerCase()}`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                            No tasks found in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Idea Hub Tab */}
            {activeTab === 'ideas' && (
              <div className="ideas-grid">
                {ideas.map((idea) => (
                  <div className="idea-card" key={idea.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 className="idea-title">{idea.title}</h3>
                      <span className="idea-score">★ {parseFloat(idea.score).toFixed(1)}</span>
                    </div>
                    <div className="idea-metadata">
                      <span>Status: <strong style={{ color: '#cbd5e1' }}>{idea.status}</strong></span>
                      <span>Projected Revenue: <strong style={{ color: '#22c55e' }}>${parseFloat(idea.revenue_projection_usd || '0').toLocaleString()}</strong></span>
                      <span>Estimated Dev Cost: <strong style={{ color: '#f43f5e' }}>${parseFloat(idea.cost_estimate_usd || '0').toLocaleString()}</strong></span>
                    </div>
                    <div className="idea-body">
                      <p><strong>Problem:</strong> {idea.problem}</p>
                      <p><strong>Solution:</strong> {idea.solution}</p>
                    </div>
                  </div>
                ))}
                {ideas.length === 0 && (
                  <div className="empty-state">
                    No ideas registered in database.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
