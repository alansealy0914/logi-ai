import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Driver } from '../models/Fleet';

const API = 'http://localhost:8002';

const statusColors: Record<string, { bg: string; color: string }> = {
  AVAILABLE:   { bg: '#dcfce7', color: '#16a34a' },
  IN_USE:      { bg: '#fef9c3', color: '#ca8a04' },
  MAINTENANCE: { bg: '#fee2e2', color: '#dc2626' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d0d7de',
  borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#6a737d', textTransform: 'uppercase',
  letterSpacing: 0.5, marginBottom: 4, display: 'block',
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <span style={labelStyle}>{label}</span>
      <div style={{ fontSize: 15, color: '#1a1f2e', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export default function TruckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const [truck, setTruck] = useState<any>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ truck_id: '', plate: '', model: '', capacity_tons: '', status: 'AVAILABLE', driver_id: '' });

  useEffect(() => {
    const requests = [axios.get(`${API}/drivers/`, { headers })];
    if (!isNew) requests.push(axios.get(`${API}/trucks/${id}`, { headers }));
    Promise.all(requests).then(([d, t]) => {
      setDrivers(d.data);
      if (t) {
        setTruck(t.data);
        setForm({
          truck_id:      t.data.truck_id,
          plate:         t.data.plate,
          model:         t.data.model,
          capacity_tons: String(t.data.capacity_tons),
          status:        t.data.status,
          driver_id:     t.data.driver_id || '',
        });
      }
    }).catch(() => setError('Failed to load data.'));
  }, [id]);

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, capacity_tons: parseFloat(form.capacity_tons) || 0, driver_id: form.driver_id || null };
      if (isNew) {
        await axios.post(`${API}/trucks/`, payload, { headers });
        navigate('/trucks');
      } else {
        await axios.put(`${API}/trucks/${id}`, payload, { headers });
        const updated = await axios.get(`${API}/trucks/${id}`, { headers });
        setTruck(updated.data);
        setEditing(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && error && !truck) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!isNew && !truck) return <div style={{ padding: 24 }}>Loading...</div>;

  const badge = statusColors[isNew ? form.status : truck?.status] ?? { bg: '#f3f4f6', color: '#333' };

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/trucks')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{isNew ? '➕ New Truck' : `🚛 ${truck?.truck_id}`}</h2>
          {!isNew && <span style={{ fontSize: 12, color: '#6a737d' }}>{truck?.model} · {truck?.plate}</span>}
        </div>
        {!isNew && (
          <span style={{ padding: '4px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13, background: badge.bg, color: badge.color }}>
            {truck?.status?.replace('_', ' ')}
          </span>
        )}
        {!isNew && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding: '8px 18px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
        )}
        {editing && !isNew && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d0d7de', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', marginBottom: 16, fontSize: 14 }}>⚠️ {error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 24 }}>
        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            <Field label="Truck ID"      value={truck?.truck_id} />
            <Field label="Plate"         value={truck?.plate} />
            <Field label="Model"         value={truck?.model} />
            <Field label="Capacity"      value={`${truck?.capacity_tons}t`} />
            <Field label="Status"        value={truck?.status?.replace('_', ' ')} />
            <Field label="Driver"        value={truck?.driver_name || 'Unassigned'} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Truck ID</label>
              <input value={form.truck_id} onChange={e => set('truck_id', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Plate</label>
              <input value={form.plate} onChange={e => set('plate', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Capacity (tons)</label>
              <input type="number" step="0.5" value={form.capacity_tons} onChange={e => set('capacity_tons', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Driver</label>
              <select value={form.driver_id} onChange={e => set('driver_id', e.target.value)} style={inputStyle}>
                <option value="">— Unassigned —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
              </select>
            </div>
            {isNew && (
              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Truck'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
