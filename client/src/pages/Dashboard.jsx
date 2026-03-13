import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import FileUploader from '../components/FileUploader';
import FileList from '../components/FileList';
import StatsBar from '../components/StatsBar';
import { Zap, LogOut, User, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refreshUser();
  }, [refreshUser]);

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand}>
            <div style={s.brandLogo}>
              <Zap size={18} color="#00e5ff" strokeWidth={2.5} />
            </div>
            <span style={s.brandName}>QuickShare</span>
            <span style={s.brandTag}>
              <Shield size={10} />
              Secure
            </span>
          </div>

          <div style={s.navRight}>
            <div style={s.userChip}>
              <User size={13} />
              <span>{user?.username}</span>
            </div>
            <button onClick={logout} style={s.logoutBtn} title="Logout">
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={s.main}>
        <div style={s.container}>

          {/* Welcome header */}
          <div style={s.header} className="animate-fade">
            <div>
              <h1 style={s.title}>
                Hello, <span style={s.titleAccent}>{user?.username}</span>
              </h1>
              <p style={s.subtitle}>Upload files and share them with temporary secure links.</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ animationDelay: '0.05s' }} className="animate-fade">
            <StatsBar user={user} />
          </div>

          {/* Two-column layout */}
          <div style={s.columns}>
            {/* Upload panel */}
            <div style={{ ...s.panel, animationDelay: '0.1s' }} className="animate-fade">
              <FileUploader onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Files panel */}
            <div style={{ ...s.panel, ...s.filesPanel, animationDelay: '0.15s' }} className="animate-fade">
              <FileList refreshTrigger={refreshKey} />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.footerText}>
          QuickShare — Links expire in 24h &nbsp;·&nbsp; Max 50MB per file
        </span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },

  nav: { borderBottom: '1px solid var(--border)', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandLogo: { width: 32, height: 32, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' },
  brandTag: { display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 100, padding: '2px 8px', letterSpacing: '0.05em' },
  navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  userChip: { display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 100, padding: '5px 12px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '5px 14px', cursor: 'pointer', transition: 'all 0.15s' },

  main: { flex: 1, padding: '32px 24px' },
  container: { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' },

  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.03em', marginBottom: '6px' },
  titleAccent: { color: 'var(--accent)' },
  subtitle: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-3)' },

  columns: { display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px', alignItems: 'start' },
  panel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px' },
  filesPanel: { minHeight: 200, minWidth: 0, overflow: 'hidden' },

  footer: { borderTop: '1px solid var(--border)', padding: '16px 24px', textAlign: 'center' },
  footerText: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)' },
};
