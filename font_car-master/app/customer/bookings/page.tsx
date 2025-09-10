// app/customer/bookings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { useLang } from "../../providers";
import { texts } from "../../texts";
import { Car, Calendar, MapPin, CreditCard, AlertCircle, CheckCircle, XCircle, Clock, User, ArrowLeft, Moon, Sun, Star } from 'lucide-react';
import ReviewModal from '../../components/ReviewModal';
import CustomerNav from '../../components/navcustomer';

interface Booking {
  id: number;
  car_id: number;
  shop_id: number;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  rental_status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'return_requested' | 'return_approved';
  payment_status: 'pending_verification' | 'paid' | 'refunded' | 'refund_pending' | 'failed';
  total_amount: number;
  created_at: string;

  // ข้อมูลเพิ่มเติมจาก join
  brand: string;
  model: string;
  year: number;
  image_url?: string;
  shop_name: string;
  shop_address?: string;
  has_review: number; // 0 = ยังไม่ได้รีวิว, 1 = รีวิวแล้ว
  // คำนวณเอง
  can_cancel: boolean;
  hours_since_creation: number;
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { user, loading, isCustomer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [bookingToReturn, setBookingToReturn] = useState<number | null>(null);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { lang, setLang } = useLang();
  const t = texts[lang];
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'history'>('all');

  const fetchBookings = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/rentals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // แปลงเวลาและเพิ่มฟิลด์เพื่อคำนวณว่าสามารถยกเลิกได้หรือไม่
      const processedBookings = response.data.rentals.map((booking: Booking) => {
      const createdAt = new Date(booking.created_at);
      const now = new Date();
      const hoursDiff = Math.abs(now.getTime() - createdAt.getTime()) / 36e5;

      const rentalStatus  = String(booking.rental_status).trim().toLowerCase();
      const paymentStatus = String(booking.payment_status).trim().toLowerCase();

      
        
        // ยกเลิกได้เมื่อยังไม่ได้ชำระเงิน และไม่ใช่สถานะที่เสร็จสิ้นแล้ว
       const can_cancel =
    rentalStatus === 'pending' &&
    (paymentStatus === 'pending_verification' || paymentStatus === 'failed');

  return {
    ...booking,
    rental_status: rentalStatus as Booking['rental_status'],
    payment_status: paymentStatus as Booking['payment_status'],
    can_cancel,
    hours_since_creation: Math.floor(hoursDiff),
  };
});
      
      setBookings(processedBookings);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setDataLoading(false);
    }
  };

  const confirmCancel = (bookingId: number) => {
    setBookingToCancel(bookingId);
  };

  const confirmReturn = (bookingId: number) => {
    setBookingToReturn(bookingId);
  };

  const openReviewModal = (booking: Booking) => {
    setBookingToReview(booking);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setBookingToReview(null);
  };

  const onReviewSuccess = () => {
    setReturnSuccess('ขอบคุณสำหรับรีวิว! รีวิวของคุณจะช่วยให้ลูกค้าคนอื่นตัดสินใจได้ดีขึ้น');
    setTimeout(() => {
      setReturnSuccess(null);
    }, 5000);
  };

  const cancelBooking = async (bookingId: number) => {
    try {
      setIsCancelling(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // อัปเดตสถานะการจองในรายการ
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, rental_status: 'cancelled', can_cancel: false } 
          : booking
      ));
      
      setCancelSuccess(`ยกเลิกการจองเรียบร้อยแล้ว`);
      setBookingToCancel(null);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setCancelSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const requestReturn = async (bookingId: number) => {
    try {
      setIsRequesting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${bookingId}/return`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // อัปเดตสถานะการจองในรายการ
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, rental_status: 'return_requested', can_cancel: false } 
          : booking
      ));
      
      setReturnSuccess(`ส่งคำขอคืนรถเรียบร้อยแล้ว กรุณารอการอนุมัติจากร้าน`);
      setBookingToReturn(null);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 5 วินาที
      setTimeout(() => {
        setReturnSuccess(null);
      }, 5000);
      
    } catch (err: any) {
      console.error('Error requesting return:', err);
      setError(err.response?.data?.message || 'Failed to request return');
    } finally {
      setIsRequesting(false);
    }
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter(booking => booking.rental_status === 'pending');
      case 'active':
        return bookings.filter(booking => 
          booking.rental_status === 'confirmed' || booking.rental_status === 'ongoing' || booking.rental_status === 'return_requested'
        );
      case 'history':
        return bookings.filter(booking => 
          booking.rental_status === 'completed' || booking.rental_status === 'cancelled' || booking.rental_status === 'return_approved'
        );
      default:
        return bookings;
    }
  };

  const getStatusText = (status: string, t: any) => {
  switch (status) {
    case 'pending':
      return t.Booking.status.pending;
    case 'confirmed':
      return t.Booking.status.confirmed;
    case 'ongoing':
      return t.Booking.status.ongoing;
    case 'completed':
      return t.Booking.status.completed;
    case 'cancelled':
      return t.Booking.status.cancelled;
    case 'return_requested':
      return t.Booking.status.return_requested;
    case 'return_approved':
      return t.Booking.status.return_approved;
    default:
      return status;
  }
};


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'ongoing':
        return <Car className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'return_requested':
        return <AlertCircle className="w-4 h-4" />;
      case 'return_approved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'return_requested':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'return_approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ป้องกันปัญหา Hydration Error
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ตรวจสอบการเข้าสู่ระบบและบทบาท
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isCustomer()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isCustomer, router]);

  // โหลดข้อมูลการจอง
  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchBookings();
    }
  }, [user, isMounted]);

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

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen transition-colors duration-300"
         style={{ backgroundColor: 'var(--background)' }}>
      
      {/* Navigation Header */}
      <CustomerNav reviewableRentals={[]} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300"
                 style={{ backgroundColor: 'var(--primary)' }}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold transition-colors duration-300"
                   style={{ color: 'var(--foreground)' }}>{t.Booking.title}</h1>
              <p className="text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>{t.Booking.subtitle}</p>
            </div>
          </div>
          
          {/* แสดงข้อความแจ้งเตือน */}
          {cancelSuccess && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--success)',
                   borderColor: 'var(--success)',
                   color: 'var(--success-foreground)'
                 }}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{cancelSuccess}</span>
              </div>
            </div>
          )}
          
          {returnSuccess && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--primary)',
                   borderColor: 'var(--primary)',
                   color: 'var(--primary-foreground)'
                 }}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{returnSuccess}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--destructive)',
                   borderColor: 'var(--destructive)',
                   color: 'var(--destructive-foreground)'
                 }}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b transition-colors duration-300"
               style={{ borderColor: 'var(--border)' }}>
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: t.Booking.tabs.all, count: bookings.length },
                      { key: 'pending', label: t.Booking.tabs.pending, count: bookings.filter(b => b.rental_status === 'pending').length },
                      { key: 'active', label: t.Booking.tabs.active, count: bookings.filter(b => ['confirmed', 'ongoing', 'return_requested'].includes(b.rental_status)).length },
                      { key: 'history', label: t.Booking.tabs.history, count: bookings.filter(b => ['completed', 'cancelled', 'return_approved'].includes(b.rental_status)).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 hover:scale-105 ${
                    activeTab === tab.key
                      ? 'border-b-2 font-semibold'
                      : 'border-transparent'
                  }`}
                  style={{
                    borderColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted-foreground)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span>{tab.label}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                          style={{
                            backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'var(--accent)',
                            color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--accent-foreground)'
                          }}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Bookings List */}
        {dataLoading ? (
          <div className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
               style={{
                 backgroundColor: 'var(--card)',
                 borderColor: 'var(--border)'
               }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-300"
                 style={{ borderColor: 'var(--primary)' }}></div>
            <p className="mt-4 text-lg"
              style={{ color: 'var(--muted-foreground)' }}>
              {t.Booking.loading}
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
               style={{
                 backgroundColor: 'var(--card)',
                 borderColor: 'var(--border)'
               }}>
            <Calendar className="mx-auto h-16 w-16 transition-colors duration-300 mb-4"
                     style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="text-lg font-medium"
                style={{ color: 'var(--foreground)' }}>
              {t.Booking.emptyTitle}
            </h3>
            <p className="text-sm"
              style={{ color: 'var(--muted-foreground)' }}>
              {t.Booking.emptySubtitle}
            </p>
            <Link href="/customer/dashboard">
              <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}>
                <Car className="w-4 h-4" />
                <span>{t.Booking.emptyButton}</span>
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} 
                   className="rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                   style={{
                     backgroundColor: 'var(--card)',
                     borderColor: 'var(--border)'
                   }}>
                <div className="p-6">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-300 ${getStatusClass(booking.rental_status)}`}>
                          {getStatusIcon(booking.rental_status)}
                          <span>{getStatusText(booking.rental_status, t)}</span>
                        </div>
                        {booking.can_cancel && (
                          <div className="text-xs transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                            ({t.Booking.p})
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 transition-colors duration-300"
                           style={{ color: 'var(--foreground)' }}>
                        {booking.brand} {booking.model} {t.Booking.year} {booking.year}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm transition-colors duration-300"
                              style={{ color: 'var(--muted-foreground)' }}>
                          {t.Login.shop} : {booking.shop_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm transition-colors duration-300"
                              style={{ color: 'var(--muted-foreground)' }}>
                          {t.Login.Reservewhen} : {new Date(booking.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-sm transition-colors duration-300"
                              style={{ color: 'var(--muted-foreground)' }}>
                          {t.Login.address} : {booking.shop_address}
                        </span>
                      </div>
                    </div>

                     
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col items-end">
                      <div className="text-2xl font-bold transition-colors duration-300"
                           style={{ color: 'var(--primary)' }}>
                        ฿{booking.total_amount.toLocaleString()}
                      </div>
                      <div className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>
                        {t.Booking.total}
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <div className="flex-1">
                          <div className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                            {t.Booking.date}
                          </div>
                          <div className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                            {new Date(booking.start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')} - {new Date(booking.end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <div className="flex-1">
                          <div className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                            {t.Booking.statuspay}
                          </div>
                          <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-300 ${
                            booking.payment_status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                            booking.payment_status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                            booking.payment_status === 'refunded' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            booking.payment_status === 'refund_pending' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {booking.payment_status === 'pending_verification' ? t.Booking.paymentStatus.pending_verification :
                              booking.payment_status === 'paid' ? t.Booking.paymentStatus.paid :
                              booking.payment_status === 'refunded' ? t.Booking.paymentStatus.refunded :
                              booking.payment_status === 'refund_pending' ? t.Booking.paymentStatus.refund_pending :
                              t.Booking.paymentStatus.failed}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {booking.pickup_location && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div className="flex-1">
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              {t.Booking.lo}
                            </div>
                            <div className="font-medium transition-colors duration-300"
                                 style={{ color: 'var(--foreground)' }}>
                              {booking.pickup_location}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {booking.return_location && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div className="flex-1">
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              {t.Booking.lo2}
                            </div>
                            <div className="font-medium transition-colors duration-300"
                                 style={{ color: 'var(--foreground)' }}>
                              {booking.return_location}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-3 pt-6 border-t transition-colors duration-300"
                       style={{ borderColor: 'var(--border)' }}>
                    <Link href={`/customer/cars/${booking.car_id}`}>
                      <button className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 border"
                              style={{
                                borderColor: 'var(--border)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--foreground)'
                              }}>
                        <Car className="w-4 h-4" />
                        <span>{t.Booking.buttons.viewCar}</span>
                      </button>
                    </Link>
                    
                    {/* ปุ่มชำระเงิน */}
                    
                    
                    {/* ปุ่มขอคืนรถ */}
                    {(booking.rental_status === 'confirmed' || booking.rental_status === 'ongoing') && 
                     booking.payment_status === 'paid' && (
                      <button
                        onClick={() => confirmReturn(booking.id)}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                        style={{
                          backgroundColor: 'var(--warning)',
                          color: 'var(--warning-foreground)'
                        }}
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{t.Booking.buttons.requestReturn}</span>
                      </button>
                    )}

                    {/* ปุ่มรีวิว */}
                    {booking.rental_status === 'return_approved' && booking.has_review === 0 && (
                      <button
                        onClick={() => openReviewModal(booking)}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground)'
                        }}
                      >
                        <Star className="w-4 h-4" />
                        <span>{t.Booking.buttons.review}</span>
                      </button>
                    )}

                    {/* ปุ่มยกเลิกการจอง */}
                    {booking.can_cancel && booking.rental_status === 'pending' && (
                      <button
                        onClick={() => confirmCancel(booking.id)}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                        style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t.Booking.buttons.cancelBooking}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modal ยืนยันการยกเลิก */}
        {bookingToCancel && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={() => setBookingToCancel(null)}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
                   style={{
                     backgroundColor: 'var(--card)',
                     borderColor: 'var(--border)'
                   }}
                   onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300"
                           style={{ backgroundColor: 'var(--destructive)' }}>
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold transition-colors duration-300 mb-2"
                           style={{ color: 'var(--foreground)' }}>
                        {t.Booking.cancelModal.title}
                      </h3>
                      <p className="text-sm transition-colors duration-300"
                         style={{ color: 'var(--muted-foreground)' }}>
                        {t.Booking.cancelModal.message}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 p-6 border-t transition-colors duration-300"
                     style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setBookingToCancel(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 border"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)'
                    }}
                  >
                    {t.Booking.cancelModal.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelBooking(bookingToCancel)}
                    disabled={isCancelling}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--destructive)',
                      color: 'var(--destructive-foreground)'
                    }}
                  >
                    {isCancelling ? t.Booking.cancelModal.confirming : t.Booking.cancelModal.confirm}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal ยืนยันการขอคืนรถ */}
        {bookingToReturn && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={() => setBookingToReturn(null)}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setBookingToReturn(null)}>
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
                   style={{
                     backgroundColor: 'var(--card)',
                     borderColor: 'var(--border)'
                   }}
                   onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300"
                           style={{ backgroundColor: 'var(--warning)' }}>
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold transition-colors duration-300 mb-2"
                           style={{ color: 'var(--foreground)' }}>
                        {t.Booking.returnModal.title}
                      </h3>
                      <p className="text-sm transition-colors duration-300"
                         style={{ color: 'var(--muted-foreground)' }}>
                        {t.Booking.returnModal.message}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 p-6 border-t transition-colors duration-300"
                     style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setBookingToReturn(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 border"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)'
                    }}
                  >
                    {t.Booking.returnModal.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestReturn(bookingToReturn)}
                    disabled={isRequesting}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--warning)',
                      color: 'var(--warning-foreground)'
                    }}
                  >
                    {isRequesting ? t.Booking.returnModal.confirming : t.Booking.returnModal.confirm}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Review Modal */}
        {showReviewModal && bookingToReview && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={closeReviewModal}
            rental={{
              rental_id: bookingToReview.id,
              car_name: `${bookingToReview.brand} ${bookingToReview.model} ปี ${bookingToReview.year}`,
              shop_name: bookingToReview.shop_name,
              start_date: bookingToReview.start_date,
              end_date: bookingToReview.end_date
            }}
            onSuccess={onReviewSuccess}
          />
        )}
      </div>
    </div>
  );
}