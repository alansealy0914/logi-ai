import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

type AuthMode = 'login' | 'register';

const s = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f0f4f8' } as React.CSSProperties,
  sidebar: { width: 420, background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f4c81 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', color: '#fff' } as React.CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 } as React.CSSProperties,
  logoIcon: { width: 48, height: 48, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 } as React.CSSProperties,
  brandName: { fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' } as React.CSSProperties,
  brandTagline: { fontSize: 15, color: '#94a3b8', lineHeight: 1.6, textAlign: 'center', marginTop: 8 } as React.CSSProperties,
  featureList: { marginTop: 40, listStyle: 'none', padding: 0, width: '100%' } as React.CSSProperties,
  featureItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 14, color: '#cbd5e1' } as React.CSSProperties,
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, padding: '48px 44px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.10)' } as React.CSSProperties,
  cardTitle: { fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 } as React.CSSProperties,
  cardSub: { fontSize: 14, color: '#64748b', marginBottom: 32 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border-color 0.2s' } as React.CSSProperties,
  group: { marginBottom: 18 } as React.CSSProperties,
  btn: { width: '100%', padding: '13px', background: 'linear-gradient(90deg, #2563eb, #0891b2)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8, letterSpacing: 0.3 } as React.CSSProperties,
  error: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 } as React.CSSProperties,
  success: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 } as React.CSSProperties,
  switchRow: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' } as React.CSSProperties,
  switchLink: { color: '#2563eb', fontWeight: 600, textDecoration: 'none', marginLeft: 4 } as React.CSSProperties,
};

const features = [
  { icon: '🚚', text: 'Real-time fleet tracking & GPS' },
  { icon: '🤖', text: 'AI-powered logistics assistant' },
  { icon: '📦', text: 'Smart route optimization' },
  { icon: '📊', text: 'Live shipment analytics' },
];

export default function Auth({ mode, onAuthenticated }: { mode: AuthMode; onAuthenticated: (token: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(() => (location.state as any)?.success ?? null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8002/auth/register', { email, password, full_name: fullName });
      setError(null);
      navigate('/login', { state: { success: 'Registration successful! Please sign in.' } });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Registration failed');
      setSuccess(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await axios.post('http://localhost:8002/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      onAuthenticated(res.data.access_token);
      setError(null);
      setSuccess(null);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Login failed');
    }
  };

  return (
    <div style={s.page}>
      {/* Brand Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>🚛</div>
          <span style={s.brandName}>LogiAI</span>
        </div>
        <p style={s.brandTagline}>Intelligent Transportation &amp; Logistics Platform powered by AI</p>
        <ul style={s.featureList}>
          {features.map(f => (
            <li key={f.text} style={s.featureItem}>
              <span style={{ fontSize: 18 }}>{f.icon}</span> {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Form Panel */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTitle}>{mode === 'register' ? 'Create your account' : 'Welcome back'}</div>
          <div style={s.cardSub}>{mode === 'register' ? 'Join LogiAI and start optimizing your fleet.' : 'Sign in to your LogiAI dashboard.'}</div>

          {success && <div style={s.success}>{success}</div>}
          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
            <div style={s.group}>
              <label style={s.label}>Email address</label>
              <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@company.com" />
            </div>

            {mode === 'register' && (
              <div style={s.group}>
                <label style={s.label}>Full name</label>
                <input style={s.input} value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Smith" />
              </div>
            )}

            <div style={s.group}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>

            <button type="submit" style={s.btn}>
              {mode === 'register' ? 'Create account →' : 'Sign in →'}
            </button>
          </form>

          <div style={s.switchRow}>
            {mode === 'register' ? (
              <>Already have an account? <Link to="/login" style={s.switchLink}>Sign in</Link></>
            ) : (
              <>Don't have an account? <Link to="/register" style={s.switchLink}>Create one</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
