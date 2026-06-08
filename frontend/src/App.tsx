import { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

function App() {
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [shipments, setShipments] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  const handleAuthenticated = (t: string) => {
    localStorage.setItem('access_token', t);
    setToken(t);
  }

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
  }

  const askAI = async () => {
    const res = await axios.post('http://localhost:8000/ai/assistant', { query: aiQuery });
    setAiResponse(res.data.answer);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚛 LogiAI - Transportation Dashboard</h1>

      {!token ? (
        <Auth onAuthenticated={handleAuthenticated} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default App;