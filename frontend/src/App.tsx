import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Auth from './components/Auth';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function LiveMarker() {
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.0060]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/tracking/ws/TRK12345');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPosition([data.lat, data.lng]);
    };
    return () => ws.close();
  }, []);

  return <Marker position={position} />;
}

function Dashboard({ aiQuery, setAiQuery, aiResponse, askAI, logout }: { aiQuery: string; setAiQuery: (value: string) => void; aiResponse: string; askAI: () => Promise<void>; logout: () => void }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Welcome</h3>
        <div>
          <button onClick={logout} style={{ padding: '6px 12px' }}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>AI Logistics Assistant</h2>
        <input
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          placeholder="e.g. Find similar delayed shipments from Chicago"
          style={{ width: '400px', padding: '10px' }}
        />
        <button onClick={askAI} style={{ padding: '10px 20px' }}>Ask AI</button>
        {aiResponse && <p><strong>Answer:</strong> {aiResponse}</p>}
      </div>

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

function ProtectedRoute({ token, children }: { token: string | null; children: JSX.Element }) {
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
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

  const askAI = async () => {
    const res = await axios.post('http://localhost:8002/ai/assistant', { query: aiQuery });
    setAiResponse(res.data.answer);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>🚛 LogiAI - Transportation Dashboard</h1>
        <Link to="/login" style={{ textDecoration: 'none', color: '#0366d6', fontWeight: 600 }}>Login</Link>
      </div>

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
            <ProtectedRoute token={token}>
              <Dashboard aiQuery={aiQuery} setAiQuery={setAiQuery} aiResponse={aiResponse} askAI={askAI} logout={logout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
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
