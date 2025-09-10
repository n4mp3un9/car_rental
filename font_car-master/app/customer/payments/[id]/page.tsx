// app/customer/payments/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { useLang } from "../../../providers";
import { texts } from "../../../texts";
import CustomerNav from '../../../components/navcustomer';


interface PaymentInfo {
  rental: {
    id: number;
    car_id: number;
    start_date: string;
    end_date: string;
    total_amount: number;
    days: number;
    brand: string;
    model: string;
    year: number;
    image_url?: string;
  };
  shop_name: string;
  promptpay_id: string;
  total_amount: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer } = useAuth();
  const { lang } = useLang();
  const t = texts[lang];
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPaymentInfo = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const rentalId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentInfo(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching payment info:', err);
      setError(err.response?.data?.message || 'Failed to fetch payment information');
    } finally {
      setDataLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fileReader = new FileReader();
      fileReader.onload = (ev) => {
        if (ev.target?.result) setPreviewUrl(ev.target.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setUploadError('กรุณาเลือกรูปภาพหลักฐานการชำระเงิน'); return; }
    try {
      setIsUploading(true);
      setUploadError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const rentalId = params.id;

      const formData = new FormData();
      formData.append('payment_proof', selectedFile);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}/proof`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      setUploadSuccess(true);
      setTimeout(() => {
        router.push(response.data.redirect_to || `/customer/bookings/${rentalId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      setQrLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const rentalId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}/qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodeData(response.data.qr_code);
    } catch (err: any) {
      console.error('Error fetching QR code:', err);
      // เงียบไว้หากไม่มี QR
    } finally {
      setQrLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('คัดลอกไปยังคลิปบอร์ดแล้ว');
    }).catch(err => console.error('Copy to clipboard failed:', err));
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
      fetchPaymentInfo();
      fetchQRCode();
    }
  }, [user, params.id, isMounted]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      {/* Top Nav */}
      <CustomerNav reviewableRentals={[]} />


      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-4">
            <Link href="/customer/bookings">
              <span className="flex items-center text-sm font-medium"
                    style={{ color: 'var(--primary)' }}>
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                {t.customerpay.back}
              </span>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold leading-tight mb-6" style={{ color: 'var(--foreground)' }}>
            {t.customerpay.title}
          </h1>
          
          {/* Error global */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded border"
                 style={{
                   backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                   borderColor: 'var(--destructive)',
                   color: 'var(--destructive)'
                 }}
                 role="alert">
              {error}
            </div>
          )}
          
          {/* Upload success */}
          {uploadSuccess && (
            <div className="mb-4 px-4 py-3 rounded border"
                 style={{
                   backgroundColor: 'color-mix(in oklab, var(--success) 12%, transparent)',
                   borderColor: 'var(--success)',
                   color: 'var(--success)'
                 }}
                 role="alert">
              <p className="font-bold">อัปโหลดหลักฐานการชำระเงินสำเร็จ!</p>
              <p>ระบบกำลังนำคุณไปยังหน้าสรุปการจอง...</p>
            </div>
          )}
          
          {dataLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                   style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}
                   aria-hidden="true"></div>
              <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : paymentInfo ? (
            <div className="overflow-hidden rounded-lg shadow border"
                 style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              {/* Header */}
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium" style={{ color: 'var(--foreground)' }}>
                  {t.customerpay.sub}
                </h2>
                <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t.customerpay.sub1}
                </p>
              </div>
              
              {/* Body */}
              <div className="px-4 py-5 sm:p-6 space-y-4" style={{ color: 'var(--foreground)' }}>
                {/* Car info */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    {paymentInfo.rental.image_url ? (
                      <div className="h-40 w-full rounded-lg overflow-hidden"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <img 
                          src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${paymentInfo.rental.image_url}`}
                          alt={`${paymentInfo.rental.brand} ${paymentInfo.rental.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full rounded-lg flex items-center justify-center"
                           style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                      {paymentInfo.rental.brand} {paymentInfo.rental.model} {paymentInfo.rental.year}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.customerpay.date}:</span>{' '}
                        {new Date(paymentInfo.rental.start_date).toLocaleDateString(lang === 'th'? 'th-TH' : 'en-US')}
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.customerpay.end}:</span>{' '}
                        {new Date(paymentInfo.rental.end_date).toLocaleDateString(lang === 'th'? 'th-TH' : 'en-US')}
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.customerpay.date}:</span>{' '}
                        {paymentInfo.rental.days} {t.customerpay.day}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment summary */}
                <div className="mt-6">
                  <div className="text-center p-4 rounded-lg"
                       style={{ backgroundColor: 'color-mix(in oklab, var(--primary) 10%, transparent)' }}>
                    <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                      {t.customerpay.tt}
                    </h3>
                    <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                      ฿{paymentInfo.total_amount.toLocaleString()}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {t.customerpay.payment}
                    </p>
                  </div>
                  
                  <div className="mt-4 rounded-lg p-4"
                       style={{ backgroundColor: 'var(--muted)' }}>
                    {/* QR Code */}
                    {qrCodeData && (
                      <div className="mb-6 text-center">
                        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--foreground)' }}>
                          {t.customerpay.qr}
                        </h4>
                        <div className="p-4 rounded-lg inline-block shadow-sm border-2"
                             style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                          <img 
                            src={qrCodeData}
                            alt="PromptPay QR Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                          {t.customerpay.scan}
                        </p>
                      </div>
                    )}
                    
                    {qrLoading && (
                      <div className="mb-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2"
                             style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}
                             aria-hidden="true"></div>
                        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                          กำลังสร้าง QR Code...
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium" style={{ color: 'var(--foreground)' }}>{t.customerpay.shop} {paymentInfo.shop_name}</div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.shop_name)}
                        className="text-sm flex items-center"
                        style={{ color: 'var(--primary)' }}
                        aria-label="คัดลอกชื่อร้าน"
                        title="คัดลอกชื่อร้าน"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t.customerpay.copy}
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.customerpay.pp}:</span>{' '}
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{paymentInfo.promptpay_id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.promptpay_id)}
                        className="text-sm flex items-center"
                        style={{ color: 'var(--primary)' }}
                        aria-label="คัดลอกหมายเลขพร้อมเพย์"
                        title="คัดลอกหมายเลขพร้อมเพย์"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t.customerpay.copy}
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.customerpay.quantity}:</span>{' '}
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                          ฿{paymentInfo.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.total_amount.toString())}
                        className="text-sm flex items-center"
                        style={{ color: 'var(--primary)' }}
                        aria-label="คัดลอกจำนวนเงิน"
                        title="คัดลอกจำนวนเงิน"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t.customerpay.copy}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Upload proof */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4" id="payment-proof-heading" style={{ color: 'var(--foreground)' }}>
                    {t.customerpay.up}
                  </h3>
                  
                  {uploadError && (
                    <div className="mb-4 px-4 py-3 rounded border" role="alert"
                         style={{
                           backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
                           borderColor: 'var(--destructive)',
                           color: 'var(--destructive)'
                         }}>
                      {uploadError}
                    </div>
                  )}
                  
                  <form onSubmit={handleUpload} className="space-y-4" aria-labelledby="payment-proof-heading">
                    <div
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--card)'
                      }}
                    >
                      {previewUrl ? (
                        <div className="w-full">
                          <img
                            src={previewUrl}
                            alt="หลักฐานการชำระเงิน"
                            className="max-h-64 mx-auto object-contain"
                          />
                          <p className="mt-2 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                            คลิกเพื่อเปลี่ยนรูปภาพ
                          </p>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12"
                               fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                               style={{ color: 'var(--muted-foreground)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="mt-2 text-sm" style={{ color: 'var(--foreground)' }}>
                            <p className="font-medium">{t.customerpay.click}</p>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {t.customerpay.click1}
                            </p>
                          </div>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        id="payment_proof"
                        name="payment_proof"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading || uploadSuccess}
                        aria-label="อัปโหลดรูปภาพหลักฐานการชำระเงิน"
                        title="เลือกรูปภาพ"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Link href={`/customer/bookings/${paymentInfo.rental.id}`}>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                          style={{
                            backgroundColor: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                          disabled={isUploading}
                          aria-label="ยกเลิกการอัปโหลด"
                          title="ยกเลิกการอัปโหลด"
                        >
                          {t.customerpay.cc}
                        </button>
                      </Link>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-md shadow-sm text-sm font-medium disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground, #fff)',
                          border: '1px solid transparent'
                        }}
                        disabled={!selectedFile || isUploading || uploadSuccess}
                        aria-label="ยืนยันการชำระเงิน"
                        title="ยืนยันการชำระเงิน"
                      >
                        {isUploading ? 'กำลังอัปโหลด...' : t.customerpay.cf}
                      </button>
                    </div>
                  </form>
                </div>
                
              {/* Tips */}
                <div className="mt-6 rounded p-4"
                    style={{
                      backgroundColor: '#fef2f2',
                      borderLeft: '4px solid #f87171' 
                    }}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {/* info icon */}
                      <svg 
                        className="h-5 w-5 text-yellow-600" 
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-600">{t.customerpay.suggestions}</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1 marker:text-yellow-600">
                          <li className="font-medium text-yellow-600">
                            {t.customerpay.a}
                          </li>
                          <li className="font-medium text-yellow-600">
                            {t.customerpay.b}
                          </li>
                          <li className="font-medium text-yellow-600">
                            {t.customerpay.c}
                          </li>
                          <li className="font-medium text-yellow-600">
                            {t.customerpay.d}
                            </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>{/* /Body */}
            </div>
          ) : (
            <div className="shadow overflow-hidden rounded-lg p-6 text-center border"
                 style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                   style={{ color: 'var(--muted-foreground)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium" style={{ color: 'var(--foreground)' }}>ไม่พบข้อมูลการจอง</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้
              </p>
              <div className="mt-6">
                <Link href="/customer/dashboard">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)', border: '1px solid transparent' }}
                    aria-label="กลับไปยังหน้าหลัก"
                    title="กลับไปยังหน้าหลัก"
                  >
                    กลับไปยังหน้าหลัก
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
