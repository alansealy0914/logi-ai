import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8009';

const statusColors: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: '#dcfce7', color: '#16a34a' },
  ON_TRIP:   { bg: '#fef9c3', color: '#ca8a04' },
  OFF_DUTY:  { bg: '#f3f4f6', color: '#6b7280' },
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

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const [driver, setDriver] = useState<any>(null);
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', license_number: '', phone: '', status: 'AVAILABLE' });

  useEffect(() => {
    if (isNew) return;
    axios.get(`${API}/drivers/${id}`, { headers })
      .then(res => {
        setDriver(res.data);
        setForm({ name: res.data.name, license_number: res.data.license_number, phone: res.data.phone || '', status: res.data.status });
      })
      .catch(() => setError('Failed to load driver.'));
  }, [id]);

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await axios.post(`${API}/drivers/`, form, { headers });
        navigate('/drivers');
      } else {
        await axios.put(`${API}/drivers/${id}`, form, { headers });
        const updated = await axios.get(`${API}/drivers/${id}`, { headers });
        setDriver(updated.data);
        setEditing(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && error && !driver) return <div style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  if (!isNew && !driver) return <div style={{ padding: 24 }}>Loading...</div>;

  const badge = statusColors[isNew ? form.status : driver?.status] ?? { bg: '#f3f4f6', color: '#333' };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/drivers')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{isNew ? '➕ New Driver' : `🧑‍✈️ ${driver?.name}`}</h2>
          {!isNew && <span style={{ fontSize: 12, color: '#6a737d' }}>{driver?.license_number}</span>}
        </div>
        {!isNew && (
          <span style={{ padding: '4px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13, background: badge.bg, color: badge.color }}>
            {driver?.status?.replace('_', ' ')}
          </span>
        )}
        {!isNew && !editing && (
          <button onClick={() => setEditing(true)} style={{ padding: '8px 18px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            Edit
          </button>
        )}
        {(editing && !isNew) && (
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
            <Field label="Full Name"       value={driver?.name} />
            <Field label="License Number"  value={driver?.license_number} />
            <Field label="Phone"           value={driver?.phone} />
            <Field label="Status"          value={driver?.status?.replace('_', ' ')} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>License Number</label>
              <input value={form.license_number} onChange={e => set('license_number', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
              </select>
            </div>
            {isNew && (
              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '11px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Creating...' : 'Create Driver'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
