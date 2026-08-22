import { useState } from 'react';
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  FileText, 
  Download, 
  ArrowLeft, 
  User, 
  Check, 
  Briefcase, 
  Sparkles,
  ChevronRight,
  Server,
  Plus,
  Rocket
} from 'lucide-react';
import type { ProjectItem, ProjectDocument } from './ProjectTimeline';

interface ProjectPipelineProps {
  projects: ProjectItem[];
  onProjectCreated?: () => void;
  apiBase?: string;
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

export default function ProjectPipeline({ projects, onProjectCreated, apiBase = 'http://localhost:4000/api' }: ProjectPipelineProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDivisionIndex, setSelectedDivisionIndex] = useState<number>(4); // Default to DevOps or active
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  
  // New Project Form State
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [newProjBudget, setNewProjBudget] = useState<string>('15000');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      const res = await fetch(`${apiBase}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjName,
          description: newProjDesc,
          budget_usd: parseFloat(newProjBudget) || 15000.00
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewProjName('');
        setNewProjDesc('');
        setIsCreateModalOpen(false);
        if (onProjectCreated) onProjectCreated();
      }
    } catch (err) {
      console.error('Error creating new project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute status for each division stage for a given project
  const getProjectDivisionState = (project: ProjectItem) => {
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = (project.tasks || []).filter(t => t.status === 'COMPLETED').length;
    
    // Determine active division based on task progress
    let activeDivIdx = 4; // DevOps default if in active phase
    if (totalTasks === 0) {
      activeDivIdx = 0; // Executive
    } else if (completedTasks === totalTasks && totalTasks > 0) {
      activeDivIdx = 5; // Marketing / Finished
    } else if (completedTasks >= 4) {
      activeDivIdx = 4; // DevOps Stage
    } else if (completedTasks >= 3) {
      activeDivIdx = 3; // QA Stage
    } else if (completedTasks >= 1) {
      activeDivIdx = 2; // Engineering Stage
    } else {
      activeDivIdx = 1; // Product Stage
    }

    const isClosed = project.status === 'COMPLETED' || (completedTasks === totalTasks && totalTasks > 0);

    return {
      currentDivision: PIPELINE_DIVISIONS[activeDivIdx] || PIPELINE_DIVISIONS[0],
      activeDivIdx,
      isClosed,
      progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 25
    };
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ========================================================================= */}
      {/* VIEW 1: LIST PROJECT HUB (Halaman Depan Daftar Project)                   */}
      {/* ========================================================================= */}
      {!selectedProject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {projects.map((project) => {
              const { currentDivision, activeDivIdx, isClosed, progressPercent } = getProjectDivisionState(project);

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setSelectedDivisionIndex(activeDivIdx);
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
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                      {project.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
                      {project.description || 'Tidak ada deskripsi project.'}
                    </p>
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
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: FULL PROCESS PIPELINE DIAGRAM & DIVISION REPORT VIEWER            */
        /* ========================================================================= */
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

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

            // Filter relevant documents or tasks for this division
            const matchingDocs = (selectedProject.documents || []).filter(d => {
              if (activeDiv.code === 'Engineering') return d.type === 'ADR' || d.type === 'HLD' || d.type === 'LLD';
              if (activeDiv.code === 'Product') return d.type === 'PRD' || d.type === 'BRD' || d.type === 'UX_SPEC';
              if (activeDiv.code === 'Marketing') return d.type === 'MARKETING' || d.type === 'BLOG';
              if (activeDiv.code === 'DevOps') return d.type === 'DEVOPS' || d.type === 'DOCKER';
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
                      <div><strong>Allocated Port:</strong> <code>5173</code> / <code>4000</code></div>
                      <div><strong>Container Engine:</strong> Docker (company-os)</div>
                      <div><strong>Local Access:</strong> <a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>http://localhost:5173</a></div>
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

                            <button
                              onClick={() => handleDownloadMd(doc.title, doc.content)}
                              style={{
                                backgroundColor: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.4rem 0.85rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <Download size={14} />
                              Download .md
                            </button>
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
      )}

      {/* ========================================================================= */}
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
              maxWidth: '540px', 
              margin: 0, 
              padding: '2rem', 
              backgroundColor: '#0f172a', 
              border: '1px solid #38bdf8', 
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Plus size={22} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Buat Project Baru
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Tujuan & Deskripsi Project
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kebutuhan aplikasi dan fitur yang ingin dibangun oleh agent..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
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
