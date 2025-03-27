// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'shop';
  phone?: string;
  address?: string;
  shop_name?: string;
}

export default function Register() {
  const router = useRouter();
  const { register: registerUser, error: authError, loading } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [userType, setUserType] = useState<'customer' | 'shop'>('customer');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormInputs>({
    defaultValues: {
      role: 'customer'
    }
  });
  
  const password = watch('password', '');
  
  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setSubmitError('');
    
    // ลบ confirmPassword ออกเพราะไม่ต้องส่งไปที่ API
    const { confirmPassword, ...registerData } = data;
    
    const success = await registerUser(registerData);
    
    if (success) {
      router.push('/login?registered=true');
    } else {
      setSubmitError(authError || 'การลงทะเบียนล้มเหลว โปรดลองอีกครั้ง');
    }
  };

  const handleUserTypeChange = (type: 'customer' | 'shop') => {
    setUserType(type);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          สร้างบัญชีผู้ใช้
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {submitError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {submitError}
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex justify-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    userType === 'customer' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  onClick={() => handleUserTypeChange('customer')}
                >
                  ลูกค้า
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    userType === 'shop' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                  onClick={() => handleUserTypeChange('shop')}
                >
                  ร้านเช่ารถ
                </button>
              </div>
            </div>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <input 
              type="hidden" 
              {...register('role')} 
              value={userType} 
            />
            
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
                    required: 'กรุณากรอกชื่อผู้ใช้',
                    minLength: {
                      value: 3,
                      message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'
                    }
                  })}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('email', {
                    required: 'กรุณากรอกอีเมล',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'อีเมลไม่ถูกต้อง'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('phone', {
                    required: userType === 'shop' ? 'กรุณากรอกเบอร์โทรศัพท์' : false,
                    pattern: {
                      value: /^[0-9]{9,10}$/,
                      message: 'เบอร์โทรศัพท์ไม่ถูกต้อง'
                    }
                  })}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {userType === 'shop' && (
              <>
                <div>
                  <label htmlFor="shop_name" className="block text-sm font-medium text-gray-700">
                    ชื่อร้านเช่ารถ
                  </label>
                  <div className="mt-1">
                    <input
                      id="shop_name"
                      type="text"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      {...register('shop_name', {
                        required: 'กรุณากรอกชื่อร้านเช่ารถ'
                      })}
                    />
                    {errors.shop_name && (
                      <p className="mt-2 text-sm text-red-600">{errors.shop_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    ที่อยู่ร้าน
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="address"
                      rows={3}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      {...register('address', {
                        required: 'กรุณากรอกที่อยู่ร้าน'
                      })}
                    />
                    {errors.address && (
                      <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('password', {
                    required: 'กรุณากรอกรหัสผ่าน',
                    minLength: {
                      value: 6,
                      message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                    }
                  })}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                ยืนยันรหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('confirmPassword', {
                    required: 'กรุณายืนยันรหัสผ่าน',
                    validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียน'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                มีบัญชีผู้ใช้แล้ว?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}