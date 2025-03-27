// app/shop/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import AddCarModal from '../components/AddCarModal';
import ImageUploadModal from '../components/ImageUploadModal';

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

export default function ShopDashboard() {
  const router = useRouter();
  const { user, loading, isShop, logout } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State สำหรับ Modal
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchCars = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shop/cars`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCars(response.data.cars);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cars:', err);
      setError(err.response?.data?.message || 'Failed to fetch cars');
    } finally {
      setDataLoading(false);
    }
  };

  // ป้องกันปัญหา Hydration Error
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // ตรวจสอบเฉพาะเมื่อข้อมูลโหลดเสร็จแล้ว
    if (!loading) {
      if (!user) {
        // ใช้ replace แทน push เพื่อป้องกันการกลับมายังหน้าก่อนหน้าด้วยปุ่ม back
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // จัดการ Modal
  const handleAddCar = () => {
    setIsAddCarModalOpen(true);
  };

  const handleAddCarSuccess = (carId: number) => {
    setIsAddCarModalOpen(false);
    setSelectedCarId(carId);
    setIsImageUploadModalOpen(true);
  };

  const handleImageUploadSuccess = () => {
    fetchCars(); // ดึงข้อมูลรถใหม่หลังจากอัปโหลดรูปภาพ
  };

  // ถ้ายังไม่ mount ให้แสดงหน้าว่างไว้ก่อน เพื่อป้องกัน hydration error
  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

  // แสดงหน้าโหลดขณะกำลังตรวจสอบสถานะการล็อกอิน
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">ระบบจัดการเช่ารถ</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/shop/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  แดชบอร์ด
                </Link>
                <Link
                  href="/shop/cars"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  จัดการรถยนต์
                </Link>
                <Link
                  href="/shop/bookings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  จัดการการจอง
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div>
                  <span className="mr-4">สวัสดี, {user.shop_name || user.username}</span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">แดชบอร์ด</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-lg">
                  <p>ยินดีต้อนรับ, {user.shop_name || user.username}</p>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={handleAddCar}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  >
                    เพิ่มรถใหม่
                  </button>
                </div>
              </div>
            </div>

            <div className="my-6">
              <h2 className="text-xl font-semibold mb-4">รถยนต์ของคุณ</h2>
              
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {dataLoading ? (
                <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
              ) : cars.length === 0 ? (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p>คุณยังไม่มีรถยนต์ในระบบ</p>
                    <button 
                      onClick={handleAddCar}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                    >
                      เพิ่มรถคันแรก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cars.map((car) => (
                    <div key={car.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="h-48 bg-gray-200 relative">
                        {car.image_url ? (
                          <img 
                            src={car.image_url} 
                            alt={`${car.brand} ${car.model}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex justify-center items-center h-full bg-gray-200 text-gray-400">
                            ไม่มีรูปภาพ
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${
                          car.status === 'available' ? 'bg-green-500 text-white' :
                          car.status === 'rented' ? 'bg-blue-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {car.status === 'available' ? 'ว่าง' :
                           car.status === 'rented' ? 'ถูกเช่า' : 'อยู่ระหว่างซ่อมบำรุง'}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{car.brand} {car.model}</h3>
                        <p className="text-gray-600">ปี {car.year} • ทะเบียน {car.license_plate}</p>
                        <p className="text-gray-600">ประเภท: {car.car_type}</p>
                        <p className="text-green-600 font-semibold mt-2">฿{car.daily_rate.toLocaleString()}/วัน</p>
                        <div className="mt-4 flex space-x-2">
                          <Link href={`/shop/cars/${car.id}/edit`}>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">
                              แก้ไข
                            </button>
                          </Link>
                          {!car.image_url && (
                            <button 
                              onClick={() => {
                                setSelectedCarId(car.id);
                                setIsImageUploadModalOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded"
                            >
                              เพิ่มรูปภาพ
                            </button>
                          )}
                          <Link href={`/shop/cars/${car.id}/status`}>
                            <button className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded">
                              จัดการสถานะ
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddCarModal 
        isOpen={isAddCarModalOpen} 
        onClose={() => setIsAddCarModalOpen(false)} 
        onSuccess={handleAddCarSuccess} 
      />
      
      {selectedCarId && (
        <ImageUploadModal 
          isOpen={isImageUploadModalOpen} 
          onClose={() => setIsImageUploadModalOpen(false)} 
          carId={selectedCarId} 
          onSuccess={handleImageUploadSuccess} 
        />
      )}
    </div>
  );
}