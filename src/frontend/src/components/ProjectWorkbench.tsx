import { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Code, 
  FileText, 
  Sparkles, 
  Send, 
  RefreshCw, 
  ExternalLink, 
  Folder, 
  FolderOpen, 
  FileCode, 
  Download, 
  ArrowLeft, 
  History, 
  Bot 
} from 'lucide-react';
import type { ProjectItem } from './ProjectTimeline';

interface ProjectWorkbenchProps {
  project: ProjectItem;
  projectDetail: any;
  apiBase: string;
  authToken?: string | null;
  onBack: () => void;
  onProjectUpdated?: () => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

interface RevisionItem {
  id: string;
  project_id: string;
  version_from: string;
  version_to: string;
  iteration_type: string;
  user_prompt: string;
  changes_summary: string;
  affected_files: any;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'PM';
  text: string;
  timestamp: string;
}

export default function ProjectWorkbench({
  project,
  projectDetail: _projectDetail,
  apiBase,
  authToken,
  onBack,
  onProjectUpdated
}: ProjectWorkbenchProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'docs' | 'revisions'>('preview');
  
  // Preview State
  const [previewKey, setPreviewKey] = useState<number>(Date.now());
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);

  // Source Code Viewer State
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('src/frontend/index.html');
  const [fileContent, setFileContent] = useState<string>('');
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/frontend': true,
    'src/backend': true,
    'docs': true
  });

  // Revisions State
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [_isRevisionsLoading, setIsRevisionsLoading] = useState<boolean>(false);

  // PM Contextual Chat & Iteration State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'PM',
      text: `Halo! Saya Sarah Jenkins, Senior Product Manager untuk ${project.name || project.title}. Aplikasi saat ini berjalan di versi ${project.version || 'v1.0'} pada Port ${project.port || 5001}. Ada fitur, styling, atau perubahan yang ingin kita terapkan bersama tim Dev (Devron & Anya)?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const [isIterating, setIsIterating] = useState<boolean>(false);
  const [iterationStage, setIterationStage] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activePort = project.port || 5001;
  const liveAppUrl = `http://${window.location.hostname || 'localhost'}:${activePort}`;

  // Fetch Project File Tree
  const fetchFileTree = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/projects/${project.id}/files`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFileTree(data.files || []);
        // Auto select first useful file
        if (!selectedFilePath && data.files?.length > 0) {
          setSelectedFilePath('src/frontend/index.html');
        }
      }
    } catch (e) {
      console.warn('Fetch files error:', e);
    }
  };

  // Fetch File Content
  const fetchFileContent = async (filePath: string) => {
    setIsContentLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/projects/${project.id}/files/content?filePath=${encodeURIComponent(filePath)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || '');
      }
    } catch (e) {
      console.warn('Fetch content error:', e);
      setFileContent('// Error loading file content');
    } finally {
      setIsContentLoading(false);
    }
  };

  // Fetch Revisions
  const fetchRevisions = async () => {
    setIsRevisionsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${apiBase}/projects/${project.id}/revisions`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRevisions(data || []);
      }
    } catch (e) {
      console.warn('Fetch revisions error:', e);
    } finally {
      setIsRevisionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFileTree();
    fetchRevisions();
  }, [project.id]);

  useEffect(() => {
    if (selectedFilePath) {
      fetchFileContent(selectedFilePath);
    }
  }, [selectedFilePath]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isIterating, isChatSending]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleRefreshPreview = () => {
    setIsPreviewLoading(true);
    setPreviewKey(Date.now());
  };

  // Handle Quick Chat with PM
  const handleSendPMChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending || isIterating) return;

    const userText = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${apiBase}/projects/${project.id}/chat-pm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        const pmMsg: ChatMessage = {
          id: `pm-${Date.now()}`,
          sender: 'PM',
          text: data.reply || 'Instruksi dicatat oleh tim.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, pmMsg]);
      }
    } catch (err) {
      console.error('PM chat error:', err);
    } finally {
      setIsChatSending(false);
    }
  };

  // Trigger Autonomous In-Place Code Patching & Auto-Reload
  const handleExecuteIteration = async (customPrompt?: string) => {
    const promptToUse = customPrompt || chatInput.trim();
    if (!promptToUse || isIterating) return;

    if (!customPrompt) setChatInput('');
    setIsIterating(true);
    setIterationStage('Sarah (PM) sedang menganalisis spesifikasi perubahan...');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: `🚀 [Instruksi Patching]: ${promptToUse}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      setTimeout(() => setIterationStage('Devron & Anya memodifikasi source code (server.js & index.html)...'), 1500);
      setTimeout(() => setIterationStage('Cipher (DevOps) melakukan zero-downtime PM2 reload...'), 4000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${apiBase}/projects/${project.id}/iterate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: promptToUse,
          iteration_type: 'FEATURE_UPDATE'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const revision = data.data;
        const pmMsg: ChatMessage = {
          id: `pm-${Date.now()}`,
          sender: 'PM',
          text: `✅ **Iterasi ${revision.versionTo} Sukses Diterapkan!**\n\n${revision.changesSummary}\n\n*File terpengaruh:* ${revision.affectedFiles.join(', ')}\n*Status:* Micro-app di-reload instan di Port ${project.port}. Live Preview otomatis dimuat ulang!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, pmMsg]);

        // Auto-reload files, revisions, and Live Preview!
        fetchFileTree();
        if (selectedFilePath) fetchFileContent(selectedFilePath);
        fetchRevisions();
        handleRefreshPreview();
        if (onProjectUpdated) onProjectUpdated();
      } else {
        const errData = await res.json();
        const errPmMsg: ChatMessage = {
          id: `pm-err-${Date.now()}`,
          sender: 'PM',
          text: `⚠️ Maaf, proses patching mengalami kendala: ${errData.error || 'Terjadi kesalahan internal'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, errPmMsg]);
      }
    } catch (err: any) {
      console.error('Iteration error:', err);
    } finally {
      setIsIterating(false);
      setIterationStage('');
    }
  };

  // Render Recursive File Tree
  const renderFileTreeNodes = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => {
      const isDir = node.type === 'directory';
      const isExpanded = expandedFolders[node.path];
      const isSelected = selectedFilePath === node.path;

      if (isDir) {
        return (
          <div key={node.path}>
            <div
              onClick={() => toggleFolder(node.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.5rem',
                paddingLeft: `${depth * 14 + 8}px`,
                cursor: 'pointer',
                borderRadius: '0.375rem',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isExpanded ? <FolderOpen size={14} color="#38bdf8" /> : <Folder size={14} color="#94a3b8" />}
              <span>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderFileTreeNodes(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => setSelectedFilePath(node.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
            padding: '0.35rem 0.5rem',
            paddingLeft: `${depth * 14 + 8}px`,
            cursor: 'pointer',
            borderRadius: '0.375rem',
            color: isSelected ? '#38bdf8' : '#94a3b8',
            backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
            fontSize: '0.8rem',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
            <FileCode size={13} color={isSelected ? '#38bdf8' : '#64748b'} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {node.name}
            </span>
          </div>
          {node.size !== undefined && (
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>
              {(node.size / 1024).toFixed(1)}k
            </span>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', height: 'calc(100vh - 110px)', minHeight: '600px' }}>
      
      {/* ========================================================================= */}
      {/* TOP HEADER: PROJECT IDENTITY & QUICK ACTIONS                              */}
      {/* ========================================================================= */}
      <div className="card" style={{ margin: 0, padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: '0.45rem 0.8rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ArrowLeft size={15} />
            Kembali
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {project.name || project.title}
              </h2>
              <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', letterSpacing: '0.5px' }}>
                {project.version || 'v1.0'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#34d399', fontWeight: 700, backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', animation: 'pulse 1.5s infinite' }} />
                Port {activePort} Active
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>
              AI Autonomous Project Studio &bull; {project.slug}
            </p>
          </div>
        </div>

        {/* Studio View Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#090d16', padding: '0.25rem', borderRadius: '0.625rem', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'preview' ? '#0284c7' : 'transparent',
              color: activeTab === 'preview' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={14} />
            Live App Preview
          </button>

          <button
            onClick={() => setActiveTab('code')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'code' ? '#0284c7' : 'transparent',
              color: activeTab === 'code' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <Code size={14} />
            Source Code Viewer
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'docs' ? '#0284c7' : 'transparent',
              color: activeTab === 'docs' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={14} />
            Dokumen Rilis
          </button>

          <button
            onClick={() => setActiveTab('revisions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'revisions' ? '#0284c7' : 'transparent',
              color: activeTab === 'revisions' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <History size={14} />
            Riwayat Revisi ({revisions.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORKBENCH BODY (SPLIT VIEW: 68% WORKBENCH CANVAS + 32% PM CHAT)       */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* LEFT COLUMN: INTERACTIVE WORKBENCH CANVAS */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* TAB 1: LIVE APP PREVIEW */}
          {activeTab === 'preview' && (
            <div className="card" style={{ margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
              {/* Browser Mockup Top Bar */}
              <div style={{ padding: '0.5rem 0.875rem', backgroundColor: '#090d16', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </div>

                <div style={{ flex: 1, maxWidth: '500px', display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  <span style={{ color: '#34d399', marginRight: '0.4rem' }}>🔒</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liveAppUrl}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={handleRefreshPreview}
                    title="Reload Live App"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)'
                    }}
                  >
                    <RefreshCw size={13} className={isPreviewLoading ? 'spin-slow' : ''} />
                    Refresh
                  </button>

                  <a
                    href={liveAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#1e293b'
                    }}
                  >
                    Tab Baru
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Embedded Live IFrame */}
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#0b0f19' }}>
                <iframe
                  key={previewKey}
                  src={liveAppUrl}
                  title="Project Live Preview"
                  onLoad={() => setIsPreviewLoading(false)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: SOURCE CODE VIEWER */}
          {activeTab === 'code' && (
            <div className="card" style={{ margin: 0, padding: 0, flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#020617', border: '1px solid #1e293b' }}>
              {/* File Tree Explorer (Left Panel) */}
              <div style={{ width: '240px', borderRight: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid #1e293b', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Project Files
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {fileTree.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center' }}>
                      Memuat direktori...
                    </div>
                  ) : (
                    renderFileTreeNodes(fileTree)
                  )}
                </div>
              </div>

              {/* Code Viewer Panel (Right Panel) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#050811' }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                    <FileCode size={14} />
                    {selectedFilePath}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Read-Only Mode</span>
                </div>

                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.825rem', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap', tabSize: 2 }}>
                  {isContentLoading ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                      Membaca source code...
                    </div>
                  ) : (
                    fileContent || '// File kosong'
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOKUMEN & EXPORT */}
          {activeTab === 'docs' && (
            <div className="card" style={{ margin: 0, padding: '1.25rem', flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
                  Dokumen Spesifikasi & Rilis
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                  Dokumen resmi yang diterbitkan oleh divisi CPO, Tech Architect, QA, dan CFO untuk proyek ini.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
                {/* 1. PRD Word */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>01_PRD.docx</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Product Requirement Document</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-file?filename=01_PRD.docx`, '_blank')}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Unduh
                  </button>
                </div>

                {/* 2. UI/UX Word */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>02_UI_UX.docx</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Design Spec & User Flow</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-file?filename=02_UI_UX.docx`, '_blank')}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Unduh
                  </button>
                </div>

                {/* 3. Architecture Word */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>03_Architecture.docx</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>System Blueprint & ADR</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-file?filename=03_Architecture.docx`, '_blank')}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Unduh
                  </button>
                </div>

                {/* 4. QA Report Word */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>04_QA_Test_Report.docx</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SQA Test Verification</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-file?filename=04_QA_Test_Report.docx`, '_blank')}
                    style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Unduh
                  </button>
                </div>

                {/* 5. SIT UAT Excel Matrix */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>SIT_UAT_Test_Matrix.xlsx</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Spreadsheet Uji Akseptasi</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-file?filename=SIT_UAT_Test_Matrix.xlsx`, '_blank')}
                    style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Excel (.xlsx)
                  </button>
                </div>

                {/* 6. Bundle ZIP */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #38bdf8', borderRadius: '0.625rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>Seluruh Proyek (.ZIP)</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Source Code + Dokumen</div>
                  </div>
                  <button
                    onClick={() => window.open(`${apiBase}/projects/${project.id}/download-zip`, '_blank')}
                    style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Download size={13} />
                    Unduh ZIP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVISION HISTORY */}
          {activeTab === 'revisions' && (
            <div className="card" style={{ margin: 0, padding: '1.25rem', flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#f8fafc' }}>
                  Riwayat Revisi & In-Place Patches
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                  Log rekam jejak evolusi kode dari v1.0 hingga iterasi terkini.
                </p>
              </div>

              {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <History size={36} style={{ margin: '0 auto 0.75rem', color: '#475569' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Belum ada riwayat iterasi.</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Gunakan panel PM Chat di samping untuk meminta perubahan fitur atau kodingan.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {revisions.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.625rem',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                            {rev.version_from} &rarr; {rev.version_to}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                            {rev.iteration_type}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontStyle: 'italic', backgroundColor: 'rgba(56, 189, 248, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', borderLeft: '3px solid #38bdf8' }}>
                        "{rev.user_prompt}"
                      </div>

                      <div style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                        {rev.changes_summary}
                      </div>

                      {rev.affected_files && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>File dimodifikasi:</span>
                          {(typeof rev.affected_files === 'string' ? JSON.parse(rev.affected_files) : rev.affected_files).map((f: string, fIdx: number) => (
                            <span key={fIdx} style={{ backgroundColor: '#0f172a', padding: '1px 6px', borderRadius: '4px', border: '1px solid #334155', fontFamily: 'monospace' }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CONTEXTUAL PM CHAT & QUICK PATCH ACTION PANEL               */}
        {/* ========================================================================= */}
        <div style={{ width: '360px', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem', overflow: 'hidden' }}>
          
          {/* PM Header */}
          <div style={{ padding: '0.875rem 1rem', background: 'linear-gradient(to right, #020617, #0f172a)', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=SarahPM"
                alt="Sarah PM"
                style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', border: '1px solid #38bdf8' }}
              />
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Sarah Jenkins
                <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  PM LEAD
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                Interactive Code Patching Partner
              </p>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div style={{ flex: 1, padding: '0.875rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(2, 6, 23, 0.5)' }}>
            {chatMessages.map(msg => {
              const isUser = msg.sender === 'USER';
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.875rem',
                    borderTopRightRadius: isUser ? '0.2rem' : '0.875rem',
                    borderTopLeftRadius: !isUser ? '0.2rem' : '0.875rem',
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    maxWidth: '90%',
                    wordBreak: 'break-word',
                    backgroundColor: isUser ? '#0284c7' : '#1e293b',
                    color: isUser ? '#ffffff' : '#f1f5f9',
                    border: isUser ? 'none' : '1px solid #334155'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    <div style={{ fontSize: '0.65rem', marginTop: '0.25rem', textAlign: 'right', color: isUser ? '#bae6fd' : '#64748b' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isChatSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#38bdf8', fontStyle: 'italic' }}>
                <Bot size={13} className="spin-slow" />
                Sarah PM sedang mengetik...
              </div>
            )}

            {isIterating && (
              <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.35)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                  <Sparkles size={14} className="spin-slow" />
                  Autonomous In-Place Patching Aktif...
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  {iterationStage}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            <button
              type="button"
              disabled={isIterating}
              onClick={() => handleExecuteIteration('Tambahkan tombol Export Laporan CSV/PDF dan perbagus visual kartu analytics.')}
              style={{ fontSize: '0.7rem', padding: '2px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Export CSV & Analytics
            </button>
            <button
              type="button"
              disabled={isIterating}
              onClick={() => handleExecuteIteration('Ubah tema styling warna menjadi Modern Dark Slate dengan aksen Emerald Neon.')}
              style={{ fontSize: '0.7rem', padding: '2px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Dark Emerald Theme
            </button>
            <button
              type="button"
              disabled={isIterating}
              onClick={() => handleExecuteIteration('Tambahkan fitur search bar interaktif dan filter status realtime pada tabel data.')}
              style={{ fontSize: '0.7rem', padding: '2px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              + Search & Filter Bar
            </button>
          </div>

          {/* Chat & Patch Input Form */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid #1e293b', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ketik instruksi fitur / revisi kodingan di sini..."
              rows={2}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8rem',
                color: '#ffffff',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleSendPMChat}
                disabled={!chatInput.trim() || isChatSending || isIterating}
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  padding: '0.45rem',
                  borderRadius: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  opacity: (!chatInput.trim() || isChatSending || isIterating) ? 0.5 : 1
                }}
              >
                <Send size={13} />
                Diskusi PM
              </button>

              <button
                type="button"
                onClick={() => handleExecuteIteration()}
                disabled={!chatInput.trim() || isIterating}
                style={{
                  flex: 1.3,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem',
                  borderRadius: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)',
                  opacity: (!chatInput.trim() || isIterating) ? 0.5 : 1
                }}
              >
                <Sparkles size={13} />
                Patch & Auto-Reload
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
