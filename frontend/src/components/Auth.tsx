import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onAuthenticated }:{ onAuthenticated: (token: string) => void }){
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      await axios.post('http://localhost:8000/auth/register', { email, password, full_name: fullName });
      setIsRegister(false);
      setError(null);
    }catch(err:any){
      setError(err?.response?.data?.detail || err.message || 'Registration failed');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await axios.post('http://localhost:8000/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const token = res.data.access_token;
      onAuthenticated(token);
      setError(null);
    }catch(err:any){
      setError(err?.response?.data?.detail || err.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'Arial' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={isRegister ? handleRegister : handleLogin}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>

        {isRegister && (
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

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" style={{ padding: '8px 14px' }}>{isRegister ? 'Create account' : 'Sign in'}</button>
          <button type="button" onClick={()=>setIsRegister(!isRegister)} style={{ padding: '8px 14px' }}>
            {isRegister ? 'Back to login' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
