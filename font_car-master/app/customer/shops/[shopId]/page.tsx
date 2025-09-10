'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Car, Building, MapPin } from 'lucide-react';
import { useLang } from "../../../providers";
import { texts } from "../../../texts";
import CustomerNav from '../../../components/navcustomer';




// ควรจะย้าย Interface เหล่านี้ไปไว้ที่ไฟล์กลางเช่น app/types.ts
interface Shop {
  id: number;
  username: string;
  shop_name: string;
  address?: string;
  profile_image?: string;
  phone?: string;
  // เพิ่ม field อื่นๆ ตามที่ API ส่งมา
}

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance' | 'hidden';
  image_url?: string;
}

export default function ShopDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading, isCustomer } = useAuth();
  const { lang } = useLang();
  const t = texts[lang];
  
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!shopId) return;

    const fetchShopData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // เรียก API ทั้งสองตัวพร้อมกันเพื่อความเร็ว
        const [shopResponse, carsResponse] = await Promise.all([
          axios.get(`${API_URL}/shops/${shopId}`, { headers }),
          axios.get(`${API_URL}/shops/${shopId}/cars`, { headers })
        ]);

        setShop(shopResponse.data.shop);
        setCars(carsResponse.data.cars);

      } catch (err: any) {
        console.error('Failed to fetch shop data:', err);
        setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลร้านค้าได้');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId, API_URL]);

  // Redirect ถ้ายังไม่ login หรือไม่ใช่ customer
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (!authLoading && user && !isCustomer()) {
      router.replace('/');
    }
  }, [user, authLoading, isCustomer, router]);
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          กลับไปหน้าก่อนหน้า
        </button>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
         <h2 className="text-2xl font-bold text-gray-800 mb-4">ไม่พบร้านค้า</h2>
        <p className="text-gray-600 mb-6">อาจไม่มีร้านค้านี้อยู่ในระบบ</p>
         <button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          กลับไปหน้าก่อนหน้า
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <CustomerNav reviewableRentals={[]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t.shoppage.back}</span>
        </button>

        {/* Shop Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center border-4 border-white shadow-md">
              {shop.profile_image ? (
                <img
                  src={`${BASE_URL}${shop.profile_image}`}
                  alt={shop.shop_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Building size={64} className="text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{shop.shop_name}</h1>
              {shop.address && (
                <p className="mt-2 text-gray-600 flex items-center gap-2">
                  <MapPin size={16} />
                  {shop.address}
                </p>
              )}
               {shop.phone && (
                <p className="mt-1 text-gray-600">
                  {t.shoppage.tel}: {shop.phone}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Car List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t.shoppage.car} : {shop.shop_name}
          </h2>
          {cars.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">ยังไม่มีรถยนต์ให้บริการจากร้านนี้</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cars.map((car) => (
                <div key={car.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <div className="h-48 bg-gray-200">
                    {car.image_url ? (
                      <img
                        src={`${BASE_URL}${car.image_url}`}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Car size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900">{car.brand} {car.model}</h3>
                    <p className="text-gray-600 text-sm">{t.shoppage.year} {car.year} • {car.seats} {t.shoppage.seats}</p>
                    <div className="mt-4 flex-grow">
                      <p className="text-2xl font-bold text-green-600">
                        ฿{car.daily_rate.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">/{t.shoppage.day}</span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link href={`/customer/cars/${car.id}`} className="block">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                          {t.shoppage.look}
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
    </div>
  );
}