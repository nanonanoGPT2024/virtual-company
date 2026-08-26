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
  Bot,
  Users,
  LogOut,
  Lock,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import VirtualOffice from './components/VirtualOffice';
import ProjectPipeline from './components/ProjectPipeline';
import type { ProjectItem } from './components/ProjectTimeline';
import LiveFeed from './components/LiveFeed';
import FinancialChart from './components/FinancialChart';
import UserDirectory from './components/UserDirectory';

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

type NavTab = 'office' | 'pipeline' | 'ideas' | 'activity' | 'finance' | 'users';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'CLIENT';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('office');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  // Multi-User Auth State (Strict - No Hardcoded Auto-Login)
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('company_os_token'));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('company_os_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAuthModeLogin, setIsAuthModeLogin] = useState<boolean>(true);
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // Filter Inspect User Projects State (Owner Mode)
  const [inspectUser, setInspectUser] = useState<{ id: string; name: string } | null>(null);

  // Audio & Smart Toast Notification State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sound_notifications') !== 'false';
  });
  const [toastNotification, setToastNotification] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const prevStagesRef = useRef<Record<string, string>>({});

  // Web Audio API Synthesizer (Pleasant Soft Chime)
  const playSynthesizedChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440.00, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (_) {}
  };

  const triggerStageToast = (title: string, message: string, type: string = 'info') => {
    playSynthesizedChime();
    setToastNotification({
      id: `toast-${Date.now()}`,
      title,
      message,
      type
    });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('sound_notifications', String(next));
      return next;
    });
  };
  
  // Floating Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('EMP-CEO');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Default drawer tertutup saat awal load agar 3D HQ tampil bersih & luas
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);

  const toggleActivityDrawer = () => {
    setIsActivityDrawerOpen(prev => !prev);
  };

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
    return '/api';
  };
  const API_BASE = getApiBase();

  const fetchData = async (isBackground: boolean = false, tokenOverride?: string | null) => {
    if (!isBackground) {
      setLoading(true);
    }
    try {
      const activeToken = tokenOverride !== undefined ? tokenOverride : (authToken || localStorage.getItem('company_os_token'));
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      } else {
        // If no token available, clear sensitive state
        setProjects([]);
        setIdeas([]);
        return;
      }

      const [companyRes, agentsRes, ideasRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/company`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/agents`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/ideas`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/projects`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const loadedAgents = Array.isArray(agentsRes) ? agentsRes : (companyRes?.employees || []);
      setAgents(loadedAgents);

      const loadedIdeas = Array.isArray(ideasRes) ? ideasRes : [];
      setIdeas(loadedIdeas);

      const loadedProjects = Array.isArray(projectsRes) ? projectsRes : [];
      
      // Stage Shift Detection for Autonomous Smart Toast & Soft Chime
      loadedProjects.forEach((proj: ProjectItem) => {
        const prevStage = prevStagesRef.current[proj.id];
        const currentStage = (proj as any).current_stage || proj.status;
        if (prevStage && prevStage !== currentStage) {
          if (currentStage.includes('PRD')) {
            triggerStageToast('📄 PRD Selesai', `Sarah (PM) telah menyelesaikan dokumen 01_PRD.md untuk ${proj.name || proj.title}`);
          } else if (currentStage.includes('Building') || currentStage.includes('Engineering') || currentStage.includes('Parallel')) {
            triggerStageToast('💻 Koding Paralel Dimulai', `Devron, Kaelen & Viktor sedang mengeksekusi source code & arsitektur ${proj.name || proj.title}`);
          } else if (currentStage.includes('Testing') || currentStage.includes('QA')) {
            triggerStageToast('🛡️ QA & Security Audit', `Tessa & Sentinel sedang menjalankan validasi kualitas & test suite`);
          } else if (currentStage.includes('Live') || currentStage === 'DEPLOYED' || (proj as any).progress_percentage === 100) {
            triggerStageToast('🎉 Proyek Live & Deployed!', `Proyek ${proj.name || proj.title} telah sukses aktif di port ${proj.port || 5001}`, 'success');
          }
        }
        prevStagesRef.current[proj.id] = currentStage;
      });

      setProjects(loadedProjects);
    } catch (err: any) {
      console.warn('API fetch warning:', err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    const endpoint = isAuthModeLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
    const payload = isAuthModeLogin 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('company_os_token', data.token);
        localStorage.setItem('company_os_user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
        fetchData(false, data.token);
        fetchChat(selectedTargetId, data.token);
      } else {
        setAuthError(data.error || 'Autentikasi gagal');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('company_os_token');
    localStorage.removeItem('company_os_user');
    setAuthToken(null);
    setCurrentUser(null);
    setInspectUser(null);
    setProjects([]);
    setIdeas([]);
    setChatMessages([]);
    setIsAuthModalOpen(true);
  };

  const handleInspectUserProjects = (userId: string, userName: string) => {
    setInspectUser({ id: userId, name: userName });
    setActiveTab('pipeline');
    fetchData(false, authToken);
  };

  const fetchChat = async (targetId: string, tokenOverride?: string | null) => {
    try {
      const activeToken = tokenOverride !== undefined ? tokenOverride : (authToken || localStorage.getItem('company_os_token'));
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      let url = `${API_BASE}/chat`;
      if (targetId === 'WAR_ROOM') {
        url += `?room_type=WAR_ROOM`;
      } else {
        url += `?room_type=DIRECT&agent_id=${targetId}`;
      }
      const res = await fetch(url, { headers });
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

    const isClient = currentUser?.role === 'CLIENT';
    const fallbackSenderName = currentUser?.name || (isClient ? 'Client' : 'Nano (Owner)');
    const fallbackSenderRole = currentUser?.role === 'OWNER' ? 'Owner' : (currentUser?.role || 'Client');

    const userMsg = {
      id: `temp-${Date.now()}`,
      sender_type: 'HUMAN',
      sender_id: currentUser?.id || 'EMP-OWNER',
      sender_name: fallbackSenderName,
      sender_role: fallbackSenderRole,
      message: messageText,
      room_type: isWarRoom ? 'WAR_ROOM' : 'DIRECT',
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const activeToken = authToken || localStorage.getItem('company_os_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
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
    const activeToken = authToken || localStorage.getItem('company_os_token');
    if (!activeToken) {
      alert('Silakan login terlebih dahulu untuk melakukan market scan ide bisnis.');
      setIsAuthModalOpen(true);
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/ideas/scan`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const newIdea = await res.json();
        setIdeas(prev => [newIdea, ...prev]);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Gagal melakukan scan ide baru.');
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBuildIdea = async (idea: Idea) => {
    const activeToken = authToken || localStorage.getItem('company_os_token');
    if (!activeToken) {
      alert('Silakan login terlebih dahulu untuk membuat proyek dari ide.');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          title: idea.title,
          description: idea.problem_statement,
          goal: idea.proposed_solution
        })
      });
      if (res.ok) {
        await fetchData(false, activeToken);
        setActiveTab('pipeline');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Gagal membuat proyek dari ide.');
      }
    } catch (e) {
      console.error('Build idea error:', e);
    }
  };

  useEffect(() => {
    fetchData(false);
    fetchChat(selectedTargetId);
    
    // Background polling: silent refresh without unmounting UI or triggering full loading
    const syncInterval = setInterval(() => {
      fetchData(true);
    }, 3000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatSending, isChatOpen]);

  const currentChatAgent = agents.find(a => a.id === selectedTargetId);

  // Strict Auth Guard: If not logged in, render full-screen Auth Screen
  if (!authToken || !currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #0f172a, #020617)',
        padding: '1.5rem',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '1.25rem',
          padding: '2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)'
        }}>
          {/* Brand Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.75rem',
              fontWeight: 900,
              margin: '0 auto 1rem auto',
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5)'
            }}>
              V
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>
              VirtuLabs Company OS
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Autonomous Multi-Agent Enterprise Studio
            </p>
          </div>

          {authError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {!isAuthModeLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '0.6rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Email Akun
              </label>
              <input
                type="email"
                required
                placeholder="nama@perusahaan.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '0.6rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#090d16', border: '1px solid #334155', borderRadius: '0.6rem', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'linear-gradient(to right, #0284c7, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.6rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.15s',
                opacity: authSubmitting ? 0.7 : 1
              }}
            >
              {authSubmitting ? 'Memverifikasi Kredensial...' : (isAuthModeLogin ? 'Masuk ke Workspace' : 'Daftar Akun Klien')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
            {isAuthModeLogin ? (
              <span>Belum memiliki akun klien? <button type="button" onClick={() => { setIsAuthModeLogin(false); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Daftar Klien Baru</button></span>
            ) : (
              <span>Sudah memiliki akun? <button type="button" onClick={() => { setIsAuthModeLogin(true); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Login di sini</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }

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

            {/* 6. Owner User Directory (Role === 'OWNER' Only) */}
            {currentUser?.role === 'OWNER' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                style={{ borderColor: activeTab === 'users' ? '#38bdf8' : 'transparent' }}
              >
                <Users size={18} color="#38bdf8" />
                {!isSidebarCollapsed && <span className="nav-text" style={{ color: '#38bdf8', fontWeight: 700 }}>👥 User Directory</span>}
              </button>
            )}
          </div>

          <div className="sidebar-footer" style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1rem 0.5rem' }}>
            {!isSidebarCollapsed && <>Founder HQ &bull; VirtuLabs AI</>}
            {isSidebarCollapsed && <>v2.1</>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content" style={isTheaterMode ? { padding: 0, margin: 0, maxWidth: '100vw', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999 } : {}}>
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
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              {/* Sound Notification Toggle */}
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Matikan Suara Notifikasi' : 'Nyalakan Suara Notifikasi'}
                style={{
                  backgroundColor: soundEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                  border: `1px solid ${soundEnabled ? 'rgba(56, 189, 248, 0.3)' : '#334155'}`,
                  color: soundEnabled ? '#38bdf8' : '#64748b',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  transition: 'all 0.15s'
                }}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
              </button>

              {/* User Role Badge */}
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', fontSize: '0.8rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: currentUser.role === 'OWNER' ? '#38bdf8' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}>
                    {currentUser.role === 'OWNER' ? '👑 Root Owner: ' : '👤 Client: '}
                    <strong style={{ color: '#f8fafc' }}>{currentUser.name}</strong>
                  </span>
                  <button 
                    onClick={handleLogout}
                    title="Logout"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '0.4rem' }}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Lock size={14} />
                  Login / Register
                </button>
              )}

              <button 
                onClick={() => setIsTheaterMode(true)} 
                className="btn-refresh" 
                style={{ borderColor: '#0284c7', color: '#38bdf8' }}
              >
                Full Screen
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
              <div style={{
                position: 'relative',
                width: '100%',
                height: isTheaterMode ? '100vh' : 'calc(100vh - 160px)',
                minHeight: isTheaterMode ? '100vh' : '650px',
                display: 'flex',
                overflow: 'hidden',
                borderRadius: isTheaterMode ? 0 : '1rem',
                border: isTheaterMode ? 'none' : '1px solid #334155'
              }}>
                {/* 3D Office Scene - True Full Size */}
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <VirtualOffice 
                    agents={agents} 
                    viewMode={viewMode} 
                    onToggleViewMode={setViewMode} 
                    onStartChatWithAgent={handleOpenChatWithAgent}
                  />

                  {/* Top Bar Floating Controls during Full Screen Mode */}
                  {isTheaterMode && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      zIndex: 50,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(51, 65, 85, 0.8)'
                    }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#38bdf8' }}>🎮 VirtuLabs 3D HQ</span>
                      <button
                        onClick={() => setIsTheaterMode(false)}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ✕ Exit Full Screen
                      </button>
                    </div>
                  )}

                  {/* Toggle Button for Activity Stream Slider */}
                  <button
                    onClick={toggleActivityDrawer}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: isActivityDrawerOpen ? '360px' : '1rem',
                      zIndex: 50,
                      background: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      padding: '0.5rem 0.875rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.8125rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                      transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Activity size={16} />
                    {isActivityDrawerOpen ? '✕ Tutup Activity Feed' : '⮜ Buka Activity Feed'}
                  </button>
                </div>

                {/* Sliding Overlay Activity Feed (Slide-in dari Kanan) */}
                {isActivityDrawerOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '350px',
                    maxWidth: '85vw',
                    height: '100%',
                    zIndex: 40,
                    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)'
                  }}>
                    <LiveFeed authToken={authToken} inspectUserId={inspectUser?.id} />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROJECT PIPELINE HUB */}
            {activeTab === 'pipeline' && (
              <div className="flex flex-col gap-4">
                <ProjectPipeline 
                  projects={inspectUser ? projects.filter(p => String((p as any).user_id || '').trim().toLowerCase() === String(inspectUser.id || '').trim().toLowerCase()) : projects} 
                  onProjectCreated={() => fetchData(false)} 
                  apiBase={API_BASE}
                  authToken={authToken}
                  currentUser={currentUser}
                  inspectUser={inspectUser}
                  onClearInspectUser={() => setInspectUser(null)}
                />
              </div>
            )}

            {/* TAB 3: IDEA RADAR */}
            {activeTab === 'ideas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '56rem', margin: '0 auto', width: '100%' }}>
                {/* Header Banner */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '1rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24',
                      flexShrink: 0
                    }}>
                      <Lightbulb size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        Market Research & Idea Feed
                      </h2>
                      <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                        Pesan analisa & peluang SaaS divalidasi oleh Dr. Aris (Researcher)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleScanIdea}
                    disabled={isScanning}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      padding: '0.625rem 1.125rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      cursor: isScanning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: isScanning ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Sparkles size={16} className={isScanning ? 'spin' : ''} />
                    {isScanning ? 'Scanning...' : 'Scan New Opportunity'}
                  </button>
                </div>

                {/* Ideas Message Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {ideas.map((idea) => (
                    <div 
                      key={idea.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.875rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {/* Avatar initial badge */}
                      <div style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid #f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                        marginTop: '0.125rem'
                      }}>
                        A
                      </div>

                      {/* Message Body Content */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
                              Dr. Aris
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#1e293b',
                              color: '#94a3b8',
                              border: '1px solid #334155'
                            }}>
                              Market Intelligence
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#facc15',
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              border: '1px solid rgba(245, 158, 11, 0.4)'
                            }}>
                              ★ {idea.market_potential_score || 85}/100 Score
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                            Opportunity Spec
                          </span>
                        </div>

                        {/* Speech Bubble */}
                        <div style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '1rem',
                          borderTopLeftRadius: '0.125rem',
                          padding: '1rem 1.125rem',
                          marginBottom: '0.75rem'
                        }}>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ color: '#fbbf24' }}>💡</span> {idea.title}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {idea.problem_statement}
                          </p>
                        </div>

                        {/* Meta Tags & Action Button */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                            <div>Target: <span style={{ color: '#f8fafc', fontWeight: 600 }}>{idea.target_audience || 'B2B'}</span></div>
                            <div>Est. Rev: <span style={{ color: '#4ade80', fontWeight: 600 }}>${(idea.estimated_revenue_usd || 5000).toLocaleString()}</span></div>
                            <div>Build Time: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{idea.estimated_dev_time_mins || 5}m</span></div>
                          </div>

                          <button
                            onClick={() => handleBuildIdea(idea)}
                            style={{
                              backgroundColor: '#0284c7',
                              color: '#ffffff',
                              fontWeight: 700,
                              padding: '0.5rem 1rem',
                              borderRadius: '0.625rem',
                              fontSize: '0.8125rem',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              marginLeft: 'auto',
                              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                            }}
                          >
                            <Sparkles size={14} /> Approve & Build
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {ideas.length === 0 && (
                    <div style={{
                      padding: '2.5rem',
                      textAlign: 'center',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '1rem',
                      color: '#94a3b8',
                      fontSize: '0.875rem'
                    }}>
                      Belum ada ide yang terscan. Klik tombol 'Scan New Opportunity' di atas.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: LIVE ACTIVITY STREAM */}
            {activeTab === 'activity' && (
              <div style={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                <LiveFeed mode="fullscreen" authToken={authToken} inspectUserId={inspectUser?.id} />
              </div>
            )}

            {/* TAB 5: FINANCIAL ANALYTICS */}
            {activeTab === 'finance' && (
              <div className="flex flex-col gap-4">
                <FinancialChart agents={agents} />
              </div>
            )}

            {/* TAB 6: OWNER USER DIRECTORY */}
            {activeTab === 'users' && currentUser?.role === 'OWNER' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <UserDirectory 
                  apiBase={API_BASE} 
                  authToken={authToken || ''} 
                  onInspectUserProjects={handleInspectUserProjects}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MULTI-USER AUTH MODAL (LOGIN & REGISTER)                                  */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    {isAuthModeLogin ? 'Login ke VirtuLabs' : 'Daftar Akun Klien Baru'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Virtual Company OS v2.2</span>
                </div>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem' }}>&times;</button>
            </div>

            {authError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!isAuthModeLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@perusahaan.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(to right, #0284c7, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  opacity: authSubmitting ? 0.7 : 1
                }}
              >
                {authSubmitting ? 'Memproses...' : (isAuthModeLogin ? 'Masuk Sekarang' : 'Daftar & Masuk')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              {isAuthModeLogin ? (
                <span>Belum punya akun? <button type="button" onClick={() => { setIsAuthModeLogin(false); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Daftar Klien Baru</button></span>
              ) : (
                <span>Sudah punya akun? <button type="button" onClick={() => { setIsAuthModeLogin(true); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Login di sini</button></span>
              )}
            </div>
          </div>
        </div>
      )}

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
                const isHuman = m.sender_type === 'HUMAN' || m.sender_id === 'EMP-OWNER' || m.sender_id === 'OWNER' || (currentUser && m.sender_id === currentUser.id);
                const isOwnerRole = (m.sender_role === 'Owner' || m.sender_role === 'OWNER') || (!m.sender_role && currentUser?.role === 'OWNER');
                const defaultHumanName = isOwnerRole ? 'Nano (Owner)' : (currentUser?.name || 'Client');
                const displayName = m.sender_name || (isHuman ? defaultHumanName : 'Agent');

                return (
                  <div key={m.id || idx} style={{ display: 'flex', gap: '0.625rem', justifyContent: isHuman ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isHuman ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem', padding: '0 0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isHuman ? '#67e8f9' : '#cbd5e1' }}>
                          {displayName}
                        </span>
                        {!isHuman && m.sender_role && (
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', textTransform: 'uppercase', background: '#1e293b', color: '#22d3ee', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', border: '1px solid #334155' }}>
                            {m.sender_role}
                          </span>
                        )}
                      </div>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '1.125rem',
                        borderTopRightRadius: isHuman ? '0.25rem' : '1.125rem',
                        borderTopLeftRadius: !isHuman ? '0.25rem' : '1.125rem',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        background: isHuman ? 'linear-gradient(to right, #0891b2, #4f46e5)' : '#1e293b',
                        color: isHuman ? '#ffffff' : '#f1f5f9',
                        border: isHuman ? 'none' : '1px solid #334155',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                        <div style={{ fontSize: '0.7rem', marginTop: '0.375rem', fontFamily: 'monospace', textAlign: 'right', color: isHuman ? '#a5f3fc' : '#94a3b8' }}>
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

      {/* ========================================================================= */}
      {/* AUTONOMOUS STAGE SMART TOAST NOTIFICATION                                 */}
      {/* ========================================================================= */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999999,
          backgroundColor: '#0f172a',
          border: `1px solid ${toastNotification.type === 'success' ? '#34d399' : '#38bdf8'}`,
          borderRadius: '0.85rem',
          padding: '0.85rem 1.15rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          maxWidth: '380px',
          animation: 'slideIn 0.3s ease-out',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: toastNotification.type === 'success' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            color: toastNotification.type === 'success' ? '#34d399' : '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bell size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
              {toastNotification.title}
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              {toastNotification.message}
            </p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
