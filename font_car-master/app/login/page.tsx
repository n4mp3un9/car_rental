// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { useLang } from "../providers";
import { texts } from "../texts";
import { Car, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface LoginFormInputs {
  username: string;
  password: string;
  remember?: boolean;
}

export default function Login() {
  const router = useRouter();
  const { login, error: authError, loading } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { lang } = useLang();
  const t = texts[lang];
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>();
  
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const registered = url.searchParams.get('registered');
    if (registered && !successMessage) {
      setSuccessMessage('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ');
    }
  }
  
  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitError('');
    try {
      const success = await login(data.username, data.password);
      if (success) {
        const token = localStorage.getItem('token');
        if (token) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const userData = response.data.user;
          if (userData.role === 'customer') {
            router.push('/customer/dashboard');
          } else if (userData.role === 'shop') {
            router.push('/shop/dashboard');
          } else {
            router.push('/');
          }
        }
      } else {
        setSubmitError(authError || t.Login.sub);
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300"
         style={{ backgroundColor: 'var(--secondary)' }}>
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-blob animation-delay-600"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg">
                <Car className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-center text-3xl font-extrabold text-white mb-2">
            {t.Login.title}
          </h2>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            
            {successMessage && (
              <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800 text-sm font-medium">{successMessage}</span>
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm font-medium">{submitError}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Username */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {t.Login.username}
                </label>
                <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  autoComplete="username"
                  error={errors.username?.message}
                  className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  {...register('username', {
                    required: t.Login.validation.usernameRequired
                  })}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {t.Login.password}
                </label>
                <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  {...register('password', {
                    required: t.Login.validation.passwordRequired
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-300"
                    {...register('remember')}
                  />
                  <label htmlFor="remember" className="ml-3 block text-sm text-gray-700 font-medium">
                    {t.Login.rememberMe}
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300">
                    {t.Login.forgotPassword}
                  </a>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t.Login.submitting}
                  </div>
                ) : (
                  t.Login.submit
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t.Login.noAccount}{' '}
                  <Link 
                    href="/register" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                  >
                    {t.Login.register}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}
