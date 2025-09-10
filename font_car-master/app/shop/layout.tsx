// app/shop/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Car, Bell, User, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLang } from "../providers";
import { texts } from "../texts";
import { useRef } from 'react';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isShop, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [suppressBadge, setSuppressBadge] = useState(false);
  const lastTotalRef = useRef(0);   // ล่าสุดที่ API รายงาน (r+p+ret+can)
  const baselineRef = useRef(0);    // ค่าตอนอ่านล่าสุด (เคลียร์)


  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
 const { lang, setLang } = useLang();
  const t = texts[lang];
  const isActive = (href: string) => pathname?.startsWith(href);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isShop()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isShop, router]);

  useEffect(() => {
  const onNotifications = pathname?.startsWith('/shop/notifications') ?? false;
  setSuppressBadge(onNotifications);

  if (onNotifications) {
    // ถือว่าอ่านหมดแล้ว -> ตั้ง baseline เป็นยอดล่าสุดที่มี และซ่อน badge
    baselineRef.current = Math.max(baselineRef.current, lastTotalRef.current);
    setPendingCount(0);
  }
}, [pathname]);

useEffect(() => {
  let isFetching = false;

  const fetchPending = async () => {
    if (isFetching) return;
    isFetching = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        lastTotalRef.current = 0;
        if (!suppressBadge) setPendingCount(0);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [rentalsRes, paymentsRes, returnsRes, cancelsRes] = await Promise.all([
        axios.get(`${apiUrl}/shop/bookings/pending`, { headers }).catch(() => ({ data: { bookings: [] } })),
        axios.get(`${apiUrl}/shop/pending-payments`, { headers }).catch(() => ({ data: { payments: [] } })),
        axios.get(`${apiUrl}/shop/returns`, { headers }).catch(() => ({ data: { returnRequests: [] } })),
        axios.get(`${apiUrl}/shop/cancellations`, { headers }).catch(() => ({ data: { cancellations: [] } })),
      ]);

      const r = (rentalsRes.data?.bookings || []).length;
      const p = (paymentsRes.data?.payments || []).length;
      const ret = (returnsRes.data?.returnRequests || []).length;
      const can = (cancelsRes.data?.cancellations || []).length;

      const total = r + p + ret + can;
      lastTotalRef.current = total;

      if (suppressBadge) {
        // เรากำลังอยู่ในหน้าการแจ้งเตือน: ถือว่าอ่านหมดทุกครั้งที่ดึง
        baselineRef.current = Math.max(baselineRef.current, total);
        setPendingCount(0); // ซ่อนจุดแดงในหน้านี้
      } else {
        // นอกหน้าการแจ้งเตือน: แสดงเฉพาะ "ยอดใหม่" (total - baseline)
        const unread = Math.max(0, total - baselineRef.current);
        setPendingCount(unread);
      }
    } finally {
      isFetching = false;
    }
  };

  fetchPending();
  const id = setInterval(fetchPending, 30000);
  window.addEventListener('shop:notifications:refresh', fetchPending);
  window.addEventListener('shop:cancellation:acknowledged', fetchPending);

  return () => {
    clearInterval(id);
    window.removeEventListener('shop:notifications:refresh', fetchPending);
    window.removeEventListener('shop:cancellation:acknowledged', fetchPending);
  };
}, [apiUrl, suppressBadge]);


useEffect(() => {
  const handler = () => {
    const run = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        lastTotalRef.current = 0;
        if (!suppressBadge) setPendingCount(0);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const [rentalsRes, paymentsRes, returnsRes, cancelsRes] = await Promise.all([
        axios.get(`${apiUrl}/shop/bookings/pending`, { headers }).catch(() => ({ data: { bookings: [] } })),
        axios.get(`${apiUrl}/shop/pending-payments`, { headers }).catch(() => ({ data: { payments: [] } })),
        axios.get(`${apiUrl}/shop/returns`, { headers }).catch(() => ({ data: { returnRequests: [] } })),
        axios.get(`${apiUrl}/shop/cancellations`, { headers }).catch(() => ({ data: { cancellations: [] } })),
      ]);
      const r = (rentalsRes.data?.bookings || []).length;
      const p = (paymentsRes.data?.payments || []).length;
      const ret = (returnsRes.data?.returnRequests || []).length;
      const can = (cancelsRes.data?.cancellations || []).length;

      const total = r + p + ret + can;
      lastTotalRef.current = total;

      if (suppressBadge) {
        baselineRef.current = Math.max(baselineRef.current, total);
        setPendingCount(0);
      } else {
        setPendingCount(Math.max(0, total - baselineRef.current));
      }
    };
    run().catch(() => {});
  };

  window.addEventListener('shop:notifications:refresh', handler);
  return () => window.removeEventListener('shop:notifications:refresh', handler);
}, [apiUrl, suppressBadge]);

  // เมนูหลัก (คุมสี hover/active ให้เหมือนเดิม)
  const NavLink = ({
  href,
  children,
  showBadge,
}: {
  href: string;
  children: React.ReactNode;
  showBadge?: boolean;
}) => {
  const active = isActive(href);
  const showDot = showBadge && pendingCount > 0 && !suppressBadge;
    return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'shadow' : ''}`}
      style={{
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        backgroundColor: active ? 'var(--primary-foreground)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (!active) {
          el.style.backgroundColor = 'var(--muted)';
          el.style.color = 'var(--foreground)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (!active) {
          el.style.backgroundColor = 'transparent';
          el.style.color = 'var(--muted-foreground)';
        }
      }}
    >
      <span className="relative inline-flex items-center">
        {children}
        {showDot && (
          <span
            className="absolute -top-1 -right-2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: 'var(--destructive)', // สีแดงตามธีม
              boxShadow: '0 0 0 2px #fff', // ring ขาวให้ดูเด่นบนพื้น
            }}
            aria-label="มีการแจ้งเตือนใหม่"
          />
        )}
      </span>
    </Link>
  );
};

  // ยังโหลด auth อยู่ → โชว์หน้ารอ
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                  {t.CustomerDashboard.title}
                </h1>
              </div>

              {/* Links */}
              <div className="hidden md:flex space-x-4">
                <NavLink href="/shop/dashboard">{t.CustomerDashboard.frist}</NavLink>
                {/* <NavLink href="/shop/cars">จัดการรถยนต์</NavLink> */}
                {/* <NavLink href="/shop/bookings">จัดการการจอง</NavLink> */}
                {/* <NavLink href="/shop/refunds">จัดการคืนเงิน</NavLink> */}
                <NavLink href="/shop/notifications" showBadge>
                  <span
                    onClick={() => {
                      baselineRef.current = Math.max(baselineRef.current, lastTotalRef.current);
                      setPendingCount(0);
                      setSuppressBadge(true);
                    }}
                    className="inline-flex items-center"
                  >
                    <Bell className="w-4 h-4 inline mr-2" />
                    {t.CustomerDashboard.Notifications}
                  </span>
                </NavLink>
                <NavLink href="/shop/record">{t.Booking.tabs.history}</NavLink>
                <NavLink href="/shop/profile">
                  <User className="w-4 h-4 inline mr-2" />
                  {t.CustomerDashboard.profile}
                </NavLink>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                title="สลับโหมดแสง/มืด"
                aria-label="สลับธีม"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                    {user?.shop_name || user?.username || 'ผู้ใช้'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'var(--destructive)', color: 'white' }}
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* เนื้อหาแต่ละหน้า */}
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
