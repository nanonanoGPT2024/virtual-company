import { useState } from 'react';
import { GitCommit, CheckCircle2, Clock, PlayCircle, FileText, Calendar, User, Download } from 'lucide-react';

export interface ProjectTask {
  id: string;
  title: string;
  goal: string;
  project_id: string;
  department_id: string;
  assignee_id: string;
  reviewer_id: string;
  priority: string;
  deadline: string;
  budget_usd: string;
  status: string;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  type: string;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  description: string;
  budget_usd: string;
  status: string;
  port?: number;
  user_id?: string;
  pm2_name?: string;
  tunnel_url?: string;
  version?: string;
  last_iteration_summary?: string;
  created_at: string;
  tasks: ProjectTask[];
  documents: ProjectDocument[];
}

interface ProjectTimelineProps {
  projects: ProjectItem[];
  onSelectDocument?: (doc: ProjectDocument) => void;
}

export default function ProjectTimeline({ projects, onSelectDocument }: ProjectTimelineProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleDownloadMd = (title: string, content: string) => {
    const filename = `${title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper status color & icon
  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle2 size={20} color="#22c55e" />;
      case 'IN_PROGRESS':
        return <PlayCircle size={20} color="#38bdf8" />;
      case 'IN_REVIEW':
        return <Clock size={20} color="#eab308" />;
      default:
        return <GitCommit size={20} color="#94a3b8" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'badge-completed';
      case 'IN_PROGRESS':
        return 'badge-inprogress';
      case 'IN_REVIEW':
        return 'badge-inreview';
      default:
        return 'badge-backlog';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Project Selector Header */}
      <div className="card" style={{ margin: 0, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Pilih Project
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {projects.map((proj) => {
                const isActive = proj.id === (currentProject ? currentProject.id : '');
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setSelectedTask(null);
                      setSelectedDoc(null);
                    }}
                    style={{
                      backgroundColor: isActive ? '#0284c7' : '#1e293b',
                      color: '#ffffff',
                      border: isActive ? '1px solid #38bdf8' : '1px solid #334155',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{proj.name}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      {proj.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentProject && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Budget</div>
                <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '1rem' }}>
                  ${parseFloat(currentProject.budget_usd || '0').toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Tasks</div>
                <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1rem' }}>
                  {currentProject.tasks?.length || 0}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Output Dokumen</div>
                <div style={{ fontWeight: 700, color: '#a855f7', fontSize: '1rem' }}>
                  {currentProject.documents?.length || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!currentProject ? (
        <div className="empty-state">Belum ada project yang terdaftar.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedTask || selectedDoc ? '1.1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Interactive Timeline Graph Card */}
          <div className="card" style={{ margin: 0 }}>
            <div style={{ borderBottom: '1px solid #334155', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="#38bdf8" />
                Grafik Timeline Eksekusi
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                Klik pada salah satu tahapan timeline untuk melihat hasil kerja & dokumen yang dihasilkan agent.
              </p>
            </div>

            {/* Timeline Flow */}
            <div style={{ position: 'relative', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Vertical connection line */}
              <div
                style={{
                  position: 'absolute',
                  left: '26px',
                  top: '12px',
                  bottom: '24px',
                  width: '3px',
                  backgroundColor: '#334155',
                  zIndex: 1
                }}
              />

              {currentProject.tasks && currentProject.tasks.length > 0 ? (
                currentProject.tasks.map((task, index) => {
                  const isSelected = selectedTask?.id === task.id;
                  const matchingDocs = (currentProject.documents || []).filter(
                    (d) => d.content.toLowerCase().includes(task.title.toLowerCase()) || d.title.toLowerCase().includes(task.title.toLowerCase()) || d.project_id === task.project_id
                  );

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        if (matchingDocs.length > 0) {
                          setSelectedDoc(matchingDocs[0]);
                        } else {
                          setSelectedDoc(null);
                        }
                      }}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        gap: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Node Icon Circle */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#0f172a',
                          border: isSelected ? '2px solid #38bdf8' : '2px solid #334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none'
                        }}
                      >
                        {getStatusIcon(task.status)}
                      </div>

                      {/* Step Box */}
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: isSelected ? '#1e293b' : '#0f172a',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                          borderRadius: '0.6rem',
                          padding: '1rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#64748b';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.borderColor = '#334155';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                              Fase #{index + 1}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                              {task.title}
                            </span>
                          </div>
                          <span className={`badge ${getStatusBadgeClass(task.status)}`} style={{ fontSize: '0.7rem' }}>
                            {task.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.35rem 0 0.75rem 0', lineHeight: 1.4 }}>
                          {task.goal}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <User size={13} color="#38bdf8" />
                              {task.assignee_id || 'Unassigned'}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={13} />
                              {task.deadline ? new Date(task.deadline).toLocaleDateString('id-ID') : 'No deadline'}
                            </span>
                          </div>

                          {matchingDocs.length > 0 && (
                            <span
                              style={{
                                color: '#a855f7',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              <FileText size={13} />
                              {matchingDocs.length} Output Dokumen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Belum ada task pada project ini.</div>
              )}
            </div>
          </div>

          {/* Right Detail Panel: Task & Deliverable Document Output */}
          {(selectedTask || selectedDoc) && (
            <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: 'fit-content', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#38bdf8" />
                  Detail & Hasil Kerja
                </h3>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setSelectedDoc(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Task Overview */}
              {selectedTask && (
                <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {selectedTask.title}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(selectedTask.status)}`} style={{ fontSize: '0.7rem' }}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                    {selectedTask.goal}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div><strong>Assignee:</strong> {selectedTask.assignee_id || '-'}</div>
                    <div><strong>Reviewer:</strong> {selectedTask.reviewer_id || '-'}</div>
                    <div><strong>Priority:</strong> {selectedTask.priority}</div>
                    <div><strong>Budget:</strong> ${parseFloat(selectedTask.budget_usd || '0').toFixed(2)}</div>
                  </div>
                </div>
              )}

              {/* Document Tabs / List for this task/project */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Dokumen / Output Terkait:
                </div>
                {currentProject.documents && currentProject.documents.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {currentProject.documents.map((doc) => {
                      const isDocActive = selectedDoc?.id === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDoc(doc);
                            if (onSelectDocument) onSelectDocument(doc);
                          }}
                          style={{
                            backgroundColor: isDocActive ? '#0284c7' : '#0f172a',
                            border: isDocActive ? '1px solid #38bdf8' : '1px solid #334155',
                            color: '#f8fafc',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <FileText size={13} />
                          {doc.type}: {doc.title.slice(0, 24)}...
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Belum ada dokumen yang dihasilkan untuk project ini.
                  </div>
                )}
              </div>

              {/* Document Content Viewer with Download Button */}
              {selectedDoc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                        {selectedDoc.title} (v{selectedDoc.version}.0)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.5rem' }}>
                        {selectedDoc.updated_at ? new Date(selectedDoc.updated_at).toLocaleString('id-ID') : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadMd(selectedDoc.title, selectedDoc.content)}
                      style={{
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'background-color 0.2s'
                      }}
                      title="Download Dokumen sebagai Markdown (.md)"
                    >
                      <Download size={13} />
                      Download .md
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#090d16',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #1e293b',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.8rem',
                      lineHeight: '1.5',
                      color: '#cbd5e1',
                      maxHeight: '320px',
                      overflowY: 'auto'
                    }}
                  >
                    {selectedDoc.content || '(Konten dokumen kosong)'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
