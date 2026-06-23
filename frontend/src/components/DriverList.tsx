import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Driver } from '../models/Fleet';

const statusColor: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: '#dcfce7', color: '#16a34a' },
  ON_TRIP:   { bg: '#fef9c3', color: '#ca8a04' },
  OFF_DUTY:  { bg: '#f3f4f6', color: '#6b7280' },
};

export default function DriverList() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios.get('http://localhost:8009/drivers/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDrivers(res.data))
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading drivers...</div>;
  if (error) return <div style={{ padding: 20, color: 'crimson' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🧑✈️ Drivers</h2>
        <button
          onClick={() => navigate('/drivers/new')}
          style={{ padding: '8px 16px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Driver
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e1e4e8', background: '#f6f8fa' }}>
            {['Name', 'License', 'Phone', 'Status', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#6a737d' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => {
            const badge = statusColor[d.status] ?? { bg: '#f3f4f6', color: '#333' };
            return (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: '12px 14px', color: '#555' }}>{d.license_number}</td>
                <td style={{ padding: '12px 14px', color: '#555' }}>{d.phone ?? '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                    {d.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => navigate(`/drivers/${d.id}`)}
                    style={{ background: 'none', border: 'none', color: '#0366d6', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
