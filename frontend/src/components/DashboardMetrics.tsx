import { useState, useEffect } from 'react';
import axios from 'axios';

interface Metrics {
  total: number;
  in_transit: number;
  delivered: number;
  pending: number;
  cancelled: number;
  on_time: number;
  delayed: number;
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: string;
}

function StatCard({ label, value, color, bg, icon }: StatCardProps) {
  return (
    <div style={{
      flex: '1 1 160px',
      background: bg,
      borderRadius: 10,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <div style={{ fontSize: 30 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6a737d', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    axios.get('http://localhost:8002/shipments/metrics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setMetrics(res.data))
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#6a737d', marginBottom: 32 }}>Loading metrics...</div>;
  if (error || !metrics) return <div style={{ color: 'crimson', marginBottom: 32 }}>Failed to load metrics: {error}</div>;

  const cards: StatCardProps[] = [
    { label: 'Total Shipments', value: metrics.total,      color: '#1a1f2e', bg: '#f0f4ff', icon: '📦' },
    { label: 'In Transit',      value: metrics.in_transit, color: '#d97706', bg: '#fffbeb', icon: '🚛' },
    { label: 'Delivered',       value: metrics.delivered,  color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
    { label: 'Pending',         value: metrics.pending,    color: '#0366d6', bg: '#eff6ff', icon: '🕐' },
    { label: 'Cancelled',       value: metrics.cancelled,  color: '#e53e3e', bg: '#fff5f5', icon: '❌' },
    { label: 'On Time',         value: metrics.on_time,    color: '#16a34a', bg: '#f0fdf4', icon: '⚡' },
    { label: 'Delayed',         value: metrics.delayed,    color: '#b45309', bg: '#fffbeb', icon: '⚠️' },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Shipment Overview</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
