import { useState, useEffect, useRef } from 'react';
import { Layout, Users, ClipboardList, Lightbulb, RefreshCw, AlertTriangle, Menu, ChevronLeft, ChevronRight, MessageSquare, FileText, Eye, GitBranch, Download } from 'lucide-react';
import VirtualOffice from './components/VirtualOffice';
import ProjectPipeline from './components/ProjectPipeline';
import type { ProjectItem } from './components/ProjectTimeline';
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


interface DocumentItem {
  id: string;
  project_id: string | null;
  type: string;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'agents' | 'tasks' | 'ideas' | 'documents' | 'chat'>('dashboard');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [isChatBubbleOpen, setIsChatBubbleOpen] = useState<boolean>(false);
  const [isFeedOpen, setIsFeedOpen] = useState<boolean>(true);
  const [activeChatAgent, setActiveChatAgent] = useState<Agent | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatBottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isChatBubbleOpen) {
      scrollToBottom('smooth');
    }
  }, [chatMessages, isChatBubbleOpen, chatSending]);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  const getApiBase = () => {
    const urlParams = new URLSearchParams(window.location.search);
    let paramApi = urlParams.get('api');
    if (paramApi) {
      paramApi = paramApi.replace(/\/$/, '');
      if (!paramApi.endsWith('/api')) {
        paramApi += '/api';
      }
      localStorage.setItem('API_URL', paramApi);
      return paramApi;
    }
    let storedApi = localStorage.getItem('API_URL');
    if (storedApi) {
      storedApi = storedApi.replace(/\/$/, '');
      if (!storedApi.endsWith('/api')) {
        storedApi += '/api';
      }
      return storedApi;
    }
    
    if (window.location.port === '5173' || window.location.port === '5174') {
      return `http://${window.location.hostname}:4000/api`;
    }
    return `${window.location.origin}/api`;
  };
  const API_BASE = getApiBase();

  const handleDownloadMd = (title: string, contentText: string) => {
    const filename = `${title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.md`;
    const blob = new Blob([contentText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, tasksRes, ideasRes, chatRes, docsRes, projectsRes] = await Promise.all([
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
        }),
        fetch(`${API_BASE}/chat`).then((res) => {
          if (!res.ok) return { success: false, data: [] };
          return res.json();
        }).catch(() => ({ success: true, data: [] })),
        fetch(`${API_BASE}/documents`).then((res) => {
          if (!res.ok) return { success: false, data: [] };
          return res.json();
        }).catch(() => ({ success: true, data: [] })),
        fetch(`${API_BASE}/projects`).then((res) => {
          if (!res.ok) return { success: false, data: [] };
          return res.json();
        }).catch(() => ({ success: true, data: [] }))
      ]);

      if (agentsRes.success) setAgents(agentsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (ideasRes.success) setIdeas(ideasRes.data);
      if (chatRes.success) setChatMessages(chatRes.data);
      if (docsRes.success) setDocuments(docsRes.data);
      if (projectsRes.success) setProjects(projectsRes.data);
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
      {!isTheaterMode && (
        <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="logo-section">
            {!isSidebarCollapsed && (
              <div className="logo-brand">
                <Layout size={24} />
                <span>Company OS</span>
              </div>
            )}
            {isSidebarCollapsed && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <Layout size={24} />
              </div>
            )}
            <button onClick={toggleSidebar} className="btn-sidebar-toggle" title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <div className="nav-menu">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <Layout size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Overview</span>}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`}
            >
              <GitBranch size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Pipeline Project</span>}
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}
            >
              <Users size={18} />
              {!isSidebarCollapsed && <span className="nav-text">AI Agents</span>}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            >
              <ClipboardList size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Task Board</span>}
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`nav-item ${activeTab === 'ideas' ? 'active' : ''}`}
            >
              <Lightbulb size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Idea Hub</span>}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
            >
              <FileText size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Hasil Kerja</span>}
            </button>
            </div>
          <div className="sidebar-footer" style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            {!isSidebarCollapsed && <>Owner Panel &bull; v1.0.0</>}
            {isSidebarCollapsed && <>v1.0</>}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content" style={isTheaterMode ? { padding: '0.5rem', maxWidth: '100vw', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}}>
        {!isTheaterMode && (
          <div className="header">
            <div className="header-left">
              {isSidebarCollapsed && (
                <button onClick={toggleSidebar} className="btn-menu-trigger" title="Open Menu" style={{ marginRight: '1rem' }}>
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1>AI Virtual Company OS</h1>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Phase 6: Virtual Office Live Monitor
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setIsTheaterMode(true)} 
                className="btn-refresh" 
                style={{ borderColor: '#0284c7', color: '#38bdf8' }}
              >
                Theater Mode
              </button>
              <button onClick={fetchData} className="btn-refresh" disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        )}

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
              <div style={isTheaterMode ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } : {}}>
                {/* Stats */}
                {!isTheaterMode && (
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
                )}

                {/* Fullscreen / Theater Mode Header Bar */}
                {isTheaterMode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', background: '#1e293b', padding: '3px', borderRadius: '6px', border: '1px solid #334155' }}>
                        <button 
                          onClick={() => setViewMode('2d')}
                          style={{ 
                            padding: '4px 12px', 
                            borderRadius: '4px', 
                            border: 'none', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            background: viewMode === '2d' ? '#0284c7' : 'transparent',
                            color: viewMode === '2d' ? '#ffffff' : '#94a3b8'
                          }}
                        >
                          🗺️ 2D Floorplan
                        </button>
                        <button 
                          onClick={() => setViewMode('3d')}
                          style={{ 
                            padding: '4px 12px', 
                            borderRadius: '4px', 
                            border: 'none', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            background: viewMode === '3d' ? '#0284c7' : 'transparent',
                            color: viewMode === '3d' ? '#ffffff' : '#94a3b8'
                          }}
                        >
                          🎮 3D Roblox
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>AI OFFICE LIVE STREAM</span>
                      <button 
                        onClick={() => setIsFeedOpen(prev => !prev)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #334155',
                          background: isFeedOpen ? '#0284c7' : '#1e293b',
                          color: isFeedOpen ? '#fff' : '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📊 {isFeedOpen ? 'Hide Activity Feed' : 'Show Activity Feed'}
                      </button>
                    </div>

                    <button 
                      onClick={() => setIsTheaterMode(false)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      Tutup Full Screen
                    </button>
                  </div>
                )}

                {/* Main Visual & Activity Feed Area */}
                {isTheaterMode ? (
                  /* Full Screen Mode: Visual takes full width/height with Feed overlaid on the right */
                  <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', background: '#020617' }}>
                    <div style={{ width: '100%', height: '100%' }}>
                      <VirtualOffice 
                        agents={agents} 
                        viewMode={viewMode} 
                        onToggleViewMode={setViewMode} 
                        onStartChatWithAgent={(ag) => {
                          setActiveChatAgent(ag as any);
                          setIsChatBubbleOpen(true);
                          fetch(`${API_BASE}/chat?agent_id=${ag.id}`, { headers: { 'bypass-tunnel-reminder': '1' } })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success) setChatMessages(data.data);
                            })
                            .catch(console.error);
                        }}
                      />
                    </div>

                    {/* Sliding Activity Feed Drawer on the right (Width 520px) */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      bottom: '12px',
                      width: '40%', minWidth: '360px',
                      maxWidth: 'calc(100vw - 32px)',
                      backgroundColor: 'rgba(15, 23, 42, 0.92)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      zIndex: 30,
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '-6px 0 20px rgba(0,0,0,0.6)',
                      overflow: 'hidden',
                      transform: isFeedOpen ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
                      transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: isFeedOpen ? 'auto' : 'none'
                    }}>
                      <div style={{ padding: '8px 12px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>Company Activity Stream</span>
                        <button 
                          onClick={() => setIsFeedOpen(false)}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                        >
                          &times;
                        </button>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <LiveFeed />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal View Mode */
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <VirtualOffice 
                        agents={agents} 
                        viewMode={viewMode} 
                        onToggleViewMode={setViewMode} 
                        onStartChatWithAgent={(ag) => {
                          setActiveChatAgent(ag as any);
                          setIsChatBubbleOpen(true);
                          fetch(`${API_BASE}/chat?agent_id=${ag.id}`, { headers: { 'bypass-tunnel-reminder': '1' } })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success) setChatMessages(data.data);
                            })
                            .catch(console.error);
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
                      <LiveFeed />
                    </div>
                  </div>
                )}

                {!isTheaterMode && (
                  <>
                    {/* Financial logs chart */}
                    <div style={{ marginBottom: '1.5rem' }}>
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
                  </>
                )}
              </div>
            )}

                        {/* Project Timeline & Pipeline Tab */}
            {activeTab === 'timeline' && (
              <ProjectPipeline projects={projects} onProjectCreated={fetchData} apiBase={API_BASE} />
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

            {/* Hasil Kerja & Deliverables Tab */}
            {activeTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Stats bar */}
                <div className="grid-stats">
                  <div className="card-stat">
                    <span className="title">Total Deliverables</span>
                    <span className="value">{documents.length}</span>
                    <span className="desc">Hasil dokumen & artefak kerja agen</span>
                  </div>
                  <div className="card-stat">
                    <span className="title">Tipe Dokumen</span>
                    <span className="value">{Array.from(new Set(documents.map(d => d.type))).length}</span>
                    <span className="desc">Kategori spesifikasi & riset</span>
                  </div>
                  <div className="card-stat">
                    <span className="title">Status Eksekusi</span>
                    <span className="value" style={{ color: '#22c55e' }}>Aktif</span>
                    <span className="desc">Tersinkronisasi dengan database</span>
                  </div>
                </div>

                {/* Main Documents Grid & Viewer */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
                  {/* Documents List */}
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="#38bdf8" />
                        Daftar Output & Dokumen Agen
                      </h2>
                    </div>

                    {documents.length === 0 ? (
                      <div className="empty-state">
                        Belum ada dokumen hasil kerja yang tersimpan di database.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {documents.map((doc) => {
                          const isSelected = selectedDoc?.id === doc.id;
                          return (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDoc(doc)}
                              style={{
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                backgroundColor: isSelected ? '#1e293b' : '#0f172a',
                                border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#64748b';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: '#0369a1',
                                      color: '#e0f2fe'
                                    }}
                                  >
                                    {doc.type}
                                  </span>
                                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                                    {doc.title}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                  <span>v{doc.version || 1}.0</span>
                                  <span>•</span>
                                  <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                </div>
                              </div>
                              <button
                                style={{
                                  background: isSelected ? '#0284c7' : 'transparent',
                                  border: '1px solid #334155',
                                  color: '#f8fafc',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Eye size={14} />
                                {isSelected ? 'Membuka' : 'Lihat'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Document Detail Preview Panel */}
                  {selectedDoc && (
                    <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0369a1', color: '#e0f2fe' }}>
                              {selectedDoc.type}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              Versi {selectedDoc.version || 1}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            {selectedDoc.title}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleDownloadMd(selectedDoc.title, selectedDoc.content)}
                            style={{
                              backgroundColor: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            title="Download Dokumen sebagai File Markdown (.md)"
                          >
                            <Download size={14} />
                            Download .md
                          </button>
                          <button
                            onClick={() => setSelectedDoc(null)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '1.25rem',
                              cursor: 'pointer',
                              padding: '0.2rem 0.5rem'
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <div>
                          <strong>Doc ID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedDoc.id.slice(0, 8)}...</span>
                        </div>
                        <div>
                          <strong>Waktu:</strong> {selectedDoc.updated_at ? new Date(selectedDoc.updated_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#090d16',
                          padding: '1.25rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #1e293b',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.85rem',
                          lineHeight: '1.6',
                          color: '#cbd5e1',
                          maxHeight: '480px',
                          overflowY: 'auto'
                        }}
                      >
                        {selectedDoc.content || '(Konten dokumen kosong)'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </>
        )}
      </div>
    
      {/* Floating Owner Chat Bubble */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {isChatBubbleOpen && (
          <div style={{
            width: '360px',
            height: '500px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '12px',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)'
          }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                  {activeChatAgent ? `Chat with ${activeChatAgent.name}` : `Owner's Chat (CEO Sovereign)`}
                </span>
              </div>
              <button 
                onClick={() => setIsChatBubbleOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Belum ada pesan. Tanya sesuatu ke CEO!
                </div>
              ) : (
                chatMessages.map((m: any, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      alignSelf: m.sender_id === 'OWNER' ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: m.sender_id === 'OWNER' ? '#0284c7' : '#1e293b',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: m.sender_id === 'OWNER' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      border: m.sender_id === 'OWNER' ? 'none' : '1px solid #334155'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.7rem', color: m.sender_id === 'OWNER' ? '#e0f2fe' : '#38bdf8', marginBottom: '2px' }}>
                      {m.sender_name}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.35' }}>{m.message}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
                      {m.created_at && !isNaN(new Date(m.created_at).getTime()) ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              {chatSending && (
                <div style={{ alignSelf: 'flex-start', background: '#1e293b', color: '#94a3b8', padding: '8px 12px', borderRadius: '12px 12px 12px 2px', border: '1px solid #334155', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Sovereign sedang mengetik...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim() || chatSending) return;
                
                const userMsg = {
                  sender_id: 'OWNER',
                  sender_name: 'Owner (You)',
                  message: chatInput,
                  created_at: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, userMsg]);
                const sentText = chatInput;
                setChatInput('');
                setChatSending(true);

                fetch(`${API_BASE}/chat`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': '1' },
                  body: JSON.stringify({ message: sentText, agent_id: activeChatAgent ? activeChatAgent.id : 'EMP-EXE-001' })
                })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success && data.data) {
                      if (Array.isArray(data.data)) {
                        setChatMessages(data.data);
                      } else {
                        setChatMessages(prev => [...prev, data.data]);
                      }
                    }
                  })
                  .catch(err => {
                    console.error('Chat error:', err);
                  })
                  .finally(() => {
                    setChatSending(false);
                  });
              }}
              style={{ padding: '10px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'flex-end', gap: '8px', background: '#090d16' }}
            >
              <textarea
                placeholder={activeChatAgent ? `Tanya sesuatu ke ${activeChatAgent.name}...` : "Kirim pesan ke Sovereign..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
                  }
                }}
                rows={1}
                disabled={chatSending}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  background: '#1e293b', 
                  border: '1px solid #334155', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '0.85rem', 
                  outline: 'none',
                  resize: 'none',
                  minHeight: '38px',
                  maxHeight: '120px',
                  lineHeight: '1.4',
                  fontFamily: 'inherit',
                  overflowY: 'auto'
                }}
              />
              <button 
                type="submit" 
                disabled={chatSending || !chatInput.trim()}
                style={{ padding: '8px 14px', height: '38px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: (chatSending || !chatInput.trim()) ? 0.6 : 1, flexShrink: 0 }}
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Floating Trigger Button */}
        <button
          onClick={() => {
            const willOpen = !isChatBubbleOpen;
            setIsChatBubbleOpen(willOpen);
            if (willOpen) {
              const targetId = activeChatAgent ? activeChatAgent.id : 'EMP-EXE-001';
              fetch(`${API_BASE}/chat?agent_id=${targetId}`, { headers: { 'bypass-tunnel-reminder': '1' } })
                .then(res => res.json())
                .then(data => {
                  if (data.success) setChatMessages(data.data);
                })
                .catch(console.error);
            }
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.4), 0 4px 6px -4px rgba(2, 132, 199, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Owner Chat"
        >
          <MessageSquare size={24} />
        </button>
      </div>
</div>
  );
}

export default App;
