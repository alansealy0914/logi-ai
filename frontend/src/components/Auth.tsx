import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

type AuthMode = 'login' | 'register';

export default function Auth({ mode, onAuthenticated }:{ mode: AuthMode; onAuthenticated: (token: string) => void }){
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(() => (location.state as any)?.success ?? null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      await axios.post('http://localhost:8002/auth/register', { email, password, full_name: fullName });
      setError(null);
      navigate('/login', { state: { success: 'Registration successful! Please sign in.' } });
    }catch(err:any){
      setError(err?.response?.data?.detail || err.message || 'Registration failed');
      setSuccess(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await axios.post('http://localhost:8002/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const token = res.data.access_token;
      onAuthenticated(token);
      setError(null);
      setSuccess(null);
      navigate('/dashboard');
    }catch(err:any){
      setError(err?.response?.data?.detail || err.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'Arial' }}>
      <h2>{mode === 'register' ? 'Register' : 'Login'}</h2>
      <form onSubmit={mode === 'register' ? handleRegister : handleLogin}>
        {success && <div style={{ color: 'green', marginBottom: 10 }}>{success}</div>}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Full name</label>
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>

        {error && <div style={{ color: 'crimson', marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" style={{ padding: '8px 14px' }}>{mode === 'register' ? 'Create account' : 'Sign in'}</button>
          {mode === 'register' ? (
            <Link to="/login" style={{ padding: '8px 14px', textDecoration: 'none', background: '#eee', borderRadius: 4 }}>Already have an account?</Link>
          ) : (
            <Link to="/register" style={{ padding: '8px 14px', textDecoration: 'none', background: '#eee', borderRadius: 4 }}>Create account</Link>
          )}
        </div>
      </form>
    </div>
  );
}
