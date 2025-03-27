// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormInputs {
  username: string;
  password: string;
  remember?: boolean;
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error: authError, user, loading } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>();
  
  useEffect(() => {
    // ถ้าผู้ใช้ล็อกอินแล้ว ให้ redirect ไปหน้า dashboard
    if (!loading) {
      if (user) {
        // ใช้ replace แทน push เพื่อป้องกันการกลับมายังหน้าก่อนหน้าด้วยปุ่ม back
        router.replace('/dashboard');
      }
    }
    
    // ตรวจสอบว่ามาจากหน้าลงทะเบียนหรือไม่
    const registered = searchParams.get('registered');
    if (registered) {
      setSuccessMessage('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ');
    }
  }, [user, loading, router, searchParams]);
  
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setSubmitError('');
    const success = await login(data.username, data.password);
    
    if (success) {
      router.push('/dashboard');
    } else {
      setSubmitError(authError || 'เข้าสู่ระบบล้มเหลว โปรดตรวจสอบชื่อผู้ใช้และรหัสผ่าน');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          เข้าสู่ระบบ
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {successMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          
          {submitError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('username', {
                    required: 'กรุณากรอกชื่อผู้ใช้'
                  })}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('password', {
                    required: 'กรุณากรอกรหัสผ่าน'
                  })}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('remember')}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  จดจำฉัน
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  ลืมรหัสผ่าน?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชีผู้ใช้?{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  ลงทะเบียน
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}