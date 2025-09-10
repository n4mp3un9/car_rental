'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { useLang } from "../../providers";
import { texts } from "../../texts";
import { Search, Car, Calendar, Star, User, LogOut, Bell, MessageSquare, Moon, Sun } from 'lucide-react';

interface Shop {
  id: number;
  username: string;
  shop_name: string;
  address?: string;
  profile_image?: string;
  car_count: number;
}

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
  shop_name: string;
  shop_id: number;
}

interface RentalNotification {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  rental_status: string;
  payment_status: string;
  total_amount: number;
  brand: string;
  model: string;
  year: number;
  image_url?: string;
  shop_name: string;
  shop_username: string;
}

interface ReviewableRental {
  rental_id: number;
  start_date: string;
  end_date: string;
  car_name: string;
  car_id: number;
  shop_name: string;
  shop_id: number;
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [notifications, setNotifications] = useState<RentalNotification[]>([]);
  const [reviewableRentals, setReviewableRentals] = useState<ReviewableRental[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLang();
  const t = texts[lang];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'customer') {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchShops(),
          fetchAvailableCars(),
          fetchNotifications(),
          fetchReviewableRentals(),
        ]);
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/shops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(response.data.shops);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching shops:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      } else {
        setError(err.response?.data?.message || 'Failed to fetch shops');
      }
    }
  };

  const fetchAvailableCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cars = response.data.cars || [];
      const availableCarsOnly = cars
        .filter((car: Car) => car.status === 'available')
        .sort((a: Car, b: Car) => {
          if (a.shop_name !== b.shop_name) {
            return a.shop_name.localeCompare(b.shop_name);
          }
          return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        });
      setAvailableCars(availableCarsOnly);
    } catch (err: any) {
      console.error('Error fetching available cars:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/customer/rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.rentals || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  const fetchReviewableRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/reviews/reviewable-rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviewableRentals(response.data.rentals || []);
    } catch (err: any) {
      console.error('Error fetching reviewable rentals:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    }
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchQuery = searchTerm.toLowerCase().trim();
    return availableCars.filter((car: Car) => {
      return (
        car.brand?.toLowerCase().includes(searchQuery) ||
        car.model?.toLowerCase().includes(searchQuery) ||
        car.shop_name?.toLowerCase().includes(searchQuery) ||
        car.car_type?.toLowerCase().includes(searchQuery) ||
        car.license_plate?.toLowerCase().includes(searchQuery) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(searchQuery)
      );
    });
  }, [searchTerm, availableCars]);

  const handleSearch = useCallback(() => {}, []);
  const clearSearch = useCallback(() => { setSearchTerm(''); setError(null); }, []);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); }, []);

  const groupCarsByShop = (cars: Car[] = availableCars) => {
    const grouped = cars.reduce((acc: { [key: string]: Car[] }, car) => {
      if (!acc[car.shop_name]) acc[car.shop_name] = [];
      acc[car.shop_name].push(car);
      return acc;
    }, {});
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
  <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
    {/* Navigation Header */}
    <nav
      className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Car className="w-6 h-6" style={{ color: 'var(--primary-foreground, #fff)' }} />
              </div>
              <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                {t.CustomerDashboard.title}
              </h1>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/customer/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <span>{t.CustomerDashboard.viewAllCars}</span>
              </Link>
              <Link
                href="/customer/bookings"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <Calendar className="w-4 h-4" />
                <span>{t.CustomerDashboard.bookings}</span>
              </Link>
              <Link
                href="/customer/reviews"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 relative"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.CustomerDashboard.reviews}</span>
                {reviewableRentals.length > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300"
                    style={{ backgroundColor: 'var(--warning)', color: 'var(--warning-foreground)' }}
                  >
                    {reviewableRentals.length}
                  </span>
                )}
              </Link>
              <Link
                href="/customer/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <User className="w-4 h-4" />
                <span>{t.CustomerDashboard.profile}</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                {t.CustomerDashboard.welcome.replace('{username}', user.username)}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              aria-label={t.CustomerDashboard.themeToggle.replace('{theme}', theme === 'light' ? 'light' : 'dark')}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t.CustomerDashboard.logout}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Search Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--ring) 100%)' }}
          ></div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
            }}
          ></div>
        </div>
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.CustomerDashboard.welcome.replace('{username}', user.username)}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t.CustomerDashboard.searchPlaceholder}
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items pointer-events-none">
                  <Search className="h-5 w-5 mt-5" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <input
                  type="text"
                  placeholder={t.CustomerDashboard.searchPlaceholder}
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="
                    w-full pl-12 pr-12 py-4 text-lg rounded-2xl shadow-lg
                    border focus:outline-none focus:ring-4
                    placeholder:text-[var(--muted-foreground)]
                    focus:ring-[var(--primary)]
                  "
                  style={{
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border)',
                    caretColor: 'var(--primary)'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors duration-300"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className="
                  px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl
                  transform hover:scale-105 transition-all duration-300 disabled:opacity-50
                "
                style={{
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                {t.CustomerDashboard.searchButton}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 text-center">
                <p style={{ color: 'var(--primary-foreground, #fff)' }}>
                  {t.CustomerDashboard.searchResults.replace('{searchTerm}', searchTerm)} — {searchResults.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 rounded-lg text-center"
             style={{ backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)', color: 'var(--destructive)' }}>
          {error}
        </div>
      )}

      {/* Quick Stats - Reviewable Rentals */}
      {reviewableRentals.length > 0 && (
        <div className="mb-12">
          <div className="max-w-md mx-auto">
            <div
              className="rounded-2xl shadow-lg border transition-all duration-300"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="p-6 border-b transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                    style={{ backgroundColor: 'var(--warning)' }}
                  >
                    <Star className="w-5 h-5" style={{ color: 'var(--warning-foreground, #fff)' }} />
                  </div>
                  <h2 className="text-xl font-semibold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                    {t.CustomerDashboard.reviews}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold transition-colors duration-300" style={{ color: 'var(--warning)' }}>
                    {reviewableRentals.length}
                  </div>
                  <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                    {t.CustomerDashboard.pendingReviewsMessage}
                  </p>
                </div>
                <Link
                  href="/customer/reviews"
                  className="w-full inline-flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  style={{ backgroundColor: 'var(--warning)', color: 'var(--warning-foreground, #fff)' }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.CustomerDashboard.writeReview}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Cars */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <Car className="w-5 h-5" style={{ color: 'var(--primary-foreground, #fff)' }} />
            </div>
            <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
              {searchResults.length > 0
                ? t.CustomerDashboard.searchResults.replace('{searchTerm}', searchTerm)
                : t.CustomerDashboard.availableCars}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            {searchResults.length > 0 && (
              <button
                onClick={clearSearch}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{t.CustomerDashboard.clearSearch}</span>
              </button>
            )}
            <Link
              href="/customer/search"
              className="text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{ color: 'var(--primary)' }}
            >
              {t.CustomerDashboard.advancedSearch}
            </Link>
          </div>
        </div>

        {loading ? (
          <div
            className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-300"
              style={{ borderColor: 'var(--primary)' }}
            ></div>
            <p className="mt-4 text-lg transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
              {t.CustomerDashboard.loading}
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-8">
            {groupCarsByShop(searchResults).map(([shopName, cars]) => (
              <div
                key={shopName}
                className="rounded-2xl shadow-lg border transition-all duration-300"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="p-6 border-b transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <User className="w-4 h-4" style={{ color: 'var(--accent-foreground)' }} />
                    </div>
                    <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                      {shopName}
                    </h3>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {cars.length}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.map((car) => (
                      <div
                        key={car.id}
                        className="group rounded-xl shadow-md overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      >
                        <div className="relative overflow-hidden">
                          {car.image_url ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`}
                              alt={`${car.brand} ${car.model}`}
                              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/fallback-image.png'; }}
                            />
                          ) : (
                            <div
                              className="w-full h-40 flex items-center justify-center transition-colors duration-300"
                              style={{ backgroundColor: 'var(--muted)' }}
                            >
                              <Car className="w-12 h-12" style={{ color: 'var(--muted-foreground)' }} />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300"
                              style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground, #fff)' }}
                            >
                              {t.CustomerDashboard.availableCars}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3">
                            <h4 className="text-lg font-bold mb-1 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                              {car.brand} {car.model}
                            </h4>
                            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                              {t.CustomerDashboard.carDetails
                                .replace('{year}', String(car.year))
                                .replace('{carType}', car.car_type)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--primary)' }}>
                                ฿{car.daily_rate?.toLocaleString()}
                              </span>
                              <span className="text-xs transition-colors duration-300 ml-1" style={{ color: 'var(--muted-foreground)' }}>
                                {t.CustomerDashboard.pricePerDay}
                              </span>
                            </div>
                            <Link
                              href={`/customer/cars/${car.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            >
                              {t.CustomerDashboard.viewDetails}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : availableCars.length > 0 ? (
          <div className="space-y-8">
            {groupCarsByShop().map(([shopName, cars]) => (
              <div
                key={shopName}
                className="rounded-2xl shadow-lg border transition-colors duration-300"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="p-6 border-b transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <User className="w-4 h-4" style={{ color: 'var(--accent-foreground)' }} />
                    </div>
                    <h3 className="text-lg font-semibold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                      {shopName}
                    </h3>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {cars.length}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cars.slice(0, 6).map((car) => (
                      <div
                        key={car.id}
                        className="group rounded-xl shadow-md overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      >
                        <div className="relative overflow-hidden">
                          {car.image_url ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`}
                              alt={`${car.brand} ${car.model}`}
                              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/fallback-image.png'; }}
                            />
                          ) : (
                            <div
                              className="w-full h-40 flex items-center justify-center transition-colors duration-300"
                              style={{ backgroundColor: 'var(--muted)' }}
                            >
                              <Car className="w-12 h-12" style={{ color: 'var(--muted-foreground)' }} />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300"
                              style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground, #fff)' }}
                            >
                              {t.CustomerDashboard.availableCars}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3">
                            <h4 className="text-lg font-bold mb-1 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                              {car.brand} {car.model}
                            </h4>
                            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                              {t.CustomerDashboard.carDetails
                                .replace('{year}', String(car.year))
                                .replace('{carType}', car.car_type)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold transition-colors duration-300" style={{ color: 'var(--primary)' }}>
                                ฿{car.daily_rate?.toLocaleString()}
                              </span>
                              <span className="text-xs transition-colors duration-300 ml-1" style={{ color: 'var(--muted-foreground)' }}>
                                {t.CustomerDashboard.pricePerDay}
                              </span>
                            </div>
                            <Link
                              href={`/customer/cars/${car.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                            >
                              {t.CustomerDashboard.viewDetails}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cars.length > 6 && (
                    <div className="mt-6 text-center">
                      <Link
                        href="/customer/search"
                        className="inline-flex items-center space-x-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                        style={{ color: 'var(--primary)' }}
                      >
                        <span>{t.CustomerDashboard.viewAllCars}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Car className="mx-auto h-16 w-16 transition-colors duration-300 mb-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="text-lg font-medium transition-colors duration-300 mb-2" style={{ color: 'var(--foreground)' }}>
              {t.CustomerDashboard.noCarsAvailable}
            </h3>
            <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
              {t.CustomerDashboard.noCarsAvailableMessage}
            </p>
          </div>
        )}
      </div>

      {/* Recent Bookings Section */}
      {notifications.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Bell className="w-5 h-5" style={{ color: 'var(--primary-foreground, #fff)' }} />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                {t.CustomerDashboard.recentBookings}
              </h2>
            </div>
            <Link
              href="/customer/bookings"
              className="text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{ color: 'var(--primary)' }}
            >
              {t.CustomerDashboard.viewAllBookings}
            </Link>
          </div>
          <div
            className="rounded-2xl shadow-lg border transition-all duration-300"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div
              className="divide-y transition-colors duration-300"
              style={{ '--tw-divide-opacity': '1', '--tw-divide-color': 'var(--border)' } as React.CSSProperties}
            >
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="p-6 transition-all duration-300"
                  style={{ backgroundColor: 'color-mix(in oklab, var(--accent) 10%, transparent)' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {notification.image_url ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${notification.image_url}`}
                          alt={`${notification.brand} ${notification.model}`}
                          className="w-20 h-20 rounded-xl object-cover shadow-md"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-xl flex items-center justify-center transition-colors duration-300"
                          style={{ backgroundColor: 'var(--muted)' }}
                        >
                          <Car className="w-10 h-10" style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold transition-colors duration-300 mb-2" style={{ color: 'var(--foreground)' }}>
                        {notification.brand} {notification.model} {notification.year}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                            {t.CustomerDashboard.shopLabel.replace('{shopName}', notification.shop_name)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                          <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                            {new Date(notification.start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')} -{' '}
                            {new Date(notification.end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-3">
                      {/* สถานะ ใช้ color-mix ตามธีม */}
                      <span
                        className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 border"
                        style={{
                          backgroundColor:
                            notification.rental_status === 'approved' || notification.rental_status === 'completed'
                              ? 'color-mix(in oklab, var(--success) 15%, transparent)'
                              : notification.rental_status === 'confirmed'
                              ? 'color-mix(in oklab, var(--primary) 15%, transparent)'
                              : notification.rental_status === 'pending'
                              ? 'color-mix(in oklab, var(--warning) 20%, transparent)'
                              : notification.rental_status === 'ongoing'
                              ? 'color-mix(in oklab, var(--accent) 20%, transparent)'
                              : 'color-mix(in oklab, var(--destructive) 15%, transparent)',
                          color:
                            notification.rental_status === 'approved' || notification.rental_status === 'completed'
                              ? 'var(--success)'
                              : notification.rental_status === 'confirmed'
                              ? 'var(--primary)'
                              : notification.rental_status === 'pending'
                              ? 'var(--warning)'
                              : notification.rental_status === 'ongoing'
                              ? 'var(--accent-foreground)'
                              : 'var(--destructive)',
                          borderColor:
                            notification.rental_status === 'approved' || notification.rental_status === 'completed'
                              ? 'var(--success)'
                              : notification.rental_status === 'confirmed'
                              ? 'var(--primary)'
                              : notification.rental_status === 'pending'
                              ? 'var(--warning)'
                              : notification.rental_status === 'ongoing'
                              ? 'var(--accent)'
                              : 'var(--destructive)',
                        }}
                      >
                        {t.CustomerDashboard.rentalStatus[
                          notification.rental_status as keyof typeof t.CustomerDashboard.rentalStatus
                        ]}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-bold transition-colors duration-300" style={{ color: 'var(--primary)' }}>
                          ฿{notification.total_amount?.toLocaleString()}
                        </span>
                        <p className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                          {t.CustomerDashboard.totalAmount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t mt-16 transition-colors duration-300" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
            <p className="text-lg">{t.CustomerDashboard.footer}</p>
            <p className="text-sm mt-2">{t.CustomerDashboard.footerMessage}</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}
