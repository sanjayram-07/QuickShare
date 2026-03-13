import { Upload, Download, HardDrive, Calendar } from 'lucide-react';

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function StatsBar({ user }) {
  const stats = [
    { label: 'Uploads', value: user?.totalUploads ?? 0, icon: Upload, color: 'var(--accent)' },
    { label: 'Downloads', value: user?.totalDownloads ?? 0, icon: Download, color: 'var(--success)' },
    { label: 'Storage Used', value: formatBytes(user?.storageUsed), icon: HardDrive, color: 'var(--warning)' },
    { label: 'Member Since', value: formatDate(user?.createdAt), icon: Calendar, color: 'var(--text-2)' },
  ];

  return (
    <div style={s.grid}>
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} style={s.card}>
          <div style={{ ...s.iconWrap, color, background: color + '15', border: `1px solid ${color}30` }}>
            <Icon size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={s.value}>{value}</div>
            <div style={s.label}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  value: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', letterSpacing: '-0.02em' },
  label: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' },
};
