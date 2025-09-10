// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import { useLang } from "./providers";
import { texts } from "./texts";
import Link from 'next/link';
import { Car, Bell, User, LogOut, Moon, Sun, Shield, Clock, Star } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { lang, setLang } = useLang();
  const t = texts[lang];

  useEffect(() => {
    // ถ้าผู้ใช้ล็อกอินแล้ว ให้ redirect ไปหน้า dashboard ตามบทบาท
    if (!loading && user) {
      if (user.role === 'customer') {
        router.push('/customer/dashboard');
      } else if (user.role === 'shop') {
        router.push('/shop/dashboard');
      } else {
        router.push('/login'); // fallback ถ้าไม่มี role ที่รู้จัก
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-blue-950 to-indigo-950">
        {/* Moving gradient orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-300"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-600"></div>
        
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              '<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#9C92AC" fill-opacity="0.15"><circle cx="30" cy="30" r="2"/><circle cx="15" cy="15" r="1"/><circle cx="45" cy="45" r="1.5"/></g></g></svg>'
            )}")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      {/* Enhanced White Card Container */}
      <div className="relative z-10 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 w-full max-w-5xl animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
          
          {/* Left Section - Enhanced Buttons */}
          <div className="md:w-1/2 flex flex-col items-center md:items-start justify-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-8 text-center md:text-left leading-tight">
              {t.Home.title}
            </h2>
            
            <div className="flex flex-col gap-5 w-full max-w-sm">
              <a
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-center overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  {t.Home.submit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-all duration-300"></div>
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
              </a>

              <a
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-semibold rounded-2xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-center overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5" />
                  {t.Home.submittwo}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-all duration-300"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-300"></div>
              </a>
            </div>


          </div>

          {/* Right Section - Enhanced Logo and Features */}
          <div className="md:w-1/2 flex flex-col items-center">
            {/* Enhanced Logo */}
            <div className="animate-float mb-6">
              <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                <Car className="relative w-16 h-16 text-blue-900 drop-shadow-lg" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Title */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-900 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-4 leading-tight">
                {t.Home.head}
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 mx-auto rounded-full shadow-lg animate-pulse"></div>
            </div>


          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          50% {
            transform: translateY(-20px) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 8s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
      `}</style>
    </div>
  );
}