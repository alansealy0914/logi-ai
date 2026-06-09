import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Driver, Truck } from '../models/Fleet';

const API = 'http://localhost:8002';

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: '#eff6ff', color: '#0366d6' },
  IN_TRANSIT: { bg: '#fffbeb', color: '#d97706' },
  DELIVERED:  { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:  { bg: '#fff5f5', color: '#e53e3e' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d0d7de',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#6a737d', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ fontSize: 15, color: '#1a1f2e', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [shipment, setShipment] = useState<any>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/shipments/${id}`, { headers }),
      axios.get(`${API}/drivers/`, { headers }),
      axios.get(`${API}/trucks/`, { headers }),
    ]).then(([s, d, t]) => {
      setShipment(s.data);
      setDrivers(d.data);
      setTrucks(t.data);
      setForm({
        origin:             s.data.origin,
        destination:        s.data.destination,
        status:             s.data.status,
        estimated_delivery: s.data.estimated_delivery ? s.data.estimated_delivery.split('T')[0] : '',
        actual_delivery:    s.data.actual_delivery    ? s.data.actual_delivery.split('T')[0]    : '',
        driver_id:          s.data.driver_id  || '',
        vehicle_id:         s.data.vehicle_id || '',
      });
    }).catch(() => setError('Failed to load shipment.'));
  }, [id]);

  const set = (field: string, value: string) => setForm((p: any) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/shipments/${id}`, {
        ...form,
        estimated_delivery: form.estimated_delivery || null,
        actual_delivery:    form.actual_delivery    || null,
        driver_id:          form.driver_id          || null,
        vehicle_id:         form.vehicle_id         || null,
      }, { headers });
      const updated = await axios.get(`${API}/shipments/${id}`, { headers });
      setShipment(updated.data);
      setEditing(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !shipment) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!shipment) return <div style={{ padding: 24 }}>Loading...</div>;

  const badge = statusColors[shipment.status] ?? { bg: '#f3f4f6', color: '#333' };

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/shipments')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>📦 {shipment.tracking_number}</h2>
          <span style={{ fontSize: 12, color: '#6a737d' }}>Created {new Date(shipment.created_at).toLocaleDateString()}</span>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13, background: badge.bg, color: badge.color }}>
          {shipment.status}
        </span>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{ padding: '8px 18px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d0d7de', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', marginBottom: 16, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 24 }}>
        {!editing ? (
          // --- View Mode ---
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            <Field label="Origin"             value={shipment.origin} />
            <Field label="Destination"        value={shipment.destination} />
            <Field label="Status"             value={shipment.status} />
            <Field label="Est. Delivery"      value={shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString() : '—'} />
            <Field label="Actual Delivery"    value={shipment.actual_delivery    ? new Date(shipment.actual_delivery).toLocaleDateString()    : '—'} />
            <Field label="Driver"             value={shipment.driver_name  || 'Unassigned'} />
            <Field label="Truck"              value={shipment.truck_ref ? `${shipment.truck_ref} — ${shipment.truck_model}` : 'Unassigned'} />
            <Field label="Tracking Number"    value={shipment.tracking_number} />
          </div>
        ) : (
          // --- Edit Mode ---
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Origin</label>
                <input value={form.origin} onChange={e => set('origin', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Destination</label>
                <input value={form.destination} onChange={e => set('destination', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
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
                <label style={labelStyle}>Est. Delivery</label>
                <input type="date" value={form.estimated_delivery} onChange={e => set('estimated_delivery', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Actual Delivery</label>
                <input type="date" value={form.actual_delivery} onChange={e => set('actual_delivery', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Driver</label>
                <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)} style={inputStyle}>
                  <option value="">— Unassigned —</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Truck</label>
                <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)} style={inputStyle}>
                  <option value="">— Unassigned —</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_id} — {t.model}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
