import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shipment } from '../models/Shipment';

export default function ShipmentList() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await axios.get('http://localhost:8002/shipments/');
        setShipments(res.data);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Failed to load shipments');
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading shipments...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Shipments</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 10 }}>{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/create-shipment"
          style={{
            padding: '8px 16px',
            background: '#0366d6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          + New Shipment
        </Link>
      </div>

      {shipments.length === 0 ? (
        <p>No shipments yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Tracking #</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Origin</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Destination</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Est. Delivery</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{shipment.tracking_number}</td>
                <td style={{ padding: '10px' }}>{shipment.origin}</td>
                <td style={{ padding: '10px' }}>{shipment.destination}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      background: shipment.status === 'DELIVERED' ? '#28a745' : shipment.status === 'IN_TRANSIT' ? '#ffc107' : '#6c757d',
                      color: 'white',
                      borderRadius: 3,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {shipment.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {shipment.estimated_delivery
                    ? new Date(shipment.estimated_delivery).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td style={{ padding: '10px' }}>
                  <Link
                    to={`/shipments/${shipment.id}`}
                    style={{ color: '#0366d6', textDecoration: 'none', fontWeight: 600 }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
