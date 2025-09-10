// app/customer/cars/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import ReviewsSection from '../../../components/ReviewsSection';
import { Car, User, LogOut, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useLang } from "../../../providers";
import { texts } from "../../../texts";

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
  insurance_rate: number;
  description?: string;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  shop_id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  promptpay_id?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

interface BookingForm {
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
}

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [shopPolicy, setShopPolicy] = useState<string>('');
  const [shopPolicyLoading, setShopPolicyLoading] = useState(false);
  const [shopPolicyError, setShopPolicyError] = useState<string | null>(null);

  const [car, setCar] = useState<Car | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    start_date: '',
    end_date: '',
    pickup_location: '',
    return_location: ''
  });
  const [days, setDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [showPolicy, setShowPolicy] = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [isConfirmingPolicy, setIsConfirmingPolicy] = useState(false);
  const { lang } = useLang();
  const t = texts[lang];

  // คำนวณจำนวนวันและราคารวม
  useEffect(() => {
    if (bookingForm.start_date && bookingForm.end_date && car) {
      const start = new Date(bookingForm.start_date);
      const end = new Date(bookingForm.end_date);
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (diffDays > 0) {
        setDays(diffDays);
        const dailyRate = typeof car.daily_rate === 'number' ? car.daily_rate : parseFloat(car.daily_rate as unknown as string) || 0;
        const insuranceRate = typeof car.insurance_rate === 'number' ? car.insurance_rate : parseFloat(car.insurance_rate as unknown as string) || 0;
        const total = (diffDays * dailyRate) + insuranceRate;
        setTotalPrice(isNaN(total) ? 0 : total);
      } else {
        setDays(0);
        setTotalPrice(0);
      }
    }
  }, [bookingForm.start_date, bookingForm.end_date, car]);

  const fetchShopPolicy = async (shopId: number) => {
  try {
    setShopPolicyLoading(true);
    setShopPolicyError(null);
    const token = localStorage.getItem('token');

    
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/policy`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );

    const p =
      typeof res.data?.policy === 'string'
        ? res.data.policy
        : typeof res.data?.shop?.policy === 'string'
        ? res.data.shop.policy
        : '';

    setShopPolicy(p || '');
  } catch (e: any) {
    console.error('fetchShopPolicy error:', e);
    setShopPolicy('');
    setShopPolicyError(e?.response?.data?.message || 'ไม่พบนโยบายร้าน');
  } finally {
    setShopPolicyLoading(false);
  }
};

  const fetchCarDetail = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const carId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/customer`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCar(response.data.car);
      if (response.data.car.image_url) {
        setActiveImage(response.data.car.image_url);
      } else if (response.data.car.images && response.data.car.images.length > 0) {
        setActiveImage(response.data.car.images[0].image_url);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching car details:', err);
      setError('ไม่สามารถดึงข้อมูลรถยนต์ได้ โปรดลองใหม่อีกครั้ง');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingForm.start_date || !bookingForm.end_date) {
      setBookingError('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'); return;
    }
    const start = new Date(bookingForm.start_date);
    const end = new Date(bookingForm.end_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (start < today) { setBookingError('วันที่เริ่มต้นต้องไม่เป็นวันที่ผ่านมาแล้ว'); return; }
    if (end <= start) { setBookingError('วันที่สิ้นสุดต้องเป็นวันหลังจากวันที่เริ่มต้น'); return; }
    if (isNaN(totalPrice) || totalPrice <= 0) { setBookingError('ไม่สามารถคำนวณราคารวมได้ โปรดตรวจสอบวันที่อีกครั้ง'); return; }

    try {
      setIsSubmitting(true);
      setBookingError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const carIdNum = Number(params.id);
      const bookingData: Record<string, any> = {
        car_id: carIdNum,
        shop_id: car?.shop_id,
        start_date: bookingForm.start_date,
        end_date: bookingForm.end_date,
        total_amount: Number(totalPrice),
      };
      if (bookingForm.pickup_location) bookingData.pickup_location = bookingForm.pickup_location;
      if (bookingForm.return_location) bookingData.return_location = bookingForm.return_location;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/cars/${carIdNum}/book`,
        bookingData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      setBookingSuccess(true);
      setBookingForm({ start_date: '', end_date: '', pickup_location: '', return_location: '' });

      if (response.data?.redirect_to_payment && response.data?.payment_url) {
        setTimeout(() => router.push(response.data.payment_url), 800);
      } else {
        setTimeout(() => router.push('/customer/bookings'), 800);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        (data && (data.message || data.error || data.msg)) ||
        (typeof data === 'string' ? data : '') ||
        'Failed to book the car';
      setBookingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
    if (!bookingForm.start_date || !bookingForm.end_date) { setBookingError('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด'); return; }

    const start = new Date(bookingForm.start_date);
    const end = new Date(bookingForm.end_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (start < today) { setBookingError('วันที่เริ่มต้นต้องไม่เป็นวันที่ผ่านมาแล้ว'); return; }
    if (end <= start) { setBookingError('วันที่สิ้นสุดต้องเป็นวันหลังจากวันที่เริ่มต้น'); return; }
    if (isNaN(totalPrice) || totalPrice <= 0) { setBookingError('ไม่สามารถคำนวณราคารวมได้ โปรดตรวจสอบวันที่อีกครั้ง'); return; }

    if (!shopPolicy?.trim() && car?.shop_id) {
    await fetchShopPolicy(car.shop_id);
  }

  setAgreePolicy(false);
  setShowPolicy(true);
};

  const confirmPolicyAndBook = async () => {
    if (!agreePolicy) return;
    setIsConfirmingPolicy(true);
    try {
      setShowPolicy(false);
      const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
      await handleBooking(fakeEvent);
    } finally {
      setIsConfirmingPolicy(false);
    }
  };

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!isCustomer()) router.replace('/dashboard');
    }
  }, [user, loading, isCustomer, router]);

  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchCarDetail();
    }
  }, [user, params.id, isMounted]);

  if (!isMounted) return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;

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
    <div className="min-h-screen transition-colors duration-300"
         style={{ backgroundColor: 'var(--background)' }}>
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
           style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300"
                    style={{ color: 'var(--foreground)' }}>
                  {t.CustomerDashboard.title}
                </h1>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/customer/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  {t.CustomerDashboard.frist}
                </Link>
                <Link
                  href="/customer/bookings"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  {t.CustomerDashboard.bookings}
                </Link>
                <Link
                  href="/customer/profile"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  {t.CustomerDashboard.profile}
                </Link>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium transition-colors duration-300"
                     style={{ color: 'var(--foreground)' }}>
                    {user?.username || 'ผู้ใช้'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground, #fff)' }}
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ลิงก์ย้อนกลับ */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ color: 'var(--primary)', backgroundColor: 'var(--muted)' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.CustomerDashboard.back}
            </button>
          </div>

          {/* แสดงข้อผิดพลาด */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded border"
                 style={{ backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)', borderColor: 'var(--destructive)', color: 'var(--destructive)' }}>
              {error}
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-8">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}
              />
              <p className="mt-2 transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                กำลังโหลดข้อมูล...
              </p>
            </div>
          ) : car ? (
            <div className="shadow-lg overflow-hidden rounded-xl border transition-all duration-300"
                 style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                {/* ส่วนแสดงรูปภาพ */}
                <div>
                  <div className="h-64 md:h-80 rounded-lg overflow-hidden mb-4"
                       style={{ backgroundColor: 'var(--muted)' }}>
                    {activeImage ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${activeImage}`}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full"
                           style={{ color: 'var(--muted-foreground)' }}>
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>

                  {/* รูปภาพขนาดเล็ก */}
                  {car.images && car.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {car.images.map((image) => (
                        <button
                          key={image.id}
                          className="h-16 rounded overflow-hidden"
                          style={{
                            backgroundColor: 'var(--muted)',
                            outline: activeImage === image.image_url ? '2px solid var(--primary)' : 'none'
                          }}
                          onClick={() => setActiveImage(image.image_url)}
                          aria-label="ภาพรถเพิ่มเติม"
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${image.image_url}`}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ส่วนแสดงข้อมูลรถยนต์ */}
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    {car.brand} {car.model}
                  </h1>

                  {/* Badge “พร้อมให้บริการ” */}
                  <div
                    className="inline-block px-2 py-1 rounded text-sm mb-4"
                    style={{
                      backgroundColor: 'color-mix(in oklab, var(--success) 15%, transparent)',
                      color: 'var(--success)'
                    }}
                  >
                    {t.CustomerDashboard.Ready}
                  </div>

                  <div className="text-3xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
                    ฿{car.daily_rate.toLocaleString()}
                    <span className="text-lg font-normal ml-2" style={{ color: 'var(--muted-foreground)' }}>
                      {t.CustomerDashboard.pricePerDay}
                    </span>
                  </div>

                  {/* ราคาประกันครั้งเดียว */}
                  {car.insurance_rate > 0 && (
                    <div className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>
                      {t.CustomerDashboard.Insurance} : ฿{car.insurance_rate.toLocaleString()}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-y-3 text-sm mb-6" style={{ color: 'var(--foreground)' }}>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.carDetails} :</span> {car.year}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.color} :</span> {car.color}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.type} :</span> {car.car_type}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.seats} :</span> {car.seats} {t.customersearch.seats}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.gear} : </span>{' '}
                      {car.transmission === 'auto' ? t.customersearch.g2 : t.customersearch.g1 }
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.f} : </span>{' '}
                      {car.fuel_type === 'gasoline'
                        ? t.customersearch.gasoline
                        : car.fuel_type === 'diesel'
                        ? t.customersearch.diesel
                        : car.fuel_type === 'hybrid'
                        ? t.customersearch.hybrid
                        : t.customersearch.electric}
                    </div>
                  </div>

                  {car.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        {t.CustomerDashboard.details}
                      </h3>
                      <p style={{ color: 'var(--muted-foreground)' }}>{car.description}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg mb-6"
                       style={{ backgroundColor: 'var(--muted)' }}>
                    <h3 className="text-lg font-medium mb-2"
                        style={{ color: 'var(--foreground)' }}>{t.Login.address}</h3>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>{car.shop_name}</p>
                    {car.shop_phone && (
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.tel} :</span> {car.shop_phone}
                      </p>
                    )}
                    {car.shop_address && (
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.address} :</span> {car.shop_address}
                      </p>
                    )}
                    {car.promptpay_id && (
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.pp} :</span> {car.promptpay_id}
                      </p>
                    )}
                    <div className="mt-2">
                      <Link href={`/customer/shops/${car.shop_id}`}>
                        <span className="text-sm" style={{ color: 'var(--primary)' }}>
                          {t.CustomerDashboard.look}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนจองรถยนต์ */}
              <div className="px-6 py-8 border-t" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
                  {t.CustomerDashboard.Reserve}
                </h2>

                {bookingSuccess ? (
                  <div className="px-4 py-3 rounded border mb-4"
                       style={{
                         backgroundColor: 'color-mix(in oklab, var(--success) 12%, transparent)',
                         borderColor: 'var(--success)',
                         color: 'var(--success)'
                       }}>
                    <p className="font-bold">{t.CustomerDashboard.aa}</p>
                    <p>{t.CustomerDashboard.bb}</p>
                  </div>
                ) : car?.status !== 'available' ? (
                  <div className="px-4 py-3 rounded border"
                       style={{
                         backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                         borderColor: 'var(--destructive)',
                         color: 'var(--destructive)'
                       }}>
                    <p className="font-bold">
                      {car?.status === 'rented' ? t.CustomerDashboard.titles:
                       car?.status === 'maintenance' ? 'รถคันนี้อยู่ระหว่างซ่อมบำรุง' :
                       'รถคันนี้ไม่พร้อมให้บริการ'}
                    </p>
                    <p>{t.CustomerDashboard.subtitles}</p>
                  </div>
                ) : (
                  <form onSubmit={handlePreSubmit}>
                    {bookingError && (
                      <div className="px-4 py-3 rounded border mb-4"
                           style={{
                             backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                             borderColor: 'var(--destructive)',
                             color: 'var(--destructive)'
                           }}>
                        {bookingError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                          {t.CustomerDashboard.start} <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                        <input
                          id="start_date"
                          name="start_date"
                          type="date"
                          required
                          className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          value={bookingForm.start_date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                          {t.CustomerDashboard.end} <span style={{ color: 'var(--destructive)' }}>*</span>
                        </label>
                        <input
                          id="end_date"
                          name="end_date"
                          type="date"
                          required
                          className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          value={bookingForm.end_date}
                          onChange={handleInputChange}
                          min={bookingForm.start_date || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label htmlFor="pickup_location" className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                          {t.CustomerDashboard.locationone}
                        </label>
                        <input
                          id="pickup_location"
                          name="pickup_location"
                          type="text"
                          className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          value={bookingForm.pickup_location}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="return_location" className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                          {t.CustomerDashboard.location}
                        </label>
                        <input
                          id="return_location"
                          name="return_location"
                          type="text"
                          className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          value={bookingForm.return_location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {days > 0 && (
                      <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex justify-between items-center mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          <span>
                            {t.CustomerDashboard.price} {car.daily_rate.toLocaleString()} {t.CustomerDashboard.thb} × {days} {t.CustomerDashboard.pricePerDay}
                          </span>
                          <span style={{ color: 'var(--foreground)' }}>
                            {(car.daily_rate * days).toLocaleString()} {t.CustomerDashboard.thb}
                          </span>
                        </div>

                        {car.insurance_rate > 0 && (
                          <div className="flex justify-between items-center mb-2" style={{ color: 'var(--muted-foreground)' }}>
                            <span>{t.CustomerDashboard.Insurance} ({t.CustomerDashboard.Insuranceone})</span>
                            <span style={{ color: 'var(--foreground)' }}>{car.insurance_rate.toLocaleString()} {t.CustomerDashboard.thb}</span>
                          </div>
                        )}

                        <div className="pt-2 flex justify-between items-center font-bold"
                             style={{ borderTop: '1px solid var(--border)', color: 'var(--foreground)' }}>
                          <span>{t.Booking.total}</span>
                          <span className="text-xl" style={{ color: 'var(--primary)' }}>
                            {totalPrice.toLocaleString()} {t.CustomerDashboard.thb}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || days <= 0}
                        className="inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md focus:outline-none disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground, #fff)',
                          borderColor: 'transparent'
                        }}
                      >
                        {isSubmitting ? 'กำลังดำเนินการ...' : t.CustomerDashboard.Reserve}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg shadow p-6 text-center"
                 style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
              <p>ไม่พบข้อมูลรถยนต์ หรือรถคันนี้อาจไม่พร้อมให้เช่า</p>
            </div>
          )}

          {/* Modal อ่านนโยบายก่อนจอง/ชำระเงิน */}
          {showPolicy && (
            <div className="fixed inset-0 z-[100] overflow-y-auto">
              {/* Overlay */}
              <div className="fixed inset-0 z-[90]" style={{ backgroundColor: 'color-mix(in oklab, black 50%, transparent)' }} aria-hidden="true"></div>

              <div className="relative z-[100] flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
                     style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                  <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div
                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
                        style={{ backgroundColor: 'color-mix(in oklab, var(--primary) 15%, transparent)' }}
                      >
                        {/* info icon */}
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg"
                             viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             style={{ color: 'var(--primary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
                        </svg>
                      </div>

                      <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium" style={{ color: 'var(--foreground)' }}>
                          {t.nayobuy.title}
                        </h3>

                        <div className="mt-3">
  <div
    className="max-h-64 overflow-y-auto rounded p-3 text-sm space-y-2"
    style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
  >
    {shopPolicyLoading ? (
      <p>กำลังโหลดนโยบาย...</p>
    ) : shopPolicyError ? (
      <p className="text-red-500">{shopPolicyError}</p>
    ) : shopPolicy?.trim() ? (
      <div className="whitespace-pre-line">{shopPolicy}</div>
    ) : (
      <p className="text-sm">ร้านนี้ยังไม่นำนโยบายขึ้นระบบ</p>
    )}
  </div>

  {/* ให้ติ๊กยอมรับเฉพาะเมื่อมีนโยบายจริง */}
  {shopPolicy?.trim() && (
    <label className="mt-3 flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
      <input
        type="checkbox"
        className="mt-1"
        checked={agreePolicy}
        onChange={(e) => setAgreePolicy(e.target.checked)}
      />
      <span>{t.nayobuy.subtitle}</span>
    </label>
  )}
</div>

                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
                       style={{ backgroundColor: 'var(--muted)' }}>
                    <button
                      type="button"
                      onClick={confirmPolicyAndBook}
                      disabled={!agreePolicy || isConfirmingPolicy}
                      className="w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 font-medium sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground, #fff)',
                        borderColor: 'transparent'
                      }}
                    >
                      {isConfirmingPolicy ? 'กำลังยืนยัน...' :t.nayobuy.cc}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPolicy(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      style={{
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      {t.nayobuy.close}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ส่วนรีวิว */}
          {car && (
            <div className="mt-8">
              <ReviewsSection carId={car.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
