export interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
  created_at: string;
}

export interface Truck {
  id: string;
  truck_id: string;
  plate: string;
  model: string;
  capacity_tons: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  driver_id?: string;
  driver_name?: string;
  created_at: string;
}
