import { useState, useEffect } from 'react';
import { Users, FolderKanban, ArrowRight, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  total_projects: number;
  total_spent_usd: string | number;
}

interface UserDirectoryProps {
  apiBase: string;
  authToken: string;
  onInspectUserProjects: (userId: string, userName: string) => void;
}

export default function UserDirectory({ apiBase, authToken, onInspectUserProjects }: UserDirectoryProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="card" style={{ margin: 0, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="#38bdf8" />
            Owner User Directory & RBAC Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
            Pantau akun klien terdaftar, total project yang diproduksi, serta inspeksi pipeline masing-masing user secara terisolasi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Cari user / email / role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.85rem',
              outline: 'none',
              width: '220px'
            }}
          />
          <button
            onClick={fetchUsers}
            style={{
              padding: '0.5rem 0.85rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ margin: 0, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total User Terdaftar</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.2rem 0 0 0' }}>{users.length}</h3>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={20} />
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Klien Aktif (Clients)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', margin: '0.2rem 0 0 0' }}>
              {users.filter(u => u.role === 'CLIENT').length}
            </h3>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="card" style={{ margin: 0, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Proyek User</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', margin: '0.2rem 0 0 0' }}>
              {users.reduce((acc, u) => acc + (u.total_projects || 0), 0)}
            </h3>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={20} />
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#090d16', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.85rem 1.25rem' }}>Nama User</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Email & Role</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Bergabung</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Total Proyek</th>
              <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const isOwner = u.role === 'OWNER';
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #1e293b', transition: 'background-color 0.15s' }}>
                  <td style={{ padding: '1rem 1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isOwner ? 'rgba(56, 189, 248, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: isOwner ? '#38bdf8' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#cbd5e1' }}>{u.email}</div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isOwner ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      color: isOwner ? '#38bdf8' : '#34d399',
                      border: `1px solid ${isOwner ? 'rgba(56, 189, 248, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                    }}>
                      {isOwner ? '👑 ROOT OWNER' : '👤 CLIENT'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{u.total_projects || 0} Project</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => onInspectUserProjects(u.id, u.name)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0284c7'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)'}
                    >
                      <span>🔍 Lihat Pipeline</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Tidak ada user yang sesuai pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
