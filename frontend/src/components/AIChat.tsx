import { useState } from 'react';
import axios from 'axios';

export default function AIChat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResponse('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://localhost:8009/ai/assistant', { query }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResponse(res.data.answer);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'AI assistant is unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h2>AI Logistics Assistant</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder="e.g. Show delayed shipments and their locations"
          style={{ flex: 1, maxWidth: 500, padding: '10px' }}
        />
        <button onClick={ask} disabled={loading} style={{ padding: '10px 20px', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>
      {error && (
        <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}
      {response && !error && (
        <div style={{ padding: '14px', background: '#f0f4ff', border: '1px solid #c3d3f5', borderRadius: 6, lineHeight: 1.6 }}>
          <strong>Answer:</strong> {response}
        </div>
      )}
    </div>
  );
}
