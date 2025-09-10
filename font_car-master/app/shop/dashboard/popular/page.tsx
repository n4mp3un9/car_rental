'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, AlertCircle, Star, ArrowLeft, TrendingUp, DollarSign, BarChart } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, eachMonthOfInterval } from 'date-fns';
import { useLang } from "../../../providers";
import { texts } from "../../../texts";

interface Review {
  id: number;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

interface CarItem {
  id: number;
  shop_id: number;
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
  status: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  rentals_count: number;
  reviews_count: number;
  avg_rating: number;
  latest_reviews?: Review[];
  label?: string;
}

interface DashboardStats {
  totalRevenue: number;
  dailyRevenue: number;
  monthlyRevenue: { month: string; monthlyRevenue: number }[];
  yearlyRevenue: number;
  totalRentals: number;
}

interface ApiResponse {
  scope: 'shop' | 'global';
  cars: any[];
}

const BAR_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function PopularCarsPage() {
  const { user, loading, isShop } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<CarItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { lang } = useLang();
  const t = texts[lang];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  const normalizeCar = (c: any): CarItem => ({
    ...c,
    year: Number(c.year ?? 0),
    seats: Number(c.seats ?? 0),
    daily_rate: Number(c.daily_rate ?? 0),
    insurance_rate: Number(c.insurance_rate ?? 0),
    rentals_count: Number(c.rentals_count ?? 0),
    reviews_count: Number(c.reviews_count ?? 0),
    avg_rating: Number(c.avg_rating ?? 0),
  });

  const normalizeStats = (s: any): DashboardStats => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear(), 11, 1),
    }).map((date) => ({
      month: format(date, 'yyyy-MM'),
      monthlyRevenue: 0,
    }));

    const apiMonthlyRevenue = (s.monthlyRevenue ?? s.monthly_revenue ?? s.revenue_by_month ?? []).map((m: any) => ({
      month: String(m.month ?? m.label ?? ''),
      monthlyRevenue: Number(m.monthlyRevenue ?? m.revenue ?? m.total ?? 0),
    }));

    const monthlyRevenue = months.map((monthObj) => {
      const apiMonth = apiMonthlyRevenue.find((m: any) => m.month === monthObj.month);
      return apiMonth ? { ...monthObj, monthlyRevenue: apiMonth.monthlyRevenue } : monthObj;
    });

    return {
      totalRevenue: Number(s.totalRevenue ?? s.total_revenue ?? s.revenue_total ?? 0),
      dailyRevenue: Number(s.dailyRevenue ?? s.daily_revenue ?? 0),
      monthlyRevenue,
      yearlyRevenue: Number(s.yearlyRevenue ?? s.yearly_revenue ?? 0),
      totalRentals: Number(s.totalRentals ?? s.total_rentals ?? 0),
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('กรุณาเข้าสู่ระบบ');

      const headers = { Authorization: `Bearer ${token}` };

      const [popularCarsRes, dashboardStatsRes] = await Promise.all([
        axios.get<ApiResponse>(`${apiUrl}/cars/popular`, { headers, params: { limit: 5 } }),
        axios.get(`${apiUrl}/cars/shop/dashboard-stats`, { headers }),
      ]);

      const normalized = (popularCarsRes.data.cars || [])
        .map(normalizeCar)
        .map((c: CarItem) => ({ ...c, label: `${c.brand} ${c.model}` }));
      setCars(normalized);
      setStats(normalizeStats(dashboardStatsRes.data));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching page data:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && isMounted) {
      if (!user) {
        router.replace('/login');
      } else if (!isShop()) {
        router.replace('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, loading, isShop, router, isMounted]);

  const renderStars = (rating: number | string | null | undefined) => {
    const r = Math.round(Number(rating ?? 0));
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i + 1 <= r ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-blue-400 to-blue-500';
  };

  const goHome = () => {
    router.push('/shop/dashboard');
  };

  if (!isMounted || loading || !user) {
    return (
      <div
        className="min-h-screen flex justify-center items-center transition-colors duration-300"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-green-500"></div>
          <p className="mt-6 text-xl font-medium" style={{ color: 'var(--muted-foreground)' }}>
            กำลังโหลด...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Dashboard
          </h1>
          <button
            onClick={goHome}
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            style={{ color: 'var(--primary)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.popular.exit}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-8 p-4 rounded-xl border shadow-sm"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  เกิดข้อผิดพลาด
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div
            className="text-center py-16 rounded-2xl shadow-lg border border-gray-100"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-green-500"></div>
            <p className="mt-6 text-xl font-medium" style={{ color: 'var(--muted-foreground)' }}>
              กำลังโหลดข้อมูล...
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && stats && (
          <>
            {/* Income Summary Dashboard */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
                {t.popular.summary}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  className="p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full"><DollarSign className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.popular.income}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        ฿{Number(stats?.dailyRevenue ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-200 rounded-full"><DollarSign className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.popular.total}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        ฿{Number(stats?.yearlyRevenue ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full"><Car className="w-6 h-6 text-purple-600" /></div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.popular.rental}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {stats.totalRentals} {t.popular.time}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
              {/* Monthly Revenue Chart */}
              <div
                className="lg:col-span-3 p-6 rounded-xl border border-gray-200 shadow-sm"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                  <BarChart className="w-5 h-5 mr-2 text-indigo-500" />
                  {t.popular.money}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={stats.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" fontSize={12} stroke="#6b7280" />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) => `฿${Number(value).toLocaleString()}`}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, t.popular.revenue]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="monthlyRevenue" name={t.popular.revenue}>
                      {stats.monthlyRevenue.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              {/* Popular Cars Chart */}
              <div
                className="lg:col-span-2 p-6 rounded-xl border border-gray-200 shadow-sm"
                style={{ backgroundColor: 'var(--card)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                  <BarChart className="w-5 h-5 mr-2 text-amber-500" />
                  {t.popular.top}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={cars} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      fontSize={12}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      labelFormatter={(label) => label as string}
                      formatter={(value: any) => [`${value} ${t.popular.time}`, t.popular.vv]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="rentals_count" name={t.popular.vv}>
                      {cars.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List of Popular Cars */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
                {t.popular.all}
              </h2>
              <div className="space-y-4">
                {cars.map((car, index) => {
                  const avg = Number(car.avg_rating ?? 0);
                  return (
                    <div
                      key={car.id}
                      className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                      style={{ backgroundColor: 'var(--card)' }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          {car.image_url ? (
                            <img
                              src={`${baseUrl}${car.image_url}`}
                              alt={`${car.brand} ${car.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: 'var(--accent)' }}
                            >
                              <Car className="h-10 w-10 text-gray-400" />
                            </div>
                          )}
                          <div
                            className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs text-white ${getRankBadgeColor(index)}`}
                          >
                            {t.popular.rating} {index + 1}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                                {car.brand} {car.model} ({car.year})
                              </h2>
                              <p className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                                {t.popular.license}: {car.license_plate}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                <span>{t.popular.type}: {car.car_type}</span>
                                <span>{t.popular.gear}: {car.transmission}</span>
                                <span>{t.popular.seat}: {car.seats}</span>
                                <span>
                                  {t.popular.status}:{' '}
                                  {car.status === 'available'
                                    ? t.popular.available
                                    : car.status === 'unavailable'
                                    ? t.popular.noavai
                                    : car.status === 'rented'
                                    ? t.popular.Renting
                                    : car.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-green-600">฿{Number(car.daily_rate).toLocaleString()}</p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{t.popular.day}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center flex-wrap gap-4 text-sm">
                            <span className="inline-flex items-center gap-1" style={{ color: 'var(--foreground)' }}>
                              <TrendingUp className="w-4 h-4" />
                              {Number(car.rentals_count)} {t.popular.time}
                            </span>
                            <span className="inline-flex items-center gap-1 text-yellow-600">
                              <Star className="w-4 h-4" />
                              {avg > 0 ? avg.toFixed(1) : 'N/A'}
                            </span>
                            <span style={{ color: 'var(--muted-foreground)' }}>
                              ({Number(car.reviews_count)} {t.popular.review})
                            </span>
                            <div className="ml-auto flex items-center gap-2">{renderStars(avg)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div
              className="rounded-xl border border-gray-200 shadow-sm p-8"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
                {t.popular.sum}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {cars.reduce((sum, car) => sum + Number(car.rentals_count ?? 0), 0)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t.popular.tr}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {(cars.reduce((sum, car) => sum + Number(car.avg_rating ?? 0), 0) / Math.max(cars.length, 1)).toFixed(1)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t.popular.score}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {cars.reduce((sum, car) => sum + Number(car.reviews_count ?? 0), 0)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t.popular.reviewt}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && cars.length === 0 && (
          <div
            className="text-center py-16 rounded-2xl shadow-lg border border-gray-100"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Car className="w-10 h-10" style={{ color: 'var(--foreground)' }} />
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              ไม่มีรถที่นิยม
            </h3>
            <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--muted-foreground)' }}>
              ขณะนี้ยังไม่มีข้อมูลรถที่ได้รับความนิยมในร้านของคุณ เมื่อมีลูกค้าเช่ารถแล้วข้อมูลจะแสดงที่นี่
            </p>
            <button
              onClick={() => router.push('/cars')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
            >
              ดูรถทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
