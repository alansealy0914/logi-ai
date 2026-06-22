import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import Auth from './components/Auth';
import ShipmentList from './components/ShipmentList';
import DashboardMetrics from './components/DashboardMetrics';
import DriverList from './components/DriverList';
import TruckList from './components/TruckList';
import CreateShipment from './components/CreateShipment';
import ShipmentDetail from './components/ShipmentDetail';
import DriverDetail from './components/DriverDetail';
import TruckDetail from './components/TruckDetail';
import RouteOptimization from './components/RouteOptimization';
import Footer from './components/Footer';
import AIChat from './components/AIChat';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function LiveMarker() {
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.0060]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8002/tracking/ws/TRK12345');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPosition([data.lat, data.lng]);
    };
    return () => ws.close();
  }, []);

  return <Marker position={position} />;
}

function Dashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <DashboardMetrics />
      <AIChat />

      <div>
        <h2>Live Shipment Tracking</h2>
        <MapContainer center={[40.7128, -74.0060]} zoom={10} style={{ height: '500px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LiveMarker />
        </MapContainer>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const navigate = useNavigate();

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  const handleAuthenticated = (t: string) => {
    localStorage.setItem('access_token', t);
    setToken(t);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    navigate('/login');
  };

  const navLink = ({ isActive }: { isActive: boolean }) => ({
    display: 'block',
    padding: '10px 16px',
    borderRadius: 6,
    textDecoration: 'none',
    fontWeight: 600,
    color: isActive ? '#fff' : '#c9d1d9',
    background: isActive ? '#0366d6' : 'transparent',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial' }}>
      {token && (
        <aside style={{
          width: 220,
          background: '#1a1f2e',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
            🚛 LogiAI
          </div>
          <NavLink to="/dashboard" style={navLink}>📊 Dashboard</NavLink>
          <NavLink to="/shipments" style={navLink}>📦 Shipments</NavLink>
          <NavLink to="/drivers" style={navLink}>🧑‍✈️ Drivers</NavLink>
          <NavLink to="/trucks" style={navLink}>🚛 Trucks</NavLink>
          <NavLink to="/optimize" style={navLink}>🗺️ Route Optimizer</NavLink>
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={logout}
              style={{ width: '100%', padding: '10px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </aside>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" replace /> : <Auth mode="login" onAuthenticated={handleAuthenticated} />}
          />
          <Route
            path="/register"
            element={token ? <Navigate to="/dashboard" replace /> : <Auth mode="register" onAuthenticated={handleAuthenticated} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/shipments"      element={<ProtectedRoute><ShipmentList /></ProtectedRoute>} />
          <Route path="/shipments/new"  element={<ProtectedRoute><CreateShipment /></ProtectedRoute>} />
          <Route path="/shipments/:id"  element={<ProtectedRoute><ShipmentDetail /></ProtectedRoute>} />
          <Route path="/drivers"      element={<ProtectedRoute><DriverList /></ProtectedRoute>} />
          <Route path="/drivers/new"  element={<ProtectedRoute><DriverDetail /></ProtectedRoute>} />
          <Route path="/drivers/:id"  element={<ProtectedRoute><DriverDetail /></ProtectedRoute>} />
          <Route path="/trucks"       element={<ProtectedRoute><TruckList /></ProtectedRoute>} />
          <Route path="/trucks/new"   element={<ProtectedRoute><TruckDetail /></ProtectedRoute>} />
          <Route path="/trucks/:id"   element={<ProtectedRoute><TruckDetail /></ProtectedRoute>} />
          <Route path="/optimize"     element={<ProtectedRoute><RouteOptimization /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </div>
        <Footer />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
