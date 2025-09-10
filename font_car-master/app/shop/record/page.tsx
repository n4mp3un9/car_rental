"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import { useLang } from "../../providers";
import { texts } from "../../texts";

// Define interfaces for type safety
interface Rental {
  id: number;
  car_id: number;
  customer_id: number;
  shop_id: number;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  rental_status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  insurance_rate: number;
  created_at: string;
  updated_at: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  color: string;
  image_url: string;
  customer_username: string;
  customer_email: string;
  customer_phone: string;
  shop_name: string;
  latest_payment_id?: number;
  latest_payment_amount?: number;
  latest_payment_method?: string;
  latest_payment_status?: string;
  latest_payment_date?: string;
  latest_payment_proof?: string;
}

interface ApiResponse {
  total: number;
  page: number;
  page_size: number;
  items: Rental[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

const buildImgSrc = (url?: string) => {
  if (!url) return '/placeholder.png';
  return url.startsWith('http') ? url : `${baseUrl}${url}`;
};
const toDateOnly = (isoOrDateStr: string) => {
  const d = new Date(isoOrDateStr);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

// ==== Grouping maps (คงไว้ระดับไฟล์ได้) ====
type RentalGroupKey = 'pending' | 'active' | 'returning' | 'approved' | 'done' | 'issue';
type PaymentGroupKey = 'pending' | 'paid' | 'refunded' | 'issue';

const RENTAL_GROUP_OF: Record<string, RentalGroupKey> = {
  pending: 'pending',
  confirmed: 'active',
  ongoing: 'active',
  return_requested: 'returning',
  return_approved: 'approved',
  completed: 'done',
  cancelled: 'issue',
};

const RENTAL_GROUP_TO_STATUSES: Record<RentalGroupKey, string[]> = {
  pending: ['pending'],
  active: ['confirmed', 'ongoing'],
  returning: ['return_requested'],
  approved: ['return_approved'],
  done: ['completed'],
  issue: ['cancelled'],
};

const PAYMENT_GROUP_OF: Record<string, PaymentGroupKey> = {
  pending: 'pending',
  pending_verification: 'pending',
  paid: 'paid',
  refunded: 'refunded',
  rejected: 'issue',
  failed: 'issue',
};

const PAYMENT_GROUP_TO_STATUSES: Record<PaymentGroupKey, string[]> = {
  pending: ['pending', 'pending_verification'],
  paid: ['paid'],
  refunded: ['refunded'],
  issue: ['rejected', 'failed'],
};

const RentalHistoryPage = () => {
  const router = useRouter();
  const { lang } = useLang();
  const t = texts[lang];
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  // ===== ใช้ useMemo สร้าง META ที่ผูกกับ t (ทำให้แปลได้) =====
  const RENTAL_GROUP_META = useMemo(() => ({
    pending:   { label: t.record.a, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800' },
    active:    { label: t.record.b, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800' },
    returning: { label: t.record.c, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800' },
    approved:  { label: t.record.d, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800' },
    done:      { label: t.record.e, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800' },
    issue:     { label: t.record.f, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800' },
  }), [t.record]);

  const PAYMENT_GROUP_META = useMemo(() => ({
    pending:  { label: t.record.g, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800' },
    paid:     { label: t.record.h, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' },
    refunded: { label: t.record.i, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800' },
    issue:    { label: t.record.j, badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800' },
  }), [t.record]);

  // ===== Helpers ที่อ้าง META ภายในคอมโพเนนต์ =====
  const rentalBadgeClass = (status: string) => {
    const group = RENTAL_GROUP_OF[status] ?? 'issue';
    return RENTAL_GROUP_META[group].badge;
  };
  const rentalLabel = (status: string) => {
    const group = RENTAL_GROUP_OF[status] ?? 'issue';
    return RENTAL_GROUP_META[group].label;
  };
  const paymentBadgeClass = (status: string) => {
    const group = PAYMENT_GROUP_OF[status] ?? 'issue';
    return PAYMENT_GROUP_META[group].badge;
  };
  const paymentLabel = (status: string) => {
    const group = PAYMENT_GROUP_OF[status] ?? 'issue';
    return PAYMENT_GROUP_META[group].label;
  };

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    rental_group: '',
    payment_group: '',
    start_date: '',
    end_date: '',
    q: '',
    order: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qInput, setQInput] = useState('');

  // Debounced search handler
  const debouncedHandleSearch = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, q: value }));
      setPage(1);
    }, 500),
    []
  );

  useEffect(() => () => debouncedHandleSearch.cancel(), [debouncedHandleSearch]);

  const handleSearchInputChange = (value: string) => {
    setQInput(value);
    debouncedHandleSearch(value);
  };
  const searchNow = () => {
    setFilters((prev) => ({ ...prev, q: qInput }));
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      rental_group: '',
      payment_group: '',
      start_date: '',
      end_date: '',
      q: '',
      order: 'desc',
    });
    setQInput('');
    setPage(1);
  };

  // ==== ดึงข้อมูล + กรองแบบ "ตรงวัน" ฝั่ง client ====
  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found, please login');

      const response = await axios.get<ApiResponse>(`${apiUrl}/cars/rentals/history`, {
        params: {
          page,
          page_size: pageSize,
          q: filters.q || undefined,
          order: filters.order,
          rental_status_in: filters.rental_group
            ? RENTAL_GROUP_TO_STATUSES[filters.rental_group as RentalGroupKey]?.join(',')
            : undefined,
          payment_status_in: filters.payment_group
            ? PAYMENT_GROUP_TO_STATUSES[filters.payment_group as PaymentGroupKey]?.join(',')
            : undefined,
          start_date_eq: filters.start_date || undefined,
          end_date_eq: filters.end_date || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const items = response.data.items ?? [];
      const hasExactStart = !!filters.start_date;
      const hasExactEnd = !!filters.end_date;

      const filtered = items.filter((r) => {
        const startOk = hasExactStart ? toDateOnly(r.start_date) === filters.start_date : true;
        const endOk   = hasExactEnd   ? toDateOnly(r.end_date)   === filters.end_date   : true;
        return startOk && endOk;
      });

      const useFiltered = hasExactStart || hasExactEnd;
      setRentals(useFiltered ? filtered : items);
      setTotal(useFiltered ? filtered.length : response.data.total);
    } catch (error: any) {
      console.error('Error fetching rentals:', error);
      setError(error.response?.data?.message || 'ไม่สามารถดึงข้อมูลการเช่ารถได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filters]);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>{t.record.record}</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>{t.record.car}</p>
        </div>

        {/* Filter Section (ปรับกรอบ/พื้นหลังให้เหมือนหน้าโปรไฟล์) */}
        <div
          className="rounded-xl shadow-lg border p-6 mb-6 transition-colors duration-300"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.record.re}</h2>
            {(filters.rental_group || filters.payment_group || filters.start_date || filters.end_date || filters.q) && (
              <button
                onClick={clearFilters}
                className="text-sm transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                {t.record.search}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md shadow-sm transition-all"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)'
                  }}
                  value={qInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchNow(); }}
                  placeholder={t.record.tt}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                {t.record.start}
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-md shadow-sm transition-all"
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                {t.record.end}
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-md shadow-sm transition-all"
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                {t.record.cc}
              </label>
              <select
                className="w-full px-3 py-2 rounded-md shadow-sm transition-all"
                style={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)'
                }}
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
              >
                <option value="desc">{t.record.nd}</option>
                <option value="asc">{t.record.mm}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message (คงสี error เดิมได้) */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl border shadow-sm flex items-center gap-3 transition-colors"
            style={{ backgroundColor: 'var(--destructive)', borderColor: 'var(--destructive)', color: 'white' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Table Section (ปรับกรอบ/พื้นหลัง + สีเส้นคั่นให้ใช้ตัวแปร) */}
        <div
          className="rounded-xl shadow-lg border overflow-hidden transition-colors"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="px-6 py-4 border-b"
               style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{t.record.menu}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {t.record.total} {total} {t.record.ff}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2"
                     style={{ borderColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full" style={{ color: 'var(--foreground)' }}>
                    <thead
                      className="uppercase text-xs font-medium tracking-wider"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      <tr>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>ID</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.vv}</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.xx}</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.zzz}</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.aa}</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.ll}</th>
                        <th className="px-6 py-3 text-left border-b" style={{ borderColor: 'var(--border)' }}>{t.record.jj}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map((rental) => (
                        <tr key={rental.id}
                            className="transition-colors"
                            style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{rental.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0">
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  style={{ border: '1px solid var(--border)' }}
                                  src={buildImgSrc(rental.image_url)}
                                  alt={`${rental.brand} ${rental.model}`}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium">{rental.brand} {rental.model}</div>
                                <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                  {rental.license_plate} • {rental.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{rental.customer_username}</div>
                            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{rental.customer_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            <div>{new Date(rental.start_date).toLocaleDateString(locale)}</div>
                            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.record.w}</div>
                            <div>{new Date(rental.end_date).toLocaleDateString(locale)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* ห้ามเปลี่ยนสี badge สถานะรถ */}
                            <span className={rentalBadgeClass(rental.rental_status)} title={rental.rental_status}>
                              {rentalLabel(rental.rental_status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* ห้ามเปลี่ยนสี badge สถานะเงิน */}
                            <span className={paymentBadgeClass(rental.payment_status)} title={rental.payment_status}>
                              {paymentLabel(rental.payment_status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ฿{rental.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <div>
                  {rentals.map((rental) => (
                    <div key={rental.id}
                         className="p-4 transition-colors"
                         style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-start space-x-3">
                        <div className="h-16 w-16 flex-shrink-0">
                          <img
                            className="h-16 w-16 rounded-lg object-cover"
                            style={{ border: '1px solid var(--border)' }}
                            src={buildImgSrc(rental.image_url)}
                            alt={`${rental.brand} ${rental.model}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                {rental.brand} {rental.model}
                              </h3>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                {rental.license_plate}
                              </p>
                            </div>
                            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>#{rental.id}</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                                {rental.customer_username}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{rental.customer_email}</p>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {new Date(rental.start_date).toLocaleDateString('th-TH')} - {new Date(rental.end_date).toLocaleDateString('th-TH')}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* ไม่เปลี่ยนสี badge */}
                              <span className={rentalBadgeClass(rental.rental_status)}>{rentalLabel(rental.rental_status)}</span>
                              <span className={paymentBadgeClass(rental.payment_status)}>{paymentLabel(rental.payment_status)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                ฿{rental.total_amount.toLocaleString()}
                              </span>
                              <Link
                                href={`/rentals/${rental.id}`}
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                              >
                                รายละเอียด
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {rentals.length === 0 && (
                <div className="text-center py-12">
                  <div className="mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                         style={{ color: 'var(--muted-foreground)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{t.record.cv}</h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.record.dd}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination (ปรับกรอบให้ใช้ตัวแปร) */}
        {totalPages > 1 && (
          <div
            className="rounded-xl shadow-lg border px-6 py-4 mt-6 transition-colors"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                แสดง {((page - 1) * pageSize) + 1} ถึง {Math.min(page * pageSize, total)} จาก {total} รายการ
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)'
                  }}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </button>
                <div className="hidden sm:flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        className="px-3 py-2 text-sm font-medium rounded-md transition-colors"
                        style={pageNum === page
                          ? { backgroundColor: 'var(--primary)', color: 'white' }
                          : { backgroundColor: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)'
                  }}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalHistoryPage;
