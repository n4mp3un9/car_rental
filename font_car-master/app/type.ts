// app/types.ts

// นำ Interface ของ Car จากหน้า dashboard มาไว้ที่นี่
export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  color: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance' | 'deleted' | 'hidden';
  description?: string;
  image_url?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

// คุณอาจจะเพิ่ม Type อื่นๆ ที่ใช้ร่วมกันไว้ที่นี่ได้ด้วย