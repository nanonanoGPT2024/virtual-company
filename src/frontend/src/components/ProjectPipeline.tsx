import { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  FileText, 
  Download, 
  ArrowLeft, 
  User, 
  Check, 
  ChevronRight,
  Plus,
  Rocket,
  Trash2,
  AlertTriangle,
  Globe,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCheck
} from 'lucide-react';
import type { ProjectItem, ProjectDocument } from './ProjectTimeline';
import ProjectWorkbench from './ProjectWorkbench';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'CLIENT';
}

interface ProjectPipelineProps {
  projects: ProjectItem[];
  onProjectCreated?: () => void;
  apiBase?: string;
  authToken?: string | null;
  currentUser?: CurrentUser | null;
  inspectUser?: { id: string; name: string } | null;
  onClearInspectUser?: () => void;
}

// 6 Standard Division Stages in company pipeline flow including DevOps & WSL Deployment
interface DivisionStage {
  id: string;
  name: string;
  code: string;
  iconName: string;
  color: string;
  roleHint: string;
  agentDefault: string;
  description: string;
  deliverableHint: string;
}

const PIPELINE_DIVISIONS: DivisionStage[] = [
  {
    id: 'div-exec',
    name: 'Executive & Strategy',
    code: 'Executive',
    iconName: 'Sparkles',
    color: '#eab308',
    roleHint: 'CEO / Business Direction',
    agentDefault: 'Sovereign (CEO)',
    description: 'Inisiasi ide bisnis, kelayakan pasar, dan alokasi modal awal.',
    deliverableHint: 'Dokumen Business Case & Alokasi Modal'
  },
  {
    id: 'div-prod',
    name: 'Product & Planning',
    code: 'Product',
    iconName: 'Layers',
    color: '#06b6d4',
    roleHint: 'CPO / UX & Product Scope',
    agentDefault: 'Elena (CPO)',
    description: 'Perumusan spesifikasi fitur (PRD), user stories, dan target deliverable.',
    deliverableHint: 'Dokumen PRD & User Flow Spec'
  },
  {
    id: 'div-eng',
    name: 'Engineering & Dev',
    code: 'Engineering',
    iconName: 'Building2',
    color: '#38bdf8',
    roleHint: 'Architect & Developers',
    agentDefault: 'Alex (Senior Architect)',
    description: 'Perancangan cetak biru sistem (ADR), setup database, dan coding core logic.',
    deliverableHint: 'Dokumen ADR & Source Code Modul'
  },
  {
    id: 'div-qa',
    name: 'QA & Verification',
    code: 'Quality Assurance',
    iconName: 'CheckCircle2',
    color: '#10b981',
    roleHint: 'QA Lead',
    agentDefault: 'David (QA Lead)',
    description: 'Testing otomatis, validasi keamanan, dan audit bug report.',
    deliverableHint: 'Laporan Test Suite & Bug Audit'
  },
  {
    id: 'div-devops',
    name: 'DevOps & WSL Deployment',
    code: 'DevOps',
    iconName: 'Server',
    color: '#f97316',
    roleHint: 'DevOps & Cloud Engineer',
    agentDefault: 'Frank (DevOps Engineer)',
    description: 'Penyusunan Docker container, alokasi port local, dan deploy runtime aplikasi di lingkungan WSL.',
    deliverableHint: 'Docker Config, Port Mapping & Live Status WSL'
  },
  {
    id: 'div-mkt',
    name: 'Marketing & Release',
    code: 'Marketing',
    iconName: 'Briefcase',
    color: '#a855f7',
    roleHint: 'Marketing / Growth Lead',
    agentDefault: 'Sophia (Marketing)',
    description: 'Strategi rilis ke pasar, materi promosi, dan distribusi produk.',
    deliverableHint: 'Marketing Copy, Campaign & Release Notes'
  }
];

export default function ProjectPipeline({ 
  projects, 
  onProjectCreated, 
  apiBase = 'http://localhost:4000/api',
  authToken,
  currentUser,
  inspectUser,
  onClearInspectUser 
}: ProjectPipelineProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<any | null>(null);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState<number>(4); // Default to DevOps or active
  const [isWorkbenchMode, setIsWorkbenchMode] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch full details (including live documents and tasks) when a project is selected or polled
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProjectDetail(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${apiBase}/projects/${selectedProjectId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setSelectedProjectDetail(data);
        }
      } catch (err) {
        console.warn('Error fetching project details:', err);
      }
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedProjectId, apiBase]);
  
  // New Project Form State (Enterprise Edition)
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [newProjBudget, setNewProjBudget] = useState<string>('15000');
  const [newProjTargetDir, setNewProjTargetDir] = useState<string>('');
  const [newProjTheme, setNewProjTheme] = useState<'cyber' | 'emerald' | 'indigo' | 'light'>('cyber');
  const [newProjIncludeAuth, setNewProjIncludeAuth] = useState<boolean>(true);
  const [newProjStorageType, setNewProjStorageType] = useState<'memory' | 'sqlite'>('memory');
  const [uploadedImages, setUploadedImages] = useState<Array<{ name: string; menuLabel: string; base64: string; mimeType: string; previewUrl: string }>>([]);
  const [attachedDocs, setAttachedDocs] = useState<Array<{ name: string; base64: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // AI Auto-Enrich Spec State
  const [isEnriching, setIsEnriching] = useState<boolean>(false);
  const [enrichedSpecData, setEnrichedSpecData] = useState<any | null>(null);

  // Public Tunnel State
  const [tunnelLoadingId, setTunnelLoadingId] = useState<string | null>(null);
  const [copiedTunnelId, setCopiedTunnelId] = useState<string | null>(null);

  const handleAutoEnrichSpec = async () => {
    if (!newProjName.trim() && !newProjDesc.trim()) {
      alert('Ketikkan nama atau deskripsi ide singkat terlebih dahulu untuk dianalisis oleh AI.');
      return;
    }
    setIsEnriching(true);
    try {
      const token = localStorage.getItem('company_os_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/projects/enrich-spec`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newProjName,
          description: newProjDesc
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setEnrichedSpecData(d);
        if (d.refinedTitle) setNewProjName(d.refinedTitle);
        if (d.refinedDescription) setNewProjDesc(d.refinedDescription);
        if (d.recommendedTheme) setNewProjTheme(d.recommendedTheme);
      }
    } catch (err) {
      console.error('Enrich spec error:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleToggleTunnel = async (project: ProjectItem) => {
    setTunnelLoadingId(project.id);
    const isRunning = Boolean(project.tunnel_url);
    const endpoint = isRunning ? `${apiBase}/projects/${project.id}/tunnel/stop` : `${apiBase}/projects/${project.id}/tunnel/start`;
    
    try {
      const token = localStorage.getItem('company_os_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) {
        if (onProjectCreated) onProjectCreated();
      } else {
        alert(data.error || 'Gagal mengatur tunnel publik');
      }
    } catch (e: any) {
      alert('Error tunnel: ' + e.message);
    } finally {
      setTunnelLoadingId(null);
    }
  };

  const handleCopyTunnelUrl = (url: string, projId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTunnelId(projId);
    setTimeout(() => setCopiedTunnelId(null), 2500);
  };

  // Preset Archetypes
  const PRESET_TEMPLATES = [
    {
      id: 'ecommerce',
      label: '🛒 E-Commerce & POS',
      name: 'OmniStore POS & E-Commerce Hub',
      desc: 'Sistem manajemen katalog produk, checkout kasir POS, stok inventaris otomatis, dan integrasi WhatsApp invoice.',
      theme: 'emerald' as const,
      auth: true,
      storage: 'sqlite' as const
    },
    {
      id: 'hr',
      label: '👥 HR & User Management',
      name: 'TalentPulse HRIS & Attendance Hub',
      desc: 'Portal manajemen karyawan, absensi GPS, persetujuan cuti berjenjang, dan perhitungan payroll slip gaji.',
      theme: 'indigo' as const,
      auth: true,
      storage: 'sqlite' as const
    },
    {
      id: 'saas',
      label: '📊 SaaS Analytics',
      name: 'MetricPulse Analytics Dashboard',
      desc: 'Platform pelacak KPI bisnis real-time, cohort retention, MRR chart, dan visualisasi aktivitas user.',
      theme: 'cyber' as const,
      auth: true,
      storage: 'memory' as const
    },
    {
      id: 'task',
      label: '📋 Task Tracker',
      name: 'FlowTask Agile Work Tracker',
      desc: 'Kanban board interaktif, delegasi tugas antar divisi, milestone deadline, dan reminder notifikasi.',
      theme: 'cyber' as const,
      auth: false,
      storage: 'memory' as const
    }
  ];

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setNewProjName(preset.name);
    setNewProjDesc(preset.desc);
    setNewProjTheme(preset.theme);
    setNewProjIncludeAuth(preset.auth);
    setNewProjStorageType(preset.storage);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachedDocs(prev => [
          ...prev,
          {
            name: file.name,
            base64
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveDoc = (index: number) => {
    setAttachedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedImages(prev => [
          ...prev,
          {
            name: file.name,
            menuLabel: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            base64,
            mimeType: file.type,
            previewUrl: base64
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageLabelChange = (index: number, newLabel: string) => {
    setUploadedImages(prev => prev.map((item, i) => i === index ? { ...item, menuLabel: newLabel } : item));
  };

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

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('company_os_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newProjName,
          description: newProjDesc,
          budget_usd: parseFloat(newProjBudget) || 15000.00,
          target_dir: newProjTargetDir.trim() || undefined,
          theme: newProjTheme,
          includeAuth: newProjIncludeAuth,
          storageType: newProjStorageType,
          attachedDocs: attachedDocs.map(d => ({ name: d.name, base64: d.base64 })),
          images: uploadedImages.map(img => ({
            name: img.name,
            menuLabel: img.menuLabel,
            base64: img.base64,
            mimeType: img.mimeType
          }))
        })
      });
      if (res.ok) {
        setNewProjName('');
        setNewProjDesc('');
        setNewProjTargetDir('');
        setUploadedImages([]);
        setAttachedDocs([]);
        setIsCreateModalOpen(false);
        if (onProjectCreated) onProjectCreated();
      }
    } catch (err) {
      console.error('Error creating new project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/projects/${projectToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (selectedProjectId === projectToDelete.id) {
          setSelectedProjectId(null);
        }
        setProjectToDelete(null);
        if (onProjectCreated) onProjectCreated();
      } else {
        alert(`Gagal menghapus project: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert(`Gagal menghapus project: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute status for each division stage for a given project
  const getProjectDivisionState = (project: any) => {
    const stage = project.current_stage || '';
    const status = project.status || '';
    const progress = typeof project.progress_percentage === 'number' ? project.progress_percentage : (status === 'DEPLOYED' || status === 'COMPLETED' ? 100 : 20);

    // If stage matches specific text from pipeline
    // 0: Executive & Strategy ('Discovery & Spec')
    // 1: Product & Planning ('Discovery & Product Requirements (PRD)')
    // 2: Engineering & Dev ('Architecture', 'Parallel Engineering', 'Building')
    // 3: QA & Verification ('Testing', 'QA Testing & Security Audit')
    // 4: DevOps & WSL Deployment ('DevOps Deploying to PM2')
    // 5: Marketing & Release / Completed ('Live & Ready for Owner', 'DEPLOYED', 'COMPLETED')

    let activeDivIdx = 0;
    if (stage.includes('PRD') || stage.includes('Product Requirements')) {
      activeDivIdx = 1;
    } else if (stage.includes('Architecture') || stage.includes('Parallel Engineering') || stage.includes('Building') || stage.includes('Scaffolding')) {
      activeDivIdx = 2;
    } else if (stage.includes('QA') || stage.includes('Testing') || stage.includes('Security Audit')) {
      activeDivIdx = 3;
    } else if (stage.includes('Deploy') || stage.includes('DevOps') || stage.includes('PM2')) {
      activeDivIdx = 4;
    } else if (stage.includes('Live') || status === 'DEPLOYED' || status === 'COMPLETED' || progress === 100) {
      activeDivIdx = 5;
    }

    const isClosed = status === 'COMPLETED' || status === 'DEPLOYED' || progress === 100;
    const progressPercent = progress;

    return {
      currentDivision: PIPELINE_DIVISIONS[activeDivIdx] || PIPELINE_DIVISIONS[0],
      activeDivIdx,
      isClosed,
      progressPercent
    };
  };

  const rawSelectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const selectedProject = selectedProjectDetail?.project 
    ? {
        ...rawSelectedProject,
        ...selectedProjectDetail.project,
        documents: selectedProjectDetail.documents || [],
        tasks: selectedProjectDetail.tasks || [],
        costs: selectedProjectDetail.costs || []
      }
    : rawSelectedProject;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ========================================================================= */}
      {/* VIEW 1: LIST PROJECT HUB (Halaman Depan Daftar Project)                   */}
      {/* ========================================================================= */}
      {!selectedProject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Inspect User Filter Banner */}
          {inspectUser && (
            <div style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🔍</span>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                    Filter Aktif: Menampilkan Proyek Milik <span style={{ color: '#38bdf8' }}>{inspectUser.name}</span> ({projects.length} Proyek)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Data terisolasi khusus akun user ID: <code>{inspectUser.id}</code>
                  </span>
                </div>
              </div>

              {onClearInspectUser && (
                <button
                  onClick={onClearInspectUser}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  ✕ Tampilkan Semua Proyek
                </button>
              )}
            </div>
          )}

          {/* Header Summary with Create Project Button */}
          <div className="card" style={{ margin: 0, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Layers size={24} color="#38bdf8" />
                  Pelacak Alur Project & Divisi (Project Pipeline)
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.35rem 0 0 0' }}>
                  Pantau posisi pengerjaan project di setiap divisi secara real-time dari Executive hingga DevOps Deployment di WSL.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
                >
                  <Plus size={18} />
                  Buat Project Baru
                </button>
              </div>
            </div>
          </div>

          {/* Project Cards Grid */}
          {projects.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                {inspectUser ? `Belum ada proyek yang dibuat oleh ${inspectUser.name}.` : 'Belum ada proyek yang terdaftar.'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                {inspectUser ? 'User ini belum menginisiasi project apapun. Klik tombol di bawah untuk membuat project baru.' : 'Mulai inisiasi project otonom pertama Anda sekarang.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Plus size={16} />
                Buat Project Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {projects.map((project) => {
                const { currentDivision, activeDivIdx, isClosed, progressPercent } = getProjectDivisionState(project);

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setSelectedDivisionIndex(activeDivIdx);
                      setIsWorkbenchMode(true);
                    }}
                    className="card"
                    style={{
                      margin: 0,
                      padding: '1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #334155',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Top Status Tags */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span 
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: isClosed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: isClosed ? '#22c55e' : '#38bdf8',
                            border: isClosed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {isClosed ? <Check size={12} /> : <PlayCircle size={12} />}
                          STATUS: {isClosed ? 'CLOSED (SELESAI)' : 'OPEN (BERJALAN)'}
                        </span>

                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          ID: {project.id.slice(0, 8)}
                        </span>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            title="Buka AI Workbench Studio"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectId(project.id);
                              setSelectedDivisionIndex(activeDivIdx);
                              setIsWorkbenchMode(true);
                            }}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid #38bdf8',
                              color: '#38bdf8',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#0284c7';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                              e.currentTarget.style.color = '#38bdf8';
                            }}
                          >
                            <Sparkles size={13} />
                            Studio
                          </button>

                          <button
                            title="Download Bundle (.ZIP)"
                            onClick={(e) => {
                              e.stopPropagation();
                              const apiTarget = apiBase || (localStorage.getItem("API_URL") ? localStorage.getItem("API_URL") : "http://" + window.location.hostname + ":4000/api");
                              window.open(`${apiTarget}/projects/${project.id}/download-zip`, '_blank');
                            }}
                            style={{
                              background: 'rgba(2, 132, 199, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#0284c7';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(2, 132, 199, 0.15)';
                              e.currentTarget.style.color = '#38bdf8';
                            }}
                          >
                            <Download size={13} />
                            ZIP
                          </button>

                          <button
                            title="Hapus Project"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                        >
                          <Trash2 size={13} />
                          Hapus
                        </button>
                      </div>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.75rem 0', lineHeight: 1.45 }}>
                        {project.description || 'Tidak ada deskripsi project.'}
                      </p>

                      {/* Instant Public Tunnel Badge / Action on Card */}
                      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {project.tunnel_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ color: '#34d399', fontWeight: 700 }}>TUNNEL LIVE:</span>
                            <a 
                              href={project.tunnel_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              onClick={e => e.stopPropagation()} 
                              style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              {project.tunnel_url.replace(/^https?:\/\//, '')}
                              <ExternalLink size={11} />
                            </a>
                            <button
                              title="Copy Public Link"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTunnelUrl(project.tunnel_url!, project.id);
                              }}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                            >
                              {copiedTunnelId === project.id ? <CheckCheck size={13} color="#34d399" /> : <Copy size={13} />}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={tunnelLoadingId === project.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTunnel(project);
                            }}
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#38bdf8',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)'}
                          >
                            <Globe size={13} />
                            {tunnelLoadingId === project.id ? 'Menghubungkan Tunnel...' : '⚡ Buka Tunnel Publik'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Division Status Badge & Progress */}
                    <div>
                      {/* Current Division Box */}
                      <div
                        style={{
                          backgroundColor: '#0f172a',
                          border: `1px solid ${currentDivision.color}44`,
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: currentDivision.color,
                              boxShadow: `0 0 8px ${currentDivision.color}`
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                              Posisi Divisi Sekarang:
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                              {currentDivision.name}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: currentDivision.color, fontWeight: 600 }}>
                          Tahap {activeDivIdx + 1}/6
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                          <span>Progress Keseluruhan</span>
                          <strong style={{ color: '#cbd5e1' }}>{progressPercent}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${progressPercent}%`, 
                              height: '100%', 
                              backgroundColor: isClosed ? '#22c55e' : '#0284c7', 
                              borderRadius: '3px',
                              transition: 'width 0.4s ease'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Footer Meta Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span>Budget: <strong style={{ color: '#22c55e' }}>${parseFloat(project.budget_usd || '0').toLocaleString()}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#38bdf8', fontWeight: 600 }}>
                          Buka Diagram Alur <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: FULL PROCESS PIPELINE DIAGRAM OR AI WORKBENCH STUDIO              */
        /* ========================================================================= */
        isWorkbenchMode ? (
          <ProjectWorkbench
            project={selectedProject}
            projectDetail={selectedProjectDetail}
            apiBase={apiBase}
            authToken={authToken}
            currentUser={currentUser}
            onBack={() => {
              setIsWorkbenchMode(false);
              setSelectedProjectId(null);
            }}
            onProjectUpdated={onProjectCreated}
          />
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Bar Navigation & Info */}
          <div className="card" style={{ margin: 0, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedProjectId(null)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #334155',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Project
                </button>

                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    {selectedProject.name}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {selectedProject.description}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsWorkbenchMode(!isWorkbenchMode)}
                  style={{
                    backgroundColor: isWorkbenchMode ? '#0284c7' : '#1e293b',
                    color: isWorkbenchMode ? '#ffffff' : '#38bdf8',
                    border: '1px solid #38bdf8',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s',
                    boxShadow: isWorkbenchMode ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none'
                  }}
                >
                  <Sparkles size={15} />
                  {isWorkbenchMode ? 'Tutup Studio' : '⚡ Buka AI Workbench Studio'}
                </button>

                {/* Instant Public Tunnel Toggle Button on Detail View */}
                {selectedProject.tunnel_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.35)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ color: '#34d399', fontWeight: 700 }}>TUNNEL:</span>
                    <a 
                      href={selectedProject.tunnel_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      {selectedProject.tunnel_url.replace(/^https?:\/\//, '')}
                      <ExternalLink size={12} />
                    </a>
                    <button
                      title="Copy Public Link"
                      onClick={() => handleCopyTunnelUrl(selectedProject.tunnel_url!, selectedProject.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px' }}
                    >
                      {copiedTunnelId === selectedProject.id ? <CheckCheck size={14} color="#34d399" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleToggleTunnel(selectedProject)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600, marginLeft: '6px' }}
                    >
                      (Stop)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={tunnelLoadingId === selectedProject.id}
                    onClick={() => handleToggleTunnel(selectedProject)}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 0.9rem',
                      borderRadius: '0.5rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                  >
                    <Globe size={15} />
                    {tunnelLoadingId === selectedProject.id ? 'Menghubungkan...' : '⚡ Buka Tunnel Publik'}
                  </button>
                )}

                <button
                  title="Download Seluruh Project (.ZIP)"
                  onClick={() => {
                    const apiTarget = apiBase || (localStorage.getItem("API_URL") ? localStorage.getItem("API_URL") : "http://" + window.location.hostname + ":4000/api");
                    window.open(`${apiTarget}/projects/${selectedProject.id}/download-zip`, '_blank');
                  }}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0369a1')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0284c7')}
                >
                  <Download size={15} />
                  Download Project (.ZIP)
                </button>

                <button
                  title="Hapus Project Ini"
                  onClick={() => setProjectToDelete(selectedProject)}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <Trash2 size={15} />
                  Hapus Project
                </button>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Status Pengerjaan</span>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>
                    {selectedProject.status}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Budget Alokasi</span>
                  <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.95rem' }}>
                    ${parseFloat(selectedProject.budget_usd || '0').toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Process Interactive Pipeline Diagram (6 Divisions) */}
          <div className="card" style={{ margin: 0, padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Diagram Alur Proses Antar-Divisi
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                Klik pada salah satu kotak divisi di bawah untuk melihat laporan, PIC agent, dan hasil kerja yang diterbitkan.
              </p>
            </div>

            {/* Visual Step Bar with 6 Stages */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
                gap: '1rem',
                position: 'relative'
              }}
            >
              {PIPELINE_DIVISIONS.map((division, idx) => {
                const isSelected = selectedDivisionIndex === idx;
                const { activeDivIdx } = getProjectDivisionState(selectedProject);
                
                const isCompleted = idx < activeDivIdx;
                const isCurrent = idx === activeDivIdx;
                const isPending = idx > activeDivIdx;

                return (
                  <div
                    key={division.id}
                    onClick={() => setSelectedDivisionIndex(idx)}
                    style={{
                      backgroundColor: isSelected ? '#1e293b' : '#0f172a',
                      border: isSelected 
                        ? `2px solid ${division.color}` 
                        : isCurrent 
                          ? '1px solid #38bdf8' 
                          : '1px solid #334155',
                      borderRadius: '0.75rem',
                      padding: '1.1rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 15px ${division.color}33` : 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#64748b';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = isCurrent ? '#38bdf8' : '#334155';
                    }}
                  >
                    {/* Top Step Number & Status Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span 
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.2)' : isCurrent ? 'rgba(56, 189, 248, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                          color: isCompleted ? '#22c55e' : isCurrent ? '#38bdf8' : '#64748b'
                        }}
                      >
                        DIVISI #{idx + 1}
                      </span>

                      {isCompleted && <CheckCircle2 size={16} color="#22c55e" />}
                      {isCurrent && <PlayCircle size={16} color="#38bdf8" className="spin-slow" />}
                      {isPending && <Clock size={16} color="#64748b" />}
                    </div>

                    {/* Division Name & PIC */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc', marginBottom: '0.2rem' }}>
                        {division.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {division.roleHint}
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #1e293b' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: isCompleted ? '#22c55e' : isCurrent ? '#38bdf8' : '#64748b'
                        }}
                      >
                        {isCompleted ? '✓ Selesai & Lulus' : isCurrent ? '⚡ Sedang Berjalan' : '○ Menunggu Giliran'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Division Detail & Deliverables Report Panel */}
          {(() => {
            const activeDiv = PIPELINE_DIVISIONS[selectedDivisionIndex];
            const { activeDivIdx } = getProjectDivisionState(selectedProject);
            const isCompleted = selectedDivisionIndex < activeDivIdx;
            const isCurrent = selectedDivisionIndex === activeDivIdx;

            // Filter relevant documents for this specific division (Matching all backend generated spec types)
            const allDocs = (selectedProject.documents || []) as ProjectDocument[];
            const matchingDocs = allDocs.filter((d: ProjectDocument) => {
              const docType = (d.type || '').toUpperCase();
              const docTitle = (d.title || '').toUpperCase();

              if (activeDiv.code === 'Executive') {
                return docType.includes('BIZ') || docType.includes('STRATEGY') || docType.includes('BUDGET') || docType.includes('SALES') || docTitle.includes('08_SALES');
              }
              if (activeDiv.code === 'Product') {
                return docType === 'PRD' || docType === 'BRD' || docType.includes('UX') || docTitle.includes('01_PRD') || docTitle.includes('02_UI_UX');
              }
              if (activeDiv.code === 'Engineering') {
                return docType.includes('ARCH') || docType.includes('API') || docType.includes('CODE') || docTitle.includes('03_ARCHITECTURE');
              }
              if (activeDiv.code === 'Quality Assurance') {
                return docType.includes('QA') || docType.includes('SEC') || docType.includes('AUDIT') || docType.includes('TEST') || docTitle.includes('04_QA') || docTitle.includes('05_SECURITY');
              }
              if (activeDiv.code === 'DevOps') {
                return docType.includes('DEV') || docType.includes('DOCKER') || docType.includes('DEPLOY') || docType.includes('ECOSYSTEM');
              }
              if (activeDiv.code === 'Marketing') {
                return docType.includes('MARKETING') || docType.includes('SALES') || docType.includes('LEGAL') || docType.includes('USER_MANUAL') || docTitle.includes('06_PRIVACY') || docTitle.includes('07_USER') || docTitle.includes('08_SALES');
              }
              return true;
            });

            return (
              <div 
                className="card" 
                style={{ 
                  margin: 0, 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  border: `1px solid ${activeDiv.color}44` 
                }}
              >
                {/* Division Title & PIC Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ backgroundColor: `${activeDiv.color}22`, color: activeDiv.color, padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        Laporan Divisi #{selectedDivisionIndex + 1}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {isCompleted ? 'Status: Selesai' : isCurrent ? 'Status: Aktif' : 'Status: Antre'}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      {activeDiv.name}
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                      {activeDiv.description}
                    </p>
                  </div>

                  {/* PIC Agent Badge */}
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '0.6rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <User size={18} color={activeDiv.color} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        Penanggung Jawab (PIC)
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {activeDiv.agentDefault}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specific for DevOps: Show WSL Deployment Information Box */}
                {activeDiv.code === 'DevOps' && (
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #f9731644', borderRadius: '0.5rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Rocket size={18} color="#f97316" />
                        <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>WSL Deployment Runtime Controller</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        ● RUNNING IN WSL
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div><strong>Host Target:</strong> WSL2 (Linux 6.6)</div>
                      <div><strong>Allocated Port:</strong> <code>{selectedProject.port || 5001}</code></div>
                      <div><strong>Process Manager:</strong> PM2 ({selectedProject.pm2_name || `proj-${selectedProject.slug}`})</div>
                      <div><strong>Live Application URL:</strong> <a href={selectedProject.live_url || `http://localhost:${selectedProject.port || 5001}`} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedProject.live_url || `http://localhost:${selectedProject.port || 5001}`}</a></div>
                    </div>
                  </div>
                )}

                {/* Division Deliverables & Documents */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} color="#38bdf8" />
                    Dokumen & Hasil Kerja Divisi ({matchingDocs.length} Dokumen)
                  </h4>

                  {matchingDocs.length === 0 ? (
                    <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '0.5rem', border: '1px dashed #334155', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                      {isCompleted 
                        ? 'Divisi ini telah menyelesaikan tugas tahapannya.' 
                        : isCurrent 
                          ? 'Agent di divisi ini sedang memproses tugas dan menyusun konfigurasi...' 
                          : 'Dokumen dan hasil kerja akan dirilis saat tahap divisi ini mulai dieksekusi.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {matchingDocs.map((doc: ProjectDocument) => (
                        <div
                          key={doc.id}
                          style={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0284c7', color: '#fff' }}>
                                {doc.type}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
                                {doc.title}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                (Versi {doc.version}.0)
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleDownloadMd(doc.title, doc.content)}
                                style={{
                                  backgroundColor: '#1e293b',
                                  color: '#38bdf8',
                                  border: '1px solid #334155',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Download size={13} />
                                .md
                              </button>

                              <button
                                onClick={() => {
                                  const docxName = ((doc as any).file_path || doc.title).replace(/\.md$/i, '.docx').replace(/^docs[\\/]/, '');
                                  window.open(`${apiBase || (localStorage.getItem("API_URL") ? localStorage.getItem("API_URL") : "http://" + window.location.hostname + ":4000/api")}/projects/${selectedProject.id}/download-file?filename=${encodeURIComponent(docxName)}`, '_blank');
                                }}
                                style={{
                                  backgroundColor: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Download size={13} />
                                Word (.docx)
                              </button>

                              {/* Show Excel export button on QA and Financial / Commercial documents */}
                              {(doc.title.includes('QA') || doc.title.includes('Security')) && (
                                <button
                                  onClick={() => {
                                    window.open(`${apiBase || (localStorage.getItem("API_URL") ? localStorage.getItem("API_URL") : "http://" + window.location.hostname + ":4000/api")}/projects/${selectedProject.id}/download-file?filename=SIT_UAT_Test_Matrix.xlsx`, '_blank');
                                  }}
                                  style={{
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <Download size={13} />
                                  Excel (.xlsx)
                                </button>
                              )}

                              {(doc.title.includes('Sales') || doc.title.includes('Privacy') || doc.title.includes('PRD')) && (
                                <button
                                  onClick={() => {
                                    window.open(`${apiBase || (localStorage.getItem("API_URL") ? localStorage.getItem("API_URL") : "http://" + window.location.hostname + ":4000/api")}/projects/${selectedProject.id}/download-file?filename=Financial_Model_Budget.xlsx`, '_blank');
                                  }}
                                  style={{
                                    backgroundColor: '#0d9488',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <Download size={13} />
                                  Budget (.xlsx)
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Document Content View */}
                          <div
                            style={{
                              backgroundColor: '#090d16',
                              padding: '1rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #1e293b',
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '0.8rem',
                              lineHeight: '1.55',
                              color: '#cbd5e1',
                              maxHeight: '380px',
                              overflowY: 'auto'
                            }}
                          >
                            {doc.content || '(Konten dokumen kosong)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS PROJECT */}
      {projectToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '0.75rem',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Konfirmasi Hapus Project
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Apakah Anda yakin ingin menghapus project <strong style={{ color: '#f8fafc' }}>"{projectToDelete.name}"</strong>?
            </p>

            <div style={{ backgroundColor: '#1e293b', borderLeft: '4px solid #ef4444', padding: '0.75rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              <strong style={{ color: '#fca5a5' }}>Peringatan:</strong> Tindakan ini akan menghapus:
              <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
                <li>Layanan process PM2 (jika berjalan)</li>
                <li>Folder project di filesystem (<code>projects/{projectToDelete.slug || projectToDelete.id}</code>)</li>
                <li>Semua dokumen PRD, ADR, log token, chat, dan task di database</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProjectToDelete(null)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProject}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                <Trash2 size={16} />
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM BUAT PROJECT BARU                                             */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
        >
          <div 
            className="card" 
            style={{ 
              width: '100%', 
              maxWidth: '680px', 
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 0, 
              padding: '1.75rem', 
              backgroundColor: '#0f172a', 
              border: '1px solid #38bdf8', 
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Plus size={22} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Buat Project Baru (Enterprise Mode)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            {/* 1. Quick Presets Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                Template Cepat (Preset Archetype):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {PRESET_TEMPLATES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      padding: '0.45rem 0.6rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #334155',
                      backgroundColor: '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Nama Project <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AI Analytics Dashboard SaaS"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Tujuan & Deskripsi Project
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isEnriching}
                      onClick={handleAutoEnrichSpec}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: isEnriching ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)'}
                    >
                      <Sparkles size={12} className={isEnriching ? 'spin' : ''} />
                      {isEnriching ? 'Menganalisis...' : '✨ Auto-Enrich AI Spec'}
                    </button>

                    <a
                      href={`${apiBase}/projects/template/project-spec.docx`}
                      download="Template_Spesifikasi_Proyek.docx"
                      style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 600
                      }}
                    >
                      <Download size={12} />
                      Form (.docx)
                    </a>
                  </div>
                </div>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ide/fitur aplikasi atau ketik singkat lalu klik '✨ Auto-Enrich AI Spec'..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />

                {/* Enriched Spec Interactive Preview */}
                {enrichedSpecData && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#090d16', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <Sparkles size={13} />
                      <span>Hasil Analisis Arsitektur AI:</span>
                    </div>
                    {enrichedSpecData.keyFeatures && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Fitur Utama:</span>
                        <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0, color: '#cbd5e1' }}>
                          {enrichedSpecData.keyFeatures.slice(0, 3).map((f: string, i: number) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {enrichedSpecData.suggestedModules && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {enrichedSpecData.suggestedModules.map((m: string, i: number) => (
                          <span key={i} style={{ padding: '1px 5px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '3px', color: '#34d399', fontSize: '0.7rem' }}>
                            ✓ {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Color Theme Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Pilihan Tema Warna UI
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'cyber', label: 'Cyber Slate', dot: '#38bdf8' },
                    { id: 'emerald', label: 'Corp Emerald', dot: '#10b981' },
                    { id: 'indigo', label: 'Modern Indigo', dot: '#818cf8' },
                    { id: 'light', label: 'Clean Light', dot: '#f8fafc' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewProjTheme(t.id as any)}
                      style={{
                        padding: '0.5rem 0.4rem',
                        borderRadius: '0.5rem',
                        border: newProjTheme === t.id ? `2px solid ${t.dot}` : '1px solid #334155',
                        backgroundColor: newProjTheme === t.id ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.dot }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tech Stack & Auth Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#090d16', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newProjIncludeAuth}
                    onChange={(e) => setNewProjIncludeAuth(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#0284c7' }}
                  />
                  <span>🔐 Sertakan JWT Auth (Login/Register)</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Storage:</span>
                  <select
                    value={newProjStorageType}
                    onChange={(e) => setNewProjStorageType(e.target.value as any)}
                    style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', outline: 'none' }}
                  >
                    <option value="memory">In-Memory Store</option>
                    <option value="sqlite">SQLite Database</option>
                  </select>
                </div>
              </div>

              {/* 4. Lampirkan Dokumen Referensi (.docx / .pdf / .txt) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Lampirkan Dokumen Referensi / Form Kebutuhan (.docx, .pdf, .txt)
                  </label>
                  <label 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: '#38bdf8', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    + Pilih File Dokumen
                    <input 
                      type="file" 
                      multiple 
                      accept=".docx,.pdf,.txt,.md" 
                      onChange={handleDocFileChange} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {attachedDocs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem', backgroundColor: '#090d16', borderRadius: '0.375rem', border: '1px solid #1e293b' }}>
                    {attachedDocs.map((doc, idx) => (
                      <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        📄 {doc.name}
                        <button type="button" onClick={() => handleRemoveDoc(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Target Folder / Path (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="/mnt/d/explore/result_projek (Kosongkan untuk default)"
                  value={newProjTargetDir}
                  onChange={(e) => setNewProjTargetDir(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Upload Multi-Gambar per Menu / Modul */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Upload Gambar Aset / Modul (Opsional)
                  </label>
                  <label 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: '#38bdf8', 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  >
                    + Pilih File Gambar
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageFileChange} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#090d16', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                        <div style={{ width: '100%', height: '65px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={img.previewUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <input
                          type="text"
                          value={img.menuLabel}
                          onChange={(e) => handleImageLabelChange(idx, e.target.value)}
                          placeholder="Label Menu..."
                          style={{ width: '100%', fontSize: '0.7rem', padding: '2px 4px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '3px', color: '#fff', outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Alokasi Anggaran (USD)
                </label>
                <input
                  type="number"
                  placeholder="15000"
                  value={newProjBudget}
                  onChange={(e) => setNewProjBudget(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                💡 <strong>Otomatisasi:</strong> Project baru akan otomatis membentuk 6 rangkaian divisi: <em>Executive &rarr; Product &rarr; Engineering &rarr; QA &rarr; DevOps Deployment (WSL) &rarr; Marketing</em>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newProjName.trim()}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Membuat Project...' : 'Mulai Eksekusi Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
