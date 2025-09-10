// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useLang } from "../providers";
import { texts } from "../texts";
import { useAuth } from '../contexts/AuthContext';
import { Car, User, Mail, Lock, Store, CreditCard, AlertCircle } from 'lucide-react';

interface RegisterFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'shop';
  shop_name?: string;
  promptpay_id: string;
}

export default function Register() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { lang } = useLang();
  const t = texts[lang];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormInputs>();

  const password = watch('password');
  const role = watch('role');

  const onSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    setError('');
    try {
      const registerData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.role === 'shop' && data.shop_name ? { shop_name: data.shop_name } : {}),
        ...(data.role === 'shop' && data.promptpay_id ? { promptpay_id: data.promptpay_id } : {})
      };
      const success = await authRegister(registerData);
      if (success) {
        router.push('/login?registered=true');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300"
      style={{ backgroundColor: 'var(--secondary)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-blob animation-delay-600"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              '<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="#9C92AC" fill-opacity="0.1"><circle cx="30" cy="30" r="2"/><circle cx="15" cy="15" r="1"/><circle cx="45" cy="45" r="1.5"/></g></g></svg>'
            )}")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      {/* Main */}
      <div className="relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg">
                <Car className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <h2 className="text-center text-3xl font-extrabold text-white mb-2">
            {t.Login.register}
          </h2>
          <p className="text-center text-white/80">สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            {error && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm font-medium">{error}</span>
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
                    required: 'กรุณากรอกชื่อผู้ใช้',
                    minLength: { value: 3, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }
                  })}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {t.Login.email}
                </label>
                <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  {...register('email', {
                    required: 'กรุณากรอกอีเมล',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'กรุณากรอกอีเมลที่ถูกต้อง' }
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
                  autoComplete="new-password"
                  error={errors.password?.message}
                  className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  {...register('password', {
                    required: 'กรุณากรอกรหัสผ่าน',
                    minLength: { value: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
                  })}
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {t.Login.confirmpassword}
                </label>
                <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  {...register('confirmPassword', {
                    required: 'กรุณายืนยันรหัสผ่าน',
                    validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                  })}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  {t.Login.role}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Customer */}
                  <label
                    htmlFor="role-customer"
                    className={[
                      "cursor-pointer rounded-2xl border p-4 transition-all",
                      "bg-gray-50/50 border-gray-200 hover:border-blue-400 hover:shadow-md",
                      role === "customer" ? "ring-2 ring-blue-500 border-blue-500 bg-white" : ""
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{t.Login.customer}</div>
                        <div className="text-xs text-gray-500">{t.re.s}</div>
                      </div>
                      <input
                        id="role-customer"
                        type="radio"
                        value="customer"
                        className="sr-only"
                        {...register('role', { required: 'กรุณาเลือกบทบาท' })}
                      />
                      <div
                        aria-hidden
                        className={[
                          "w-4 h-4 rounded-full border",
                          role === "customer" ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        ].join(" ")}
                      />
                    </div>
                  </label>

                  {/* Shop */}
                  <label
                    htmlFor="role-shop"
                    className={[
                      "cursor-pointer rounded-2xl border p-4 transition-all",
                      "bg-gray-50/50 border-gray-200 hover:border-purple-400 hover:shadow-md",
                      role === "shop" ? "ring-2 ring-purple-500 border-purple-500 bg-white" : ""
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
                        <Store className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{t.Login.shop}</div>
                        <div className="text-xs text-gray-500">{t.re.shops}</div>
                      </div>
                      <input
                        id="role-shop"
                        type="radio"
                        value="shop"
                        className="sr-only"
                        {...register('role', { required: 'กรุณาเลือกบทบาท' })}
                      />
                      <div
                        aria-hidden
                        className={[
                          "w-4 h-4 rounded-full border",
                          role === "shop" ? "bg-purple-600 border-purple-600" : "border-gray-300"
                        ].join(" ")}
                      />
                    </div>
                  </label>
                </div>

                {errors.role && (
                  <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Shop fields */}
              {role === 'shop' && (
                <div className="space-y-6 pt-6 border-t border-gray-200 animate-slideIn">
                  <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-600" />
                    {t.re.b}
                  </h4>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      {t.Login.shopname}
                    </label>
                    <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      autoComplete="organization"
                      error={errors.shop_name?.message}
                      className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...register('shop_name', {
                        required: role === 'shop' ? 'กรุณากรอกชื่อร้านค้า' : false,
                        minLength: { value: 3, message: 'ชื่อร้านค้าต้องมีอย่างน้อย 3 ตัวอักษร' }
                      })}
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      {t.Login.promptpay}
                    </label>
                    <div className="absolute left-0 top-9 pl-3 flex items-center pointer-events-none">
                      <CreditCard className=" text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      autoComplete="off"
                      error={errors.promptpay_id?.message}
                      className="pl-10 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      {...register('promptpay_id', {
                        required: role === 'shop' ? 'กรุณากรอก PromptPay ID' : false,
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: 'PromptPay ID ต้องเป็นตัวเลข 10-15 หลัก'
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังดำเนินการ...
                  </div>
                ) : (
                  t.re.a
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {t.Login.haveAccount}{' '}
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                  >
                    {t.Login.submit}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animate-slideIn { animation: slideIn .35s ease-out; }
      `}</style>
    </div>
  );
}
