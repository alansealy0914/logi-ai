export interface Shipment {
  id: string;
  tracking_number: string;
  origin: string;
  destination: string;
  status: string;
  driver_id?: string;
  vehicle_id?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  metadata?: any;
  created_at: string;
}

export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
