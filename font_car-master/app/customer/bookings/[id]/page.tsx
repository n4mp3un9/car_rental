// app/customer/bookings/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { useLang } from "../../../providers";
import { texts } from "../../../texts";
import CustomerNav from '../../../components/navcustomer';

interface Booking {
  id: number;
  car_id: number;
  shop_id: number;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  rental_status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  total_amount: number;
  created_at: string;
  brand: string;
  model: string;
  year: number;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  color: string;
  license_plate: string;
  image_url?: string;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
  can_cancel: boolean;
  hours_since_creation: number;
  days: number;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { lang } = useLang();
  const t = texts[lang];

  const fetchBookingDetail = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const bookingId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookingData = response.data.rental;
      const createdAt = new Date(bookingData.created_at);
      const now = new Date();
      const hoursDiff = Math.abs(now.getTime() - createdAt.getTime()) / 36e5;

      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      setBooking({
        ...bookingData,
        can_cancel: (bookingData.rental_status === 'pending' && hoursDiff <= 2),
        hours_since_creation: Math.floor(hoursDiff),
        days
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.message || 'Failed to fetch booking details');
    } finally {
      setDataLoading(false);
    }
  };

  const cancelBooking = async () => {
    try {
      setIsCancelling(true);
      const token = localStorage.getItem('token');
      if (!token || !booking) throw new Error('Not authenticated or booking not found');

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${booking.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBooking({
        ...booking,
        rental_status: 'cancelled',
        can_cancel: false
      });

      setShowCancelConfirm(false);
      setCancelSuccess(true);

      setTimeout(() => {
        router.push('/customer/bookings');
      }, 3000);
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t.CustomerDashboard.rentalStatus.pending;
      case 'confirmed':
        return t.CustomerDashboard.rentalStatus.approved;
      case 'ongoing':
        return t.CustomerDashboard.rentalStatus.ongoing;
      case 'completed':
        return t.CustomerDashboard.rentalStatus.completed;
      case 'cancelled':
        return t.CustomerDashboard.rentalStatus.cancelled;
      default:
        return status;
    }
  };

  // ใช้ชิปสถานะโทนเดียวกับระบบตัวแปร
  const getStatusStyle = (status: string) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    const styleMap: Record<string, React.CSSProperties> = {
      pending: {
        backgroundColor: 'color-mix(in oklab, var(--primary) 12%, transparent)',
        color: 'var(--primary)',
        border: '1px solid color-mix(in oklab, var(--primary) 35%, transparent)'
      },
      confirmed: {
        backgroundColor: 'color-mix(in oklab, var(--foreground) 10%, transparent)',
        color: 'var(--foreground)',
        border: '1px solid color-mix(in oklab, var(--foreground) 25%, transparent)'
      },
      ongoing: {
        backgroundColor: 'color-mix(in oklab, var(--primary) 18%, transparent)',
        color: 'var(--foreground)',
        border: '1px solid color-mix(in oklab, var(--primary) 40%, transparent)'
      },
      completed: {
        backgroundColor: 'color-mix(in oklab, var(--success) 12%, transparent)',
        color: 'var(--success)',
        border: '1px solid color-mix(in oklab, var(--success) 35%, transparent)'
      },
      cancelled: {
        backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
        color: 'var(--destructive)',
        border: '1px solid color-mix(in oklab, var(--destructive) 35%, transparent)'
      }
    };
    return { className: base, style: styleMap[status] ?? { backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' } };
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอชำระเงิน';
      case 'paid': return 'ชำระเงินแล้ว';
      case 'refunded': return 'คืนเงินแล้ว';
      case 'failed': return 'การชำระเงินล้มเหลว';
      default: return status;
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
      fetchBookingDetail();
    }
  }, [user, params.id, isMounted]);

  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

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
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <CustomerNav reviewableRentals={[]} />

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-4">
            <Link href="/customer/bookings">
              <span className="flex items-center text-sm font-medium" style={{ color: 'var(--primary)' }}>
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                {t.customerpay?.back ?? 'กลับไปหน้ารายการจอง'}
              </span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold leading-tight mb-6" style={{ color: 'var(--foreground)' }}>
            {t.CustomerDashboard.subtitle}
          </h1>

          {/* Alerts */}
          {cancelSuccess && (
            <div
              className="mb-4 px-4 py-3 rounded border"
              style={{
                backgroundColor: 'color-mix(in oklab, var(--success) 12%, transparent)',
                borderColor: 'var(--success)',
                color: 'var(--success)'
              }}
              role="alert"
            >
              <p className="font-bold">ยกเลิกการจองเรียบร้อยแล้ว!</p>
              <p>ระบบกำลังนำคุณกลับไปยังหน้ารายการจอง...</p>
            </div>
          )}

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded border"
              style={{
                backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                borderColor: 'var(--destructive)',
                color: 'var(--destructive)'
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-8">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}
                aria-hidden="true"
              />
              <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : booking ? (
            <div
              className="overflow-hidden rounded-lg shadow border"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {/* Header */}
              <div className="px-4 py-5 sm:px-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-start flex-col md:flex-row gap-3">
                  <div>
                    <h2 className="text-lg leading-6 font-medium" style={{ color: 'var(--foreground)' }}>
                      {t.CustomerDashboard.ssubtitle} #{booking.id}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t.CustomerDashboard.day}: {new Date(booking.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                    </p>
                  </div>
                  <div {...getStatusStyle(booking.rental_status)}>
                    {getStatusText(booking.rental_status)} 
                    {booking.can_cancel && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                       {t.CustomerDashboard.oo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Car section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="md:col-span-1">
                  <div className="h-48 md:h-64 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                    {booking.image_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${booking.image_url}`}
                        alt={`${booking.brand} ${booking.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full" style={{ color: 'var(--muted-foreground)' }}>
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-xl font-medium" style={{ color: 'var(--foreground)' }}>
                    {booking.brand} {booking.model} ปี {booking.year}
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.ta}: {booking.license_plate}</p>

                  <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.type}:</span> {booking.car_type}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.color}:</span> {booking.color}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.seats}:</span> {booking.seats} {t.CustomerDashboard.seats}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.gear}:</span>{' '}
                      {booking.transmission === 'auto' ? t.CustomerDashboard.transmission.auto : t.CustomerDashboard.transmission.manual}
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.f}:</span>{' '}
                      {booking.fuel_type === 'gasoline'
                        ? t.CustomerDashboard.fuel.gasoline
                        : booking.fuel_type === 'diesel'
                        ? t.CustomerDashboard.fuel.diesel
                        : booking.fuel_type === 'hybrid'
                        ? t.CustomerDashboard.fuel.hybrid
                        : t.CustomerDashboard.fuel.electric}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link href={`/customer/cars/${booking.car_id}`}>
                      <button
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--card)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {t.customersearch.looks}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Booking info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--foreground)' }}>{t.CustomerDashboard.subtitle}</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.start}:</div>
                      <div>{new Date(booking.start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</div>
                    </div>
                    <div className="flex">
                      <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.end}:</div>
                      <div>{new Date(booking.end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</div>
                    </div>
                    <div className="flex">
                      <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.day2}:</div>
                      <div>{booking.days} {t.CustomerDashboard.wan}</div>
                    </div>
                    {booking.pickup_location && (
                      <div className="flex">
                          <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.locationone}:</div>
                        <div>{booking.pickup_location}</div>
                      </div>
                    )}
                    {booking.return_location && (
                      <div className="flex">
                        <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.location}:</div>
                        <div>{booking.return_location}</div>
                      </div>
                    )}
                    <div className="flex">
                      <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.sta}:</div>
                      <div>{getPaymentStatusText(booking.payment_status)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--foreground)' }}>{t.CustomerDashboard.dd}</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.shop}:</div>
                      <div>{booking.shop_name}</div>
                    </div>
                    {booking.shop_phone && (
                      <div className="flex">
                        <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.tel}:</div>
                        <div>{booking.shop_phone}</div>
                      </div>
                    )}
                    {booking.shop_address && (
                      <div className="flex">
                        <div className="w-40" style={{ color: 'var(--muted-foreground)' }}>{t.CustomerDashboard.address}:</div>
                        <div>{booking.shop_address}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link href={`/customer/shops/${booking.shop_id}`}>
                      <span className="text-sm" style={{ color: 'var(--primary)' }}>
                        {t.CustomerDashboard.look}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Cost summary */}
              <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--foreground)' }}>{t.CustomerDashboard.saru}</h3>

                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--muted)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      {t.CustomerDashboard.total} {Math.round(booking.total_amount / booking.days).toLocaleString()} {t.CustomerDashboard.b} × {booking.days} {t.CustomerDashboard.wan}
                    </span>
                    <span style={{ color: 'var(--foreground)' }}>{booking.total_amount.toLocaleString()} {t.CustomerDashboard.b}</span>
                  </div>

                  <div
                    className="pt-2 mt-2 flex justify-between items-center font-bold border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span>{t.CustomerDashboard.ru}</span>
                    <span className="text-xl" style={{ color: 'var(--primary)' }}>
                      {booking.total_amount.toLocaleString()} {t.CustomerDashboard.b}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex justify-end gap-3">
                <Link href="/customer/bookings">
                  <button
                    className="px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    {t.CustomerDashboard.i}
                  </button>
                </Link>

                {booking.can_cancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-4 py-2 rounded-md text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--destructive)',
                      color: 'var(--primary-foreground, #fff)',
                      border: '1px solid transparent'
                    }}
                  >
                    {t.CustomerDashboard.cc}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg shadow p-6 text-center border"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                   style={{ color: 'var(--muted-foreground)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3 className="mt-2 text-lg font-medium">ไม่พบข้อมูลการจอง</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้
              </p>
              <div className="mt-6">
                <Link href="/customer/dashboard">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)', border: '1px solid transparent' }}
                  >
                    กลับไปยังหน้าหลัก
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Cancel modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-[100] overflow-y-auto">
              <div className="fixed inset-0 bg-black/50 z-[90]" aria-hidden="true"></div>

              <div className="relative z-[100] flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                  className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div
                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10"
                        style={{ backgroundColor: 'color-mix(in oklab, var(--destructive) 18%, transparent)' }}
                      >
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" aria-hidden="true" style={{ color: 'var(--destructive)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium">{t.CustomerDashboard.ccc}</h3>
                        <div className="mt-2">
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {t.CustomerDashboard.love}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse" style={{ backgroundColor: 'var(--muted)' }}>
                    <button
                      type="button"
                      onClick={cancelBooking}
                      disabled={isCancelling}
                      className="w-full inline-flex justify-center rounded-md px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      style={{ backgroundColor: 'var(--destructive)', color: 'var(--primary-foreground, #fff)', border: '1px solid transparent' }}
                    >
                      {isCancelling ? 'กำลังยกเลิก...' : t.CustomerDashboard.ccc}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                    >
                      {t.Addcar.cancel}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
