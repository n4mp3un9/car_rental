// app/customer/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Moon, Sun, Search, Car, LogOut } from 'lucide-react';
import { useLang } from "../../providers";
import { texts } from "../../texts";

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
  transmission: string;
  fuel_type: string;
  seats: number;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  shop_name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isCustomer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLang();
  const t = texts[lang];
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'car' | 'shop'>('car');
  const [isMounted, setIsMounted] = useState(false);
  
  const [filters, setFilters] = useState({
    car_type: '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    seats: ''
  });

  useEffect(() => {
    if (searchParams) {
      const query = searchParams.get('q') || '';
      const type = (searchParams.get('type') as 'car' | 'shop') || 'car';
      setSearchQuery(query);
      setSearchType(type);

      const car_type = searchParams.get('car_type') || '';
      const min_price = searchParams.get('min_price') || '';
      const max_price = searchParams.get('max_price') || '';
      const transmission = searchParams.get('transmission') || '';
      const fuel_type = searchParams.get('fuel_type') || '';
      const seats = searchParams.get('seats') || '';
      setFilters({ car_type, min_price, max_price, transmission, fuel_type, seats });
    }
  }, [searchParams]);
    const fetchSearchResults = async () => {
      try {
        setDataLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        if (searchType === 'car') {
          const params: string[] = [];
          if (searchQuery) params.push(`brand=${encodeURIComponent(searchQuery)}`);
          if (filters.car_type !== '') params.push(`car_type=${encodeURIComponent(filters.car_type)}`);
          if (filters.min_price !== '') params.push(`min_price=${encodeURIComponent(filters.min_price)}`);
          if (filters.max_price !== '') params.push(`max_price=${encodeURIComponent(filters.max_price)}`);
          if (filters.transmission !== '') params.push(`transmission=${encodeURIComponent(filters.transmission)}`);
          if (filters.fuel_type !== '') params.push(`fuel_type=${encodeURIComponent(filters.fuel_type)}`);
          if (filters.seats !== '') params.push(`seats=${encodeURIComponent(filters.seats)}`);

          const url = `${process.env.NEXT_PUBLIC_API_URL}/cars?${params.join('&')}`;
          const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
          setCars(response.data.cars);
          setShops([]);
        } else {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shops`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          let filteredShops = response.data.shops;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filteredShops = filteredShops.filter((shop: Shop) =>
              (shop.shop_name && shop.shop_name.toLowerCase().includes(q)) ||
              (shop.username && shop.username.toLowerCase().includes(q))
            );
          }
          setShops(filteredShops);
          setCars([]);
        }

        setError(null);
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err?.response?.data?.message || 'Failed to search');
      } finally {
        setDataLoading(false);
      }
    };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let query = `?type=${searchType}`;
    if (searchQuery) query += `&q=${encodeURIComponent(searchQuery)}`;
    if (searchType === 'car') {
      if (filters.car_type !== '') query += `&car_type=${encodeURIComponent(filters.car_type)}`;
      if (filters.min_price !== '') query += `&min_price=${encodeURIComponent(filters.min_price)}`;
      if (filters.max_price !== '') query += `&max_price=${encodeURIComponent(filters.max_price)}`;
      if (filters.transmission !== '') query += `&transmission=${encodeURIComponent(filters.transmission)}`;
      if (filters.fuel_type !== '') query += `&fuel_type=${encodeURIComponent(filters.fuel_type)}`;
      if (filters.seats !== '') query += `&seats=${encodeURIComponent(filters.seats)}`;
    }
    router.push(`/customer/search${query}`);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
      fetchSearchResults();
    }
  }, [user, searchParams, isMounted]);

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
                  <Car className="w-6 h-6" style={{ color: 'var(--primary-foreground, #fff)' }} />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300"
                    style={{ color: 'var(--foreground)' }}>ระบบเช่ารถ</h1>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/customer/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  <span>{t.customersearch.home}</span>
                </Link>
                <Link
                  href="/customer/bookings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  <span>{t.customersearch.rental}</span>
                </Link>
              </div>
            </div>

            {/* User Menu & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t.customersearch.ww},{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {user.username}
                  </span>
                </span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                aria-label={`เปลี่ยนธีม (ปัจจุบัน: ${theme === 'light' ? 'สว่าง' : 'มืด'})`}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground, #fff)' }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.customersearch.exit}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight"
                style={{ color: 'var(--foreground)' }}>
              {searchType === 'car' ? t.customersearch.search : t.customersearch.title}
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* กล่องค้นหา */}
            <div className="overflow-hidden rounded-lg mb-8 shadow"
                 style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSearch}>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                      <div className="flex-1">
                        <label htmlFor="search" className="sr-only">ค้นหา</label>
                        <input
                          type="text"
                          id="search"
                          className="block w-full sm:text-sm rounded-md py-3 px-4 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          placeholder= {t.customersearch.sub}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex-none">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              id="search-car"
                              name="searchType"
                              type="radio"
                              className="h-4 w-4"
                              style={{ accentColor: 'var(--primary)' }}
                              checked={searchType === 'car'}
                              onChange={() => setSearchType('car')}
                            />
                            <label htmlFor="search-car" className="block text-sm font-medium"
                                   style={{ color: 'var(--foreground)' }}>
                              {t.customersearch.car}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              id="search-shop"
                              name="searchType"
                              type="radio"
                              className="h-4 w-4"
                              style={{ accentColor: 'var(--primary)' }}
                              checked={searchType === 'shop'}
                              onChange={() => setSearchType('shop')}
                            />
                            <label htmlFor="search-shop" className="block text-sm font-medium"
                                   style={{ color: 'var(--foreground)' }}>
                              {t.customersearch.car1}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ฟิลเตอร์รถ */}
                    {searchType === 'car' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                        <div>
                          <label htmlFor="car_type" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.type}</label>
                          <select
                            id="car_type"
                            name="car_type"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.car_type}
                            onChange={handleFilterChange}
                          >
                            <option value="">{t.customersearch.tt}</option>
                            <option value="sedan">{t.customersearch.a}</option>
                            <option value="suv">{t.customersearch.b}</option>
                            <option value="hatchback">{t.customersearch.c}</option>
                            <option value="pickup">{t.customersearch.d}</option>
                            <option value="van">{t.customersearch.e}</option>
                            <option value="luxury">{t.customersearch.f}</option>
                            <option value="motorbike">{t.customersearch.g}</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="min_price" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.price}</label>
                          <input
                            type="number"
                            id="min_price"
                            name="min_price"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.min_price}
                            onChange={handleFilterChange}
                            placeholder="฿"
                          />
                        </div>
                        <div>
                          <label htmlFor="max_price" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.price2}</label>
                          <input
                            type="number"
                            id="max_price"
                            name="max_price"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.max_price}
                            onChange={handleFilterChange}
                            placeholder="฿"
                          />
                        </div>
                        <div>
                          <label htmlFor="transmission" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.gear}</label>
                          <select
                            id="transmission"
                            name="transmission"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.transmission}
                            onChange={handleFilterChange}
                          >
                            <option value="">{t.customersearch.tt}</option>
                            <option value="auto">{t.customersearch.g2}</option>
                            <option value="manual">{t.customersearch.g1}</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="fuel_type" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.fuel}</label>
                          <select
                            id="fuel_type"
                            name="fuel_type"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.fuel_type}
                            onChange={handleFilterChange}
                          >
                            <option value="">{t.customersearch.tt}</option>
                            <option value="gasoline">{t.customersearch.gasoline}</option>
                            <option value="diesel">{t.customersearch.diesel}</option>
                            <option value="hybrid">{t.customersearch.hybrid}</option>
                            <option value="electric">{t.customersearch.electric}</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="seats" className="block text-sm font-medium"
                                 style={{ color: 'var(--foreground)' }}>{t.customersearch.seats}</label>
                          <select
                            id="seats"
                            name="seats"
                            className="mt-1 block w-full pl-3 pr-10 py-2 rounded-md focus:outline-none"
                            style={{
                              backgroundColor: 'var(--card)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)'
                            }}
                            value={filters.seats}
                            onChange={handleFilterChange}
                          >
                            <option value="">{t.customersearch.tt}</option>
                            <option value="2">2 {t.customersearch.seats1}</option>
                            <option value="4">4 {t.customersearch.seats1}</option>
                            <option value="5">5 {t.customersearch.seats1}</option>
                            <option value="7">7 {t.customersearch.seats1}</option>
                            <option value="9">9+ {t.customersearch.seats1}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)', border: '1px solid transparent' }}
                      >
                        {t.customersearch.ss}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded border"
                   style={{
                     backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                     borderColor: 'var(--destructive)',
                     color: 'var(--destructive)'
                   }}>
                {error}
              </div>
            )}

            {/* Results */}
            <div>
              <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--foreground)' }}>
                {t.customersearch.look} {searchQuery && `"${searchQuery}"`}
              </h2>

              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                       style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }} />
                  <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</p>
                </div>
              ) : searchType === 'car' ? (
                cars.length === 0 ? (
                  <div className="rounded-lg shadow p-6 text-center"
                       style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                    <p>{t.customersearch.no}</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cars.map((car) => (
                      <div key={car.id} className="rounded-lg shadow overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                           style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                        <div className="h-48 relative" style={{ backgroundColor: 'var(--muted)' }}>
                          {car.image_url ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`}
                              alt={`${car.brand} ${car.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex justify-center items-center h-full"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              ไม่มีรูปภาพ
                            </div>
                          )}
                          <div
                            className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded"
                            style={{
                              backgroundColor:
                                car.status === 'available'
                                  ? 'color-mix(in oklab, var(--success) 80%, transparent)'
                                  : car.status === 'rented'
                                  ? 'color-mix(in oklab, var(--destructive) 80%, transparent)'
                                  : 'color-mix(in oklab, var(--accent) 80%, transparent)',
                              color: '#fff'
                            }}
                          >
                            {car.status === 'available' ? t.customersearch.ready :
                             car.status === 'rented' ? t.customersearch.reserved:
                             car.status === 'maintenance' ? t.customersearch.maintain :
                             'ไม่พร้อมให้บริการ'}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                            {car.brand} {car.model}
                          </h3>
                          <p style={{ color: 'var(--muted-foreground)' }}> {t.customersearch.year} {car.year} • {t.customersearch.type}: {car.car_type}</p>
                          <p style={{ color: 'var(--muted-foreground)' }}>{t.customersearch.shop}: {car.shop_name}</p>
                          <p style={{ color: 'var(--muted-foreground)' }}>
                            {car.seats} {t.customersearch.seats} • {car.transmission === 'auto' ? t.customersearch.g3 : t.customersearch.g4} • {''}
                            {car.fuel_type === 'gasoline' ? t.customersearch.gasoline :
                             car.fuel_type === 'diesel' ? t.customersearch.diesel :
                             car.fuel_type === 'hybrid' ? t.customersearch.hybrid : t.customersearch.electric}
                          </p>
                          <p className="font-semibold mt-2" style={{ color: 'var(--primary)' }}>
                            ฿{car.daily_rate.toLocaleString()} / {t.customersearch.day}
                          </p>
                          <div className="mt-4">
                            {car.status === 'available' ? (
                              <Link href={`/customer/cars/${car.id}`}>
                                <button className="w-full text-sm py-2 px-4 rounded"
                                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }}>
                                 {t.customersearch.looks}
                                </button>
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="w-full text-sm py-2 px-4 rounded cursor-not-allowed"
                                style={{
                                  backgroundColor: 'color-mix(in oklab, var(--muted) 80%, transparent)',
                                  color: 'var(--muted-foreground)'
                                }}
                              >
                                {t.customersearch.reserved}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                shops.length === 0 ? (
                  <div className="rounded-lg shadow p-6 text-center"
                       style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}>
                    <p>{t.customersearch.no}</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shops.map((shop) => (
                      <div key={shop.id} className="rounded-lg shadow overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                           style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="h-14 w-14 rounded-full flex-shrink-0 flex items-center justify-center"
                                 style={{ backgroundColor: 'var(--muted)' }}>
                              {shop.profile_image ? (
                                <img
                                  src={shop.profile_image}
                                  alt={shop.shop_name}
                                  className="h-14 w-14 rounded-full object-cover"
                                />
                              ) : (
                                <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"
                                     style={{ color: 'var(--muted-foreground)' }}>
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                                {shop.shop_name || shop.username}
                              </h3>
                              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                {shop.car_count}  {t.customersearch.car}
                              </p>
                              {shop.address && (
                                <p className="text-sm mt-1 truncate max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
                                  {shop.address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4">
                            <Link href={`/customer/shops/${shop.id}`}>
                              <button className="w-full text-sm py-2 px-4 rounded"
                                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }}>
                               {t.customersearch.vv}
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
