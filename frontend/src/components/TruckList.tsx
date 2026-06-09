import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck } from '../models/Fleet';

const statusColor: Record<string, { bg: string; color: string }> = {
  AVAILABLE:   { bg: '#dcfce7', color: '#16a34a' },
  IN_USE:      { bg: '#fef9c3', color: '#ca8a04' },
  MAINTENANCE: { bg: '#fee2e2', color: '#dc2626' },
};

export default function TruckList() {
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios.get('http://localhost:8002/trucks/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTrucks(res.data))
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading trucks...</div>;
  if (error) return <div style={{ padding: 20, color: 'crimson' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🚛 Trucks</h2>
        <button
          onClick={() => navigate('/trucks/new')}
          style={{ padding: '8px 16px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
        >
          + New Truck
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e1e4e8', background: '#f6f8fa' }}>
            {['Truck ID', 'Plate', 'Model', 'Capacity', 'Driver', 'Status', ''].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#6a737d' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trucks.map(t => {
            const badge = statusColor[t.status] ?? { bg: '#f3f4f6', color: '#333' };
            return (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700 }}>{t.truck_id}</td>
                <td style={{ padding: '12px 14px', color: '#555' }}>{t.plate}</td>
                <td style={{ padding: '12px 14px', color: '#555' }}>{t.model}</td>
                <td style={{ padding: '12px 14px', color: '#555' }}>{t.capacity_tons}t</td>
                <td style={{ padding: '12px 14px', color: t.driver_name ? '#1a1f2e' : '#aaa' }}>
                  {t.driver_name ?? 'Unassigned'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => navigate(`/trucks/${t.id}`)}
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
