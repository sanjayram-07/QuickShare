import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Zap, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const pwChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
  };
  const pwValid = Object.values(pwChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pwValid) { setError('Password does not meet requirements.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.msg).join(', ');
      setError(msgs || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const Check = ({ ok, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ok ? 'var(--success)' : 'var(--text-3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
      <CheckCircle size={12} />
      {label}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card} className="animate-fade">
        <div style={styles.logoWrap}>
          <div style={styles.logo}><Zap size={22} color="#00e5ff" strokeWidth={2.5} /></div>
          <span style={styles.logoText}>QuickShare</span>
        </div>

        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Join to start sharing files securely</p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <User size={16} color="var(--text-3)" style={styles.icon} />
              <input type="text" placeholder="cooluser123" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3} maxLength={30} style={styles.input} autoComplete="username" />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <Mail size={16} color="var(--text-3)" style={styles.icon} />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required style={styles.input} autoComplete="email" />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <Lock size={16} color="var(--text-3)" style={styles.icon} />
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required style={styles.input} autoComplete="new-password" />
            </div>
            {form.password && (
              <div style={styles.pwChecks}>
                <Check ok={pwChecks.length} label="8+ characters" />
                <Check ok={pwChecks.upper} label="Uppercase" />
                <Check ok={pwChecks.lower} label="Lowercase" />
                <Check ok={pwChecks.number} label="Number" />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? <span style={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
  logo: { width: 38, height: 38, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid rgba(0,229,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '8px', letterSpacing: '-0.03em' },
  subtitle: { color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '32px', fontFamily: 'var(--font-mono)' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-dim)', border: '1px solid rgba(255,68,85,0.3)', borderRadius: 'var(--radius)', padding: '12px 14px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '20px', fontFamily: 'var(--font-mono)' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' },
  inputWrap: { position: 'relative' },
  icon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  input: { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px 12px 42px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', outline: 'none' },
  pwChecks: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' },
  btn: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)', padding: '14px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' },
  spinner: { width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },
  switchText: { textAlign: 'center', color: 'var(--text-2)', fontSize: '0.88rem', marginTop: '24px', fontFamily: 'var(--font-mono)' },
  link: { color: 'var(--accent)', fontWeight: 600 },
};
