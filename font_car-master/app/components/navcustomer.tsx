'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Calendar, User, MessageSquare, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../providers';
import { texts } from '../texts';

interface CustomerNavProps {
  reviewableRentals?: ReviewableRental[];
}

interface ReviewableRental {
  rental_id: number;
  car_name: string;
  shop_name: string;
  start_date: string;
  end_date: string;
  car_id: number;
  shop_id: number;
}

export default function CustomerNav({ reviewableRentals = [] }: CustomerNavProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLang();
  const t = texts[lang];

  return (
    <nav
      className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Car className="w-6 h-6 text-white" />
              </div>
              <h1
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: 'var(--primary)' }}
              >
                {t.CustomerDashboard.title}
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <Link
                href="/customer/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
              >
                <span>{t.CustomerDashboard.frist}</span>
              </Link>
              <Link
                href="/customer/bookings"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>{t.CustomerDashboard.bookings}</span>
              </Link>
              <Link
                href="/customer/reviews"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 relative"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.CustomerDashboard.reviews}</span>
                {reviewableRentals.length > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--warning)',
                      color: 'var(--warning-foreground)',
                    }}
                  >
                    {reviewableRentals.length}
                  </span>
                )}
              </Link>
              <Link
                href="/customer/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
              >
                <User className="w-4 h-4" />
                <span>{t.CustomerDashboard.profile}</span>
              </Link>
            </div>
          </div>

          {/* User Menu & Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <span
                className="text-sm transition-colors duration-300"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <span
                  className="font-medium transition-colors duration-300"
                  style={{ color: 'var(--primary)' }}
                >
                  {user?.username || 'Guest'}
                </span>
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
              }}
              aria-label={`เปลี่ยนธีม (ปัจจุบัน: ${theme === 'light' ? 'สว่าง' : 'มืด'})`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button
              onClick={() => router.push('/customer/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.CustomerDashboard.back}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}