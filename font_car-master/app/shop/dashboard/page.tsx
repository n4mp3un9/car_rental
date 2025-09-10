// app/shop/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Car, ArrowRight } from 'lucide-react';
import AddCarModal from '../../components/AddCarModal';
import ImageUploadModal from '../../components/ImageUploadModal';
import EditCarModal from '../../components/EditCarModal';
import CarStatusModal from '../../components/CarStatusModal';
import DeleteCarModal from '../../components/DeleteCarModal';
import { useLang } from "../../providers";
import { texts } from "../../texts";
import EditImagesModal from '../../components/EditImagesModal';
import {  LineChart as LineChartIcon,BarChart } from 'lucide-react';
import { ScrollText, FileText, ShieldCheck } from 'lucide-react';


interface Car {
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
  status: 'available' | 'rented' | 'maintenance' | 'deleted'|'hidden';
  description?: string;
  image_url?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}



export default function ShopDashboard() {
  const router = useRouter();
  const { user, loading, isShop, logout, isCustomer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [cars, setCars] = useState<Car[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0);
  const { lang } = useLang();
  const t = texts[lang];

  // Modals state
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isEditCarModalOpen, setIsEditCarModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isEditImagesModalOpen, setIsEditImagesModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  const fetchCars = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await axios.get(`${apiUrl}/cars/shop/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      

      setCars(response.data.cars || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cars:', err);
      setError(err.response?.data?.message || 'Failed to fetch cars');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPendingNotificationsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${apiUrl}/shop/bookings/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.bookings) {
        setPendingNotificationsCount(response.data.bookings.length);
      }
    } catch (err) {
      console.error('Error fetching notifications count:', err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && isShop()) {
      fetchCars();
      fetchPendingNotificationsCount();
      const interval = setInterval(fetchPendingNotificationsCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isShop()) {
        if (isCustomer()) {
          router.replace('/customer/dashboard');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, loading, isShop, isCustomer, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.08),transparent_50%)]">
        <div className="text-center animate-pulse">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Modal handlers
  const handleAddCar = () => setIsAddCarModalOpen(true);

  const handleAddCarSuccess = (carId: number) => {
    setIsAddCarModalOpen(false);
    setSelectedCarId(carId);
    setIsImageUploadModalOpen(true);
  };

  const handleImageUploadSuccess = () => fetchCars();

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsEditCarModalOpen(true);
  };

  const handleEditCarSuccess = () => fetchCars();

  const handleManageStatus = (car: Car) => {
    setSelectedCar(car);
    setIsStatusModalOpen(true);
  };

  const handleStatusSuccess = () => fetchCars();

  const handleDeleteCar = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleManageImages = (car: Car) => {
  setSelectedCar(car);
  setIsEditImagesModalOpen(true);
};

const handleImagesUpdateSuccess = () => {
  fetchCars(); // เรียก fetchCars เพื่ออัปเดตข้อมูลล่าสุด
};

  const handleDeleteSuccess = () => fetchCars();

  const getCarTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      sedan: t.Addcar.Sedan,
      suv: t.Addcar.SUV,
      hatchback: t.Addcar.hatchback,
      pickup: t.Addcar.pickup,
      van: t.Addcar.van,
      luxury: t.Addcar.luxury,
      motorbike:t.Addcar.motorbike,
      
    };
    return typeMap[type] || type;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.08),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.08),transparent_50%)]">
        <div className="text-center animate-pulse">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isShop()) return null;

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Card (เรียบแบบอันแรก) */}
            <div className="bg-white/95 overflow-hidden shadow-md rounded-2xl mb-6 ring-1 ring-gray-100 backdrop-blur-sm">
              <div className="px-6 py-6 flex justify-between items-center">
                <div>
      
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.shopDashboard.title}</h1>
                  <p className="text-gray-600 mt-1">
                    {t.shopDashboard.welcome}, <span className="font-medium text-gray-800">{user.shop_name || user.username}</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddCar}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-700/90 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t.Review.addCar}
                  </button>

                  {/* ปุ่มจัดการบัญชีดำแบบเดียวกับอันแรก */}
                  <Link
                    href="/shop/dashboard/blacklist"
                    className="bg-red-600 hover:bg-red-700 active:bg-red-700/90 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t.Review.manageBlacklist}
                  </Link>

                  <Link
                    href="/shop/dashboard/policy"
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-700/90 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 flex items-center"
                  >
                    <ShieldCheck className="h-5 w-5 mr-2" aria-hidden="true" />
                    {t.Review.managepolicy}
                  </Link>
                </div>
              </div>
            </div>

            {/* Popular (เรียบแบบอันแรก) */}
            <div
              className="overflow-hidden shadow-md rounded-2xl mb-6 relative"
              style={{
                background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 50%,#1e40af 100%)'
              }}
            >
              <div className="px-6 py-5 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">{t.shopDashboard.popularTitle}</h2>
                <BarChart className="w-8 h-8  text-white mr-200" />
                <Link
                  href="/shop/dashboard/popular"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white/95 hover:text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                  aria-label="ไปหน้ารถที่นิยม"
                >
                  <span className="hidden sm:inline">{t.common.viewAll}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Notification แบบเรียบ */}
            {pendingNotificationsCount > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      {t.shopDashboard.pendingNotifications(pendingNotificationsCount)}
                      <Link href="/shop/notifications" className="font-medium text-yellow-800 underline underline-offset-2 ml-1 hover:text-yellow-700">
                        {t.common.viewNow}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Header ของ Grid */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-3xl font-bold mb-2">{t.shopDashboard.yourCars}</h3>
              <div className="text-sm text-gray-500">{cars.length > 0 && t.shopDashboard.itemsCount(cars.length)}</div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm" role="alert">
                <p className="font-semibold">{t.common.error}</p>
                <p>{error}</p>
              </div>
            )}

            {/* Cars */}
            {dataLoading ? (
              <div className="text-center py-12">
                <svg
                  className="animate-spin h-10 w-10 text-red-500 mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white overflow-hidden shadow-md rounded-2xl py-10 border border-gray-100">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <p className="mt-4 text-gray-600">คุณยังไม่มีรถยนต์ในระบบ</p>
                  <button
                    onClick={handleAddCar}
                    className="mt-6 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t.actions.addFirstCar}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cars
                 .filter((car) => car.status !== 'deleted')
                  .map((car) => (
                    <div key={car.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                      <div className="h-48 bg-gray-200 relative">
                        {car.image_url ? (
                          <img
                            src={`${baseUrl}${car.image_url}`}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex justify-center items-center h-full bg-gray-100 text-gray-400">
                            <svg
                              className="h-16 w-16 text-gray-300"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div
                          className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow ${
                          car.status === 'available'
                            ? 'bg-green-500 text-white'
                            : car.status === 'rented'
                            ? 'bg-blue-500 text-white'
                            : car.status === 'maintenance'
                            ? 'bg-yellow-500 text-white'
                            : car.status === 'hidden'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                        >
                          {car.status === 'available'
                            ? t.status.available
                            : car.status === 'rented'
                            ? t.status.rented
                            : car.status === 'maintenance'
                            ? t.status.maintenance
                            : car.status === 'hidden'
                            ? t.status.hidden
                            : t.status.unknown}
                        </div>

                        {/* Price */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white font-bold drop-shadow">
                            ฿{car.daily_rate.toLocaleString()}
                            <span className="text-sm font-normal">/{t.common.dayUnit}</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {car.brand} {car.model}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {getCarTypeDisplay(car.car_type)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          {t.common.year} {car.year} • {t.common.license} {car.license_plate}
                        </p>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCar(car)}
                            className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-700/90 text-white text-sm py-2 px-3 rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 flex items-center justify-center"
                            title={t.actions.editCar}
                            aria-label={t.actions.editCarAria}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            {t.actions.edit}
                          </button>

                          <button
                            onClick={() => handleManageImages(car)}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-700/90 text-white text-sm py-2 px-3 rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 flex items-center justify-center"
                            title={t.Home.image}
                            aria-label={ t.Home.image}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            { t.Home.image}
                          </button>

                          

                          {!car.image_url && (
                            <button
                              onClick={() => {
                                setSelectedCarId(car.id);
                                setIsImageUploadModalOpen(true);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-700/90 text-white text-sm py-2 px-3 rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 flex items-center justify-center"
                              title={t.actions.addImage}
                              aria-label={t.actions.addImageAria}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {t.actions.addImage}
                            </button>
                          )}

                          <button
                            onClick={() => handleManageStatus(car)}
                            className="flex-1 bg-gray-700 hover:bg-gray-800 active:bg-gray-800/90 text-white text-sm py-2 px-3 rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center justify-center"
                            title={t.actions.manageStatus}
                            aria-label={t.actions.manageStatusAria}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {t.actions.manageStatus}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
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

      {selectedCar && (
        <EditCarModal
          isOpen={isEditCarModalOpen}
          onClose={() => setIsEditCarModalOpen(false)}
          onSuccess={handleEditCarSuccess}
          car={selectedCar}
        />
      )}

      {selectedCar && (
        <CarStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={handleStatusSuccess}
          carId={selectedCar.id}
          currentStatus={selectedCar.status}
        />
      )}

      {selectedCar && (
        <DeleteCarModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
          carId={selectedCar.id}
          carName={`${selectedCar.brand} ${selectedCar.model}`}
        />
      )}

      {selectedCar && (
        <EditImagesModal
          isOpen={isEditImagesModalOpen}
          onClose={() => setIsEditImagesModalOpen(false)}
          onSuccess={handleImagesUpdateSuccess}
          car={selectedCar}
        />
      )}
    </div>
  );
}
