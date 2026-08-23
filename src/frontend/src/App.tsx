import { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  GitBranch, 
  Lightbulb, 
  Activity, 
  DollarSign, 
  RefreshCw, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Send,
  MessageSquare,
  X,
  Bot
} from 'lucide-react';
import VirtualOffice from './components/VirtualOffice';
import ProjectPipeline from './components/ProjectPipeline';
import type { ProjectItem } from './components/ProjectTimeline';
import LiveFeed from './components/LiveFeed';
import FinancialChart from './components/FinancialChart';

interface Agent {
  id: string;
  name: string;
  title: string;
  role?: string;
  department_id?: string;
  department_code?: string;
  autonomy_level: number;
  daily_ai_limit_usd: string;
  monthly_ai_limit_usd: string;
  avatar_url?: string;
  ai_cost_used_today?: string;
}

interface Idea {
  id: string;
  title: string;
  problem_statement?: string;
  target_audience?: string;
  proposed_solution?: string;
  market_potential_score?: number;
  estimated_revenue_usd?: number;
  estimated_dev_time_mins?: number;
  status?: string;
  created_at?: string;
}

type NavTab = 'office' | 'pipeline' | 'ideas' | 'activity' | 'finance';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('office');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  
  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('EMP-CEO'); // 'WAR_ROOM' or 'EMP-XXX'
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Idea scan loading
  const [isScanning, setIsScanning] = useState<boolean>(false);

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
    const paramApi = urlParams.get('api');
    if (paramApi) {
      const clean = paramApi.replace(/\/$/, '');
      const full = clean.endsWith('/api') ? clean : `${clean}/api`;
      localStorage.setItem('API_URL', full);
      return full;
    }
    const storedApi = localStorage.getItem('API_URL');
    if (storedApi) {
      const clean = storedApi.replace(/\/$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
    const host = window.location.hostname || 'localhost';
    return `http://${host}:4000/api`;
  };
  const API_BASE = getApiBase();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyRes, agentsRes, ideasRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/company`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/agents`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/ideas`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/projects`).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const loadedAgents = Array.isArray(agentsRes) ? agentsRes : (companyRes?.employees || []);
      setAgents(loadedAgents);

      const loadedIdeas = Array.isArray(ideasRes) ? ideasRes : [];
      setIdeas(loadedIdeas);

      const loadedProjects = Array.isArray(projectsRes) ? projectsRes : [];
      setProjects(loadedProjects);
    } catch (err: any) {
      console.warn('API fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (targetId: string) => {
    try {
      let url = `${API_BASE}/chat`;
      if (targetId === 'WAR_ROOM') {
        url += `?room_type=WAR_ROOM`;
      } else {
        url += `?room_type=DIRECT&agent_id=${targetId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch chat error:', e);
    }
  };

  const handleTargetChange = (newTargetId: string) => {
    setSelectedTargetId(newTargetId);
    fetchChat(newTargetId);
  };

  const handleOpenChatWithAgent = (ag: any) => {
    setSelectedTargetId(ag.id);
    setIsChatOpen(true);
    fetchChat(ag.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const messageText = chatInput;
    const isWarRoom = selectedTargetId === 'WAR_ROOM';
    setChatInput('');
    setChatSending(true);

    const userMsg = {
      id: `temp-${Date.now()}`,
      sender_id: 'EMP-OWNER',
      sender_name: 'Nano (Owner)',
      sender_role: 'Owner',
      message: messageText,
      room_type: isWarRoom ? 'WAR_ROOM' : 'DIRECT',
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          room_type: isWarRoom ? 'WAR_ROOM' : 'DIRECT',
          recipient_id: isWarRoom ? 'EMP-CEO' : selectedTargetId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agent_reply) {
          setChatMessages(prev => [...prev, data.agent_reply]);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setChatSending(false);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScanIdea = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/ideas/scan`, { method: 'POST' });
      if (res.ok) {
        const newIdea = await res.json();
        setIdeas(prev => [newIdea, ...prev]);
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBuildIdea = async (idea: Idea) => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: idea.problem_statement,
          goal: idea.proposed_solution
        })
      });
      if (res.ok) {
        await fetchData();
        setActiveTab('pipeline');
      }
    } catch (e) {
      console.error('Build idea error:', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchChat(selectedTargetId);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatSending, isChatOpen]);

  const currentChatAgent = agents.find(a => a.id === selectedTargetId);

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation - PRD v2.1 (5 Official Menus) */}
      {!isTheaterMode && (
        <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="logo-section">
            {!isSidebarCollapsed && (
              <div className="logo-brand flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-sm leading-tight">VirtuLabs OS</span>
                  <span className="text-[10px] text-cyan-400 font-mono">v2.1 Redesigned</span>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black mx-auto">
                V
              </div>
            )}
            <button onClick={toggleSidebar} className="btn-sidebar-toggle" title={isSidebarCollapsed ? "Expand" : "Collapse"}>
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div className="nav-menu">
            {/* 1. Virtual Office 3D */}
            <button
              onClick={() => setActiveTab('office')}
              className={`nav-item ${activeTab === 'office' ? 'active' : ''}`}
            >
              <Building size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Virtual Office 3D</span>}
            </button>

            {/* 2. Project Pipeline Hub */}
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
            >
              <GitBranch size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Project Pipeline Hub</span>}
            </button>

            {/* 3. Idea Radar */}
            <button
              onClick={() => setActiveTab('ideas')}
              className={`nav-item ${activeTab === 'ideas' ? 'active' : ''}`}
            >
              <Lightbulb size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Idea Radar</span>}
            </button>

            {/* 4. Live Activity Stream */}
            <button
              onClick={() => setActiveTab('activity')}
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            >
              <Activity size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Live Activity Stream</span>}
            </button>

            {/* 5. Financial Analytics */}
            <button
              onClick={() => setActiveTab('finance')}
              className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}
            >
              <DollarSign size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Financial Analytics</span>}
            </button>
          </div>

          <div className="sidebar-footer" style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1rem 0.5rem' }}>
            {!isSidebarCollapsed && <>Founder HQ &bull; VirtuLabs AI</>}
            {isSidebarCollapsed && <>v2.1</>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
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
                <h1>VirtuLabs AI Virtual Company OS</h1>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Autonomous Software & Product Studio &bull; PRD v2.1
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setIsTheaterMode(true)} 
                className="btn-refresh" 
                style={{ borderColor: '#0284c7', color: '#38bdf8' }}
              >
                Full Screen
              </button>
              <button onClick={fetchData} className="btn-refresh" disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
                Sync
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <RefreshCw size={36} className="spin text-cyan-400 mb-3" />
            <p className="text-slate-400 text-sm">Syncing Autonomous Studio state...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* TAB 1: VIRTUAL OFFICE 3D */}
            {activeTab === 'office' && (
              <div className="flex flex-col gap-4 h-full">
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 340px', 
                  gap: '1rem', 
                  alignItems: 'stretch',
                  height: '540px'
                }}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <VirtualOffice 
                      agents={agents} 
                      viewMode={viewMode} 
                      onToggleViewMode={setViewMode} 
                      onStartChatWithAgent={handleOpenChatWithAgent}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '340px', flexShrink: 0, overflow: 'hidden' }}>
                    <LiveFeed />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROJECT PIPELINE HUB */}
            {activeTab === 'pipeline' && (
              <div className="flex flex-col gap-4">
                <ProjectPipeline projects={projects} onProjectCreated={fetchData} apiBase={API_BASE} />
              </div>
            )}

            {/* TAB 3: IDEA RADAR */}
            {activeTab === 'ideas' && (
              <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Lightbulb size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white m-0">
                        Market Research & Idea Feed
                      </h2>
                      <p className="text-xs text-slate-400 m-0">
                        Pesan analisa & peluang SaaS dari Dr. Aris (Researcher)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleScanIdea}
                    disabled={isScanning}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow disabled:opacity-60 cursor-pointer flex-shrink-0"
                  >
                    <Sparkles size={14} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Scanning...' : 'Scan New Opportunity'}
                  </button>
                </div>

                {/* Ideas Message Feed */}
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <div 
                      key={idea.id} 
                      className="flex items-start gap-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md transition hover:border-slate-700"
                    >
                      {/* Compact Initial Badge (No <img>, pure CSS) */}
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0 mt-0.5">
                        🔬
                      </div>

                      {/* Message Body Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-amber-400">Dr. Aris</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Market Intelligence
                            </span>
                            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                              ★ {idea.market_potential_score || 85}/100 Score
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Opportunity Spec
                          </span>
                        </div>

                        {/* Speech Bubble */}
                        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl rounded-tl-sm p-3 mb-2.5">
                          <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                            <span className="text-amber-400">💡</span> {idea.title}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed m-0 whitespace-pre-wrap">
                            {idea.problem_statement}
                          </p>
                        </div>

                        {/* Meta Tags & Action Button */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                            <div>Target: <span className="text-slate-200 font-semibold">{idea.target_audience || 'B2B'}</span></div>
                            <div>Est: <span className="text-emerald-400 font-semibold">${(idea.estimated_revenue_usd || 5000).toLocaleString()}</span></div>
                            <div>Dev: <span className="text-cyan-400 font-semibold">{idea.estimated_dev_time_mins || 5}m</span></div>
                          </div>

                          <button
                            onClick={() => handleBuildIdea(idea)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Sparkles size={12} /> Approve & Build
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {ideas.length === 0 && (
                    <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                      Belum ada ide yang terscan. Klik tombol 'Scan New Opportunity' di atas.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: LIVE ACTIVITY STREAM */}
            {activeTab === 'activity' && (
              <div className="h-[calc(100vh-180px)]">
                <LiveFeed mode="fullscreen" />
              </div>
            )}

            {/* TAB 5: FINANCIAL ANALYTICS */}
            {activeTab === 'finance' && (
              <div className="flex flex-col gap-4">
                <FinancialChart agents={agents} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING CHAT BUBBLE & DRAWER (PRD v2.1) - GLASSMORPHISM & NEON GLOW     */}
      {/* ========================================================================= */}
      <div className="floating-chat-container">
        {/* Chat Drawer Box */}
        {isChatOpen && (
          <div className="floating-chat-drawer">
            {/* Header with Agent/Channel Selector */}
            <div style={{ padding: '0.875rem', background: 'linear-gradient(to right, #020617, #0f172a, #1e1b4b)', borderBottom: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedTargetId === 'WAR_ROOM' ? (
                    <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '0.875rem' }}>⚡</span>
                  ) : (
                    <Bot size={18} style={{ color: '#22d3ee' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#34d399' }} />
                    <select
                      value={selectedTargetId}
                      onChange={(e) => handleTargetChange(e.target.value)}
                      style={{ background: '#0f172a', border: '1px solid #334155', color: '#ffffff', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', maxWidth: '200px', outline: 'none' }}
                    >
                      <option value="EMP-CEO">👑 Chief Aura (CEO)</option>
                      <option value="WAR_ROOM">⚡ Executive War Room</option>
                      <option disabled>────────── 1-on-1 Agents ──────────</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.title})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0.25rem 0 0 0', paddingLeft: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedTargetId === 'WAR_ROOM' ? 'Forum Strategi C-Level Virtual' : (currentChatAgent?.title || 'Agent Direct Chat')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem', background: 'rgba(2, 6, 23, 0.6)' }}>
              {chatMessages.length === 0 && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <MessageSquare size={36} style={{ color: '#475569', marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Belum ada percakapan.</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.375rem 0 0 0' }}>Ketik pesan atau arahan di bawah untuk mulai berinteraksi.</p>
                </div>
              )}

              {chatMessages.map((m, idx) => {
                const isOwner = m.sender_id === 'EMP-OWNER' || m.sender_id === 'OWNER' || m.sender_type === 'HUMAN';
                return (
                  <div key={m.id || idx} style={{ display: 'flex', gap: '0.625rem', justifyContent: isOwner ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwner ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem', padding: '0 0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isOwner ? '#67e8f9' : '#cbd5e1' }}>
                          {m.sender_name || (isOwner ? 'Nano (Owner)' : 'Agent')}
                        </span>
                        {!isOwner && m.sender_role && (
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', background: '#1e293b', color: '#22d3ee', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', border: '1px solid #334155' }}>
                            {m.sender_role}
                          </span>
                        )}
                      </div>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '1.125rem',
                        borderTopRightRadius: isOwner ? '0.25rem' : '1.125rem',
                        borderTopLeftRadius: !isOwner ? '0.25rem' : '1.125rem',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        background: isOwner ? 'linear-gradient(to right, #0891b2, #4f46e5)' : '#1e293b',
                        color: isOwner ? '#ffffff' : '#f1f5f9',
                        border: isOwner ? 'none' : '1px solid #334155',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.375rem', fontFamily: 'monospace', textAlign: 'right', color: isOwner ? '#a5f3fc' : '#94a3b8' }}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {chatSending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#22d3ee', fontStyle: 'italic', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.6)', padding: '0.625rem 0.875rem', borderRadius: '0.75rem', width: 'fit-content' }}>
                  <Sparkles size={14} style={{ color: '#22d3ee' }} />
                  AI Agent sedang memproses...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid rgba(51,65,85,0.8)', background: 'rgba(2, 6, 23, 0.95)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={selectedTargetId === 'WAR_ROOM' ? "Kirim instruksi ke War Room..." : `Chat dengan ${currentChatAgent?.name || 'Agent'}...`}
                style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.625rem 0.875rem', fontSize: '0.85rem', color: '#ffffff', outline: 'none' }}
              />
              <button 
                type="submit"
                disabled={!chatInput.trim() || chatSending}
                style={{ background: '#0891b2', border: 'none', color: '#ffffff', padding: '0.625rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: (!chatInput.trim() || chatSending) ? 0.5 : 1 }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="floating-chat-btn"
          title="Buka Company Chat & War Room"
        >
          {isChatOpen ? (
            <X size={24} />
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={24} color="#ffffff" />
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: '#10b981', border: '2px solid #0f172a' }} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
