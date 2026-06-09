import { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const API = 'http://localhost:8002';

const COLORS = ['#0366d6', '#16a34a', '#d97706', '#e53e3e', '#7c3aed'];

const inputStyle: React.CSSProperties = {
  padding: '8px 10px', border: '1px solid #d0d7de', borderRadius: 6,
  fontSize: 13, boxSizing: 'border-box', width: '100%',
};

interface LocationRow { name: string; lat: string; lng: string; demand: string; }
interface Stop { name: string; lat: number; lng: number; demand: number; }
interface Route { vehicle: number; stops: Stop[]; distance_km: number; }
interface Result { status: string; total_distance_km: number; vehicles_used: number; routes: Route[]; message?: string; }

const DEFAULT_LOCATIONS: LocationRow[] = [
  { name: 'Depot — Chicago, IL',      lat: '41.8781', lng: '-87.6298', demand: '0'  },
  { name: 'Dallas, TX',               lat: '32.7767', lng: '-96.7970', demand: '200'},
  { name: 'Nashville, TN',            lat: '36.1627', lng: '-86.7816', demand: '150'},
  { name: 'Kansas City, MO',          lat: '39.0997', lng: '-94.5786', demand: '180'},
  { name: 'Indianapolis, IN',         lat: '39.7684', lng: '-86.1581', demand: '120'},
  { name: 'Columbus, OH',             lat: '39.9612', lng: '-82.9988', demand: '90' },
];

function dotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function RouteOptimization() {
  const [locations, setLocations] = useState<LocationRow[]>(DEFAULT_LOCATIONS);
  const [vehicleCount, setVehicleCount] = useState(2);
  const [vehicleCapacity, setVehicleCapacity] = useState(1000);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setLoc = (i: number, field: keyof LocationRow, value: string) =>
    setLocations(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const addRow = () => setLocations(prev => [...prev, { name: '', lat: '', lng: '', demand: '0' }]);
  const removeRow = (i: number) => setLocations(prev => prev.filter((_, idx) => idx !== i));

  const handleOptimize = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        locations: locations.map(l => ({ name: l.name, lat: parseFloat(l.lat), lng: parseFloat(l.lng) })),
        demands:   locations.map(l => parseInt(l.demand) || 0),
        vehicle_count:    vehicleCount,
        vehicle_capacity: vehicleCapacity,
      };
      const res = await axios.post(`${API}/optimize/route`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter: [number, number] = [39.5, -90];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>🗺️ Route Optimization</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* LEFT — Config */}
        <div>
          {/* Vehicle settings */}
          <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Fleet Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6a737d', display: 'block', marginBottom: 4 }}>VEHICLES</label>
                <input type="number" min={1} max={10} value={vehicleCount}
                  onChange={e => setVehicleCount(parseInt(e.target.value) || 1)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6a737d', display: 'block', marginBottom: 4 }}>CAPACITY (units)</label>
                <input type="number" min={1} value={vehicleCapacity}
                  onChange={e => setVehicleCapacity(parseInt(e.target.value) || 1)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Locations table */}
          <div style={{ background: '#fff', border: '1px solid #e1e4e8', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Stops <span style={{ color: '#6a737d', fontWeight: 400 }}>(row 0 = depot)</span></div>
              <button onClick={addRow} style={{ padding: '4px 12px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Stop</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 24px', gap: 6, marginBottom: 6 }}>
              {['Name', 'Lat', 'Lng', 'Demand', ''].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6a737d', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {locations.map((loc, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 24px', gap: 6, marginBottom: 6 }}>
                <input value={loc.name}   onChange={e => setLoc(i, 'name',   e.target.value)} placeholder="Location name" style={{ ...inputStyle, background: i === 0 ? '#f6f8fa' : '#fff' }} />
                <input value={loc.lat}    onChange={e => setLoc(i, 'lat',    e.target.value)} placeholder="Lat"  style={inputStyle} />
                <input value={loc.lng}    onChange={e => setLoc(i, 'lng',    e.target.value)} placeholder="Lng"  style={inputStyle} />
                <input value={loc.demand} onChange={e => setLoc(i, 'demand', e.target.value)} placeholder="0"    style={{ ...inputStyle, background: i === 0 ? '#f6f8fa' : '#fff' }} disabled={i === 0} />
                <button onClick={() => removeRow(i)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#ccc' : '#e53e3e', fontSize: 16, padding: 0 }}>×</button>
              </div>
            ))}
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#0366d6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Optimizing...' : '⚡ Optimize Routes'}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Results summary */}
          {result && (
            <div style={{ marginTop: 16 }}>
              {result.status === 'failed' ? (
                <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030' }}>❌ {result.message}</div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: '#f0f4ff', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#0366d6' }}>{result.total_distance_km}</div>
                      <div style={{ fontSize: 12, color: '#6a737d' }}>Total km</div>
                    </div>
                    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{result.vehicles_used}</div>
                      <div style={{ fontSize: 12, color: '#6a737d' }}>Vehicles used</div>
                    </div>
                    <div style={{ flex: 1, background: '#fffbeb', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{result.routes.reduce((s, r) => s + r.stops.length - 2, 0)}</div>
                      <div style={{ fontSize: 12, color: '#6a737d' }}>Total stops</div>
                    </div>
                  </div>
                  {result.routes.map((route, ri) => (
                    <div key={ri} style={{ background: '#fff', border: `2px solid ${COLORS[ri % COLORS.length]}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, color: COLORS[ri % COLORS.length], marginBottom: 8 }}>
                        Vehicle {route.vehicle} — {route.distance_km} km
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {route.stops.map((stop, si) => (
                          <span key={si} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, background: '#f6f8fa', padding: '2px 8px', borderRadius: 10, border: '1px solid #e1e4e8' }}>{stop.name}</span>
                            {si < route.stops.length - 1 && <span style={{ color: '#aaa', fontSize: 12 }}>→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div style={{ position: 'sticky', top: 24 }}>
          <MapContainer center={mapCenter} zoom={4} style={{ height: '680px', width: '100%', borderRadius: 8, border: '1px solid #e1e4e8' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Show all location markers */}
            {locations.map((loc, i) => {
              const lat = parseFloat(loc.lat), lng = parseFloat(loc.lng);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={i} position={[lat, lng]} icon={dotIcon(i === 0 ? '#1a1f2e' : '#6a737d')}>
                  <Popup>{loc.name || `Stop ${i}`}</Popup>
                </Marker>
              );
            })}

            {/* Draw optimized routes */}
            {result?.routes.map((route, ri) => {
              const color = COLORS[ri % COLORS.length];
              const points: [number, number][] = route.stops.map(s => [s.lat, s.lng]);
              return (
                <div key={ri}>
                  <Polyline positions={points} color={color} weight={3} opacity={0.85} />
                  {route.stops.map((stop, si) => (
                    <Marker key={si} position={[stop.lat, stop.lng]} icon={dotIcon(color)}>
                      <Popup>
                        <strong>{stop.name}</strong><br />
                        {stop.demand > 0 && <>Demand: {stop.demand}</>}
                      </Popup>
                    </Marker>
                  ))}
                </div>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
