import { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  GitBranch, 
  MessageSquare, 
  Lightbulb, 
  Activity, 
  DollarSign, 
  RefreshCw, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Send 
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

type NavTab = 'office' | 'pipeline' | 'chat' | 'ideas' | 'activity' | 'finance';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('office');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [activeChatAgent, setActiveChatAgent] = useState<Agent | null>(null);
  const [chatRoomType, setChatRoomType] = useState<'WAR_ROOM' | 'DIRECT'>('WAR_ROOM');
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
    let paramApi = urlParams.get('api');
    if (paramApi) {
      paramApi = paramApi.replace(/\/$/, '');
      if (!paramApi.endsWith('/api')) paramApi += '/api';
      localStorage.setItem('API_URL', paramApi);
      return paramApi;
    }
    let storedApi = localStorage.getItem('API_URL');
    if (storedApi) {
      storedApi = storedApi.replace(/\/$/, '');
      if (!storedApi.endsWith('/api')) storedApi += '/api';
      return storedApi;
    }
    if (window.location.port === '5173' || window.location.port === '5174') {
      return `http://${window.location.hostname}:4000/api`;
    }
    return `${window.location.origin}/api`;
  };
  const API_BASE = getApiBase();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyRes, agentsRes, ideasRes, chatRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/company`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/agents`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/ideas`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/chat`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/projects`).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const loadedAgents = Array.isArray(agentsRes) ? agentsRes : (companyRes?.employees || []);
      setAgents(loadedAgents);

      const loadedIdeas = Array.isArray(ideasRes) ? ideasRes : [];
      setIdeas(loadedIdeas);

      const loadedChats = Array.isArray(chatRes) ? chatRes : [];
      setChatMessages(loadedChats);

      const loadedProjects = Array.isArray(projectsRes) ? projectsRes : [];
      setProjects(loadedProjects);
    } catch (err: any) {
      console.warn('API fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async (agentId?: string) => {
    try {
      let url = `${API_BASE}/chat`;
      if (agentId) {
        url += `?room_type=DIRECT&agent_id=${agentId}`;
      } else {
        url += `?room_type=WAR_ROOM`;
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const messageText = chatInput;
    setChatInput('');
    setChatSending(true);

    const userMsg = {
      id: `temp-${Date.now()}`,
      sender_id: 'EMP-OWNER',
      sender_name: 'Nano (Owner)',
      sender_role: 'Owner',
      message: messageText,
      room_type: chatRoomType,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          room_type: chatRoomType,
          recipient_id: chatRoomType === 'DIRECT' && activeChatAgent ? activeChatAgent.id : 'EMP-CEO'
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
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatSending]);

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation - PRD v2.0 Official */}
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
                  <span className="text-[10px] text-cyan-400 font-mono">v2.0 Redesigned</span>
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

            {/* 3. Company Chat */}
            <button
              onClick={() => {
                setActiveTab('chat');
                fetchChat(activeChatAgent?.id);
              }}
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <MessageSquare size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Company Chat</span>}
            </button>

            {/* 4. Idea Radar */}
            <button
              onClick={() => setActiveTab('ideas')}
              className={`nav-item ${activeTab === 'ideas' ? 'active' : ''}`}
            >
              <Lightbulb size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Idea Radar</span>}
            </button>

            {/* 5. Live Activity Stream */}
            <button
              onClick={() => setActiveTab('activity')}
              className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`}
            >
              <Activity size={18} />
              {!isSidebarCollapsed && <span className="nav-text">Live Activity Stream</span>}
            </button>

            {/* 6. Financial Analytics */}
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
            {isSidebarCollapsed && <>v2.0</>}
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
                  Autonomous Software & Product Studio &bull; PRD v2.0
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
                  gridTemplateColumns: '1fr 310px', 
                  gap: '1rem', 
                  alignItems: 'stretch'
                }}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '520px' }}>
                    <VirtualOffice 
                      agents={agents} 
                      viewMode={viewMode} 
                      onToggleViewMode={setViewMode} 
                      onStartChatWithAgent={(ag) => {
                        setActiveChatAgent(ag as any);
                        setChatRoomType('DIRECT');
                        setActiveTab('chat');
                        fetchChat(ag.id);
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '520px', width: '310px', flexShrink: 0 }}>
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

            {/* TAB 3: COMPANY CHAT */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl" style={{ height: 'calc(100vh - 180px)' }}>
                {/* Agent & Room Directory (Sidebar Chat) */}
                <div className="md:col-span-1 border-r border-slate-800 p-3 flex flex-col gap-1.5 overflow-y-auto bg-slate-950/60 scrollbar-thin scrollbar-thumb-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    Channels
                  </span>
                  
                  <button
                    onClick={() => {
                      setChatRoomType('WAR_ROOM');
                      setActiveChatAgent(null);
                      fetchChat();
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition ${
                      chatRoomType === 'WAR_ROOM' 
                        ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-md' 
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shadow-inner">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Executive War Room</div>
                      <div className="text-[10px] text-slate-400 truncate">C-Level Strategy Forum</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </button>

                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mt-2">
                    1-on-1 Direct Agents ({agents.length})
                  </span>
                  
                  {agents.map((ag) => {
                    const isSelected = chatRoomType === 'DIRECT' && activeChatAgent?.id === ag.id;
                    return (
                      <button
                        key={ag.id}
                        onClick={() => {
                          setChatRoomType('DIRECT');
                          setActiveChatAgent(ag);
                          fetchChat(ag.id);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                          isSelected 
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-md' 
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img 
                            src={ag.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${ag.id}`} 
                            alt={ag.name}
                            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover" 
                          />
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate leading-tight">{ag.name}</div>
                          <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{ag.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Chat Panel & Conversation Window */}
                <div className="md:col-span-3 flex flex-col h-full bg-slate-900/40">
                  {/* Header Bar */}
                  <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      {chatRoomType === 'DIRECT' && activeChatAgent ? (
                        <img 
                          src={activeChatAgent.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeChatAgent.id}`} 
                          alt={activeChatAgent.name}
                          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                          ⚡
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white leading-none">
                            {chatRoomType === 'WAR_ROOM' ? 'Executive War Room' : activeChatAgent?.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-none">
                          {chatRoomType === 'WAR_ROOM' ? 'Forum strategi multi-agen C-Level' : activeChatAgent?.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {chatRoomType === 'WAR_ROOM' ? 'Room: WAR_ROOM' : `ID: ${activeChatAgent?.id}`}
                    </span>
                  </div>

                  {/* Messages Bubble Timeline */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans scrollbar-thin scrollbar-thumb-slate-800">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <MessageSquare size={36} className="text-slate-600 mb-2" />
                        <p className="text-xs font-semibold text-slate-400">Belum ada percakapan dalam sesi ini.</p>
                        <p className="text-[11px] text-slate-500">Kirim instruksi, pertanyaan, atau ide bisnis di bawah untuk memulai!</p>
                      </div>
                    )}

                    {chatMessages.map((m, idx) => {
                      const isOwner = m.sender_id === 'EMP-OWNER' || m.sender_id === 'OWNER' || m.sender_type === 'HUMAN';
                      return (
                        <div key={m.id || idx} className={`flex gap-2.5 ${isOwner ? 'justify-end' : 'justify-start'}`}>
                          {/* AI Avatar */}
                          {!isOwner && (
                            <img 
                              src={m.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.sender_id || 'AI'}`} 
                              alt="avatar"
                              className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 mt-1 flex-shrink-0 shadow-sm" 
                            />
                          )}

                          {/* Bubble Container */}
                          <div className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'} max-w-[80%]`}>
                            {/* Sender Info Header */}
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className={`text-[11px] font-bold ${isOwner ? 'text-cyan-300' : 'text-slate-300'}`}>
                                {m.sender_name || (isOwner ? 'Nano (Owner)' : 'Agent')}
                              </span>
                              {!isOwner && m.sender_role && (
                                <span className="text-[9px] font-mono uppercase bg-slate-800 text-cyan-400 px-1.5 py-0.2 rounded border border-slate-700">
                                  {m.sender_role}
                                </span>
                              )}
                            </div>

                            {/* Speech Bubble Box */}
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                              isOwner 
                                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-sm shadow-cyan-950/40' 
                                : 'bg-slate-800/95 text-slate-100 border border-slate-700/80 rounded-tl-sm shadow-slate-950/50'
                            }`}>
                              <div className="whitespace-pre-wrap">{m.message}</div>
                              <div className={`text-[9px] mt-1 font-mono text-right ${isOwner ? 'text-cyan-200' : 'text-slate-400'}`}>
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {chatSending && (
                      <div className="flex items-center gap-2 text-xs text-cyan-400 italic bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-xl w-fit">
                        <Sparkles size={14} className="animate-spin text-cyan-400" />
                        AI Agent sedang memikirkan dan mengetik balasan...
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/90 flex gap-2 items-center">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder={chatRoomType === 'WAR_ROOM' ? "Kirim pesan atau arahan strategis ke War Room C-Level..." : `Kirim pesan ke ${activeChatAgent?.name || 'Agent'}...`}
                      className="flex-1 bg-slate-900 border border-slate-700/90 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg flex-shrink-0"
                    >
                      <Send size={14} /> Send
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: IDEA RADAR & SCAN */}
            {activeTab === 'ideas' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Lightbulb className="text-amber-400" size={20} />
                      Autonomous Idea Radar & Market Scan
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Peluang software & SaaS micro-tools yang diidentifikasi oleh Market Researcher Agent (Dr. Aris).
                    </p>
                  </div>
                  <button
                    onClick={handleScanIdea}
                    disabled={isScanning}
                    className="bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    <Sparkles size={14} className={isScanning ? 'animate-spin' : ''} />
                    {isScanning ? 'Scanning Market...' : 'Scan New Market Opportunity'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ideas.map((idea) => (
                    <div key={idea.id} className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-2xl flex flex-col justify-between transition shadow-lg">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-white text-sm">{idea.title}</h3>
                          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            ★ {idea.market_potential_score || 85}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{idea.problem_statement}</p>
                        
                        <div className="space-y-1.5 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Target User:</span>
                            <span className="text-slate-300 font-semibold">{idea.target_audience || 'B2B/Freelance'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Proj. Revenue:</span>
                            <span className="text-emerald-400 font-semibold font-mono">${(idea.estimated_revenue_usd || 5000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Build Time:</span>
                            <span className="text-cyan-400 font-semibold font-mono">{idea.estimated_dev_time_mins || 5} mins</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuildIdea(idea)}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={14} /> Approve & Build Project
                      </button>
                    </div>
                  ))}
                  {ideas.length === 0 && (
                    <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
                      Belum ada ide yang terscan. Klik tombol 'Scan New Market Opportunity' di atas.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: LIVE ACTIVITY STREAM */}
            {activeTab === 'activity' && (
              <div className="h-[calc(100vh-180px)]">
                <LiveFeed mode="fullscreen" />
              </div>
            )}

            {/* TAB 6: FINANCIAL ANALYTICS */}
            {activeTab === 'finance' && (
              <div className="flex flex-col gap-4">
                <FinancialChart agents={agents} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
