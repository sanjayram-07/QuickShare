import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react';
import api from '../utils/api';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function FileUploader({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" exceeds ${MAX_MB}MB limit.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, 5);
      return combined;
    });
    setError('');
    setResult(null);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('description', description);

    try {
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setResult(data);
      setFiles([]);
      setDescription('');
      setProgress(0);
      onUploadSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>Upload Files</h2>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          ...s.dropzone,
          borderColor: dragging ? 'var(--accent)' : 'var(--border)',
          background: dragging ? 'var(--accent-dim)' : 'var(--surface-2)',
          cursor: uploading ? 'default' : 'pointer',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />
        <UploadCloud size={36} color={dragging ? 'var(--accent)' : 'var(--text-3)'} strokeWidth={1.5} />
        <p style={s.dropTitle}>
          {dragging ? 'Drop files here' : 'Drag & drop files'}
        </p>
        <p style={s.dropSub}>or click to browse — max {MAX_MB}MB per file, up to 5 files</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={s.fileList}>
          {files.map((f, i) => (
            <div key={i} style={s.fileItem}>
              <File size={16} color="var(--accent)" />
              <div style={s.fileInfo}>
                <span style={s.fileName}>{f.name}</span>
                <span style={s.fileSize}>{formatBytes(f.size)}</span>
              </div>
              <button onClick={() => removeFile(i)} style={s.removeBtn} disabled={uploading}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      <input
        type="text"
        placeholder="Optional description (max 200 chars)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
        style={s.descInput}
        disabled={uploading}
      />

      {/* Progress bar */}
      {uploading && (
        <div style={s.progressWrap}>
          <div style={{ ...s.progressBar, width: `${progress}%` }} />
          <span style={s.progressLabel}>{progress}%</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <AlertCircle size={14} /><span>{error}</span>
        </div>
      )}

      {/* Success */}
      {result && (
        <div style={s.successBox}>
          <CheckCircle size={14} color="var(--success)" />
          <span>{result.message}</span>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        style={{
          ...s.uploadBtn,
          opacity: (!files.length || uploading) ? 0.5 : 1,
          cursor: (!files.length || uploading) ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <><span style={s.spinner} />Uploading...</>
        ) : (
          <><Upload size={16} />Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}</>
        )}
      </button>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
  heading: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '4px' },
  dropzone: {
    border: '1.5px dashed',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.18s',
    userSelect: 'none',
  },
  dropTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' },
  dropSub: { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center' },
  fileList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fileItem: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px' },
  fileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' },
  fileName: { fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileSize: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'color 0.15s' },
  descInput: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none', width: '100%' },
  progressWrap: { background: 'var(--surface-2)', borderRadius: 100, height: 6, overflow: 'hidden', position: 'relative' },
  progressBar: { height: '100%', background: 'var(--accent)', borderRadius: 100, transition: 'width 0.2s', boxShadow: '0 0 8px var(--accent-glow)' },
  progressLabel: { display: 'none' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-dim)', border: '1px solid rgba(255,68,85,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--danger)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' },
  successBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--success-dim)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--success)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' },
  uploadBtn: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)', padding: '13px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.18s', width: '100%', justifyContent: 'center' },
  spinner: { width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
};
