import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Driver, Truck } from '../models/Fleet';

const API = 'http://localhost:8009';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #d0d7de',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#444',
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks]   = useState<Truck[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    tracking_number: '',
    origin: '',
    destination: '',
    status: 'PENDING',
    estimated_delivery: '',
    driver_id: '',
    vehicle_id: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/drivers/`, { headers }),
      axios.get(`${API}/trucks/`,  { headers }),
    ]).then(([d, t]) => {
      setDrivers(d.data);
      setTrucks(t.data);
    });
  }, []);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API}/shipments/`, {
        ...form,
        estimated_delivery: form.estimated_delivery || null,
        driver_id: form.driver_id || null,
        vehicle_id: form.vehicle_id || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/shipments');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to create shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label: string, key: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required={['tracking_number', 'origin', 'destination'].includes(key)}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/shipments')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
        <h2 style={{ margin: 0 }}>📦 New Shipment</h2>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', marginBottom: 16, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 24 }}>
        {field('Tracking Number', 'tracking_number', 'text', 'e.g. TRK99001')}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Origin</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="e.g. Chicago, IL" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Destination</label>
            <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Dallas, TX" required style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estimated Delivery</label>
            <input type="date" value={form.estimated_delivery} onChange={e => set('estimated_delivery', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Driver</label>
            <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)} style={inputStyle}>
              <option value="">— Unassigned —</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Truck</label>
            <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} style={inputStyle}>
              <option value="">— Unassigned —</option>
              {trucks.map(t => (
                <option key={t.id} value={t.id}>{t.truck_id} — {t.model}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{ width: '100%', padding: '11px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Creating...' : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
}
