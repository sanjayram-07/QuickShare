import { useState, useEffect } from 'react';
import { Copy, Trash2, Download, CheckCircle, Clock, AlertTriangle, File, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatTimeLeft = (expiresAt) => {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return { text: 'Expired', color: 'var(--danger)', urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return { text: `${h}h ${m}m left`, color: h < 2 ? 'var(--warning)' : 'var(--text-2)', urgent: h < 2 };
  return { text: `${m}m left`, color: 'var(--warning)', urgent: true };
};

const getMimeIcon = (mime = '') => {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('zip') || mime.includes('compressed')) return '📦';
  if (mime.includes('text')) return '📝';
  return '📁';
};

function FileRow({ file, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(file.expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(file.expiresAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [file.expiresAt]);

  const copyLink = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = file.downloadUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.originalName}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/files/${file.id}`);
      onDelete(file.id);
    } catch {
      setDeleting(false);
    }
  };

  const expired = timeLeft.urgent && timeLeft.text === 'Expired';

  return (
    <div style={{ ...s.row, opacity: expired ? 0.6 : 1 }} title={file.originalName}>
      <span style={s.rowIcon}>{getMimeIcon(file.mimeType)}</span>
      <div style={s.rowFileName}>
        <span style={s.fileName} title={file.originalName}>{file.originalName}</span>
      </div>
      <span style={s.rowSize}>{formatBytes(file.size)}</span>
      <div style={{ ...s.rowExpiry, color: timeLeft.color }}>
        {timeLeft.urgent ? <AlertTriangle size={12} /> : <Clock size={12} />}
        <span>{timeLeft.text}</span>
      </div>
      <div style={s.rowActions}>
        <button onClick={copyLink} style={{ ...s.rowBtn, ...s.btnAccent }} disabled={expired} title="Copy link">
          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <a href={file.downloadUrl} target="_blank" rel="noreferrer" style={{ ...s.rowBtn, ...s.btnGhost, pointerEvents: expired ? 'none' : 'auto', opacity: expired ? 0.4 : 1 }} title="Download">
          <Download size={14} />
        </a>
        <button onClick={handleDelete} disabled={deleting} style={{ ...s.rowBtn, ...s.btnDanger }} title="Delete">
          {deleting ? <span style={s.spinner} /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function FileList({ refreshTrigger }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/files?page=${page}&limit=10`);
      setFiles(data.files);
      setTotal(data.total);
      setError('');
    } catch {
      setError('Failed to load files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [page, refreshTrigger]);

  const handleDelete = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  if (loading) return (
    <div style={s.center}>
      <span style={{ ...s.spinner, borderTopColor: 'var(--accent)' }} />
      <span style={s.loadingText}>Loading your files...</span>
    </div>
  );

  if (error) return (
    <div style={s.center}>
      <AlertTriangle size={24} color="var(--danger)" />
      <span style={s.errorText}>{error}</span>
      <button onClick={fetchFiles} style={s.retryBtn}><RefreshCw size={14} />Retry</button>
    </div>
  );

  if (!files.length) return (
    <div style={s.empty}>
      <File size={40} color="var(--text-3)" strokeWidth={1.5} />
      <p style={s.emptyTitle}>No files yet</p>
      <p style={s.emptyText}>Upload your first file to get a shareable link</p>
    </div>
  );

  return (
    <div style={s.listWrap}>
      <div style={s.listHeader}>
        <h2 style={s.heading}>My Files</h2>
        <span style={s.count}>{total} file{total !== 1 ? 's' : ''}</span>
      </div>
      <div style={s.list}>
        {files.map((f) => (
          <FileRow key={f.id} file={f} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

const s = {
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px', color: 'var(--text-2)' },
  loadingText: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-3)' },
  errorText: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--danger)' },
  retryBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', cursor: 'pointer' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '64px 24px', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-2)', fontSize: '1rem' },
  emptyText: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center' },
  listWrap: { width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' },
  listHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  heading: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' },
  count: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 12px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    padding: '12px 14px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    transition: 'border-color 0.18s',
  },
  rowIcon: { fontSize: '1.2rem', flexShrink: 0 },
  rowFileName: { flex: 1, minWidth: 0, overflow: 'hidden' },
  fileName: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowSize: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' },
  rowExpiry: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' },
  rowActions: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  rowBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 'var(--radius)', padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', textDecoration: 'none', minWidth: 32 },
  btnAccent: { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.25)' },
  btnGhost: { background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' },
  btnDanger: { background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(255,68,85,0.25)' },
  spinner: { width: 14, height: 14, border: '2px solid var(--surface-3)', borderTopColor: 'var(--text-2)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
};
