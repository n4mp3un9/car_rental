'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, ArrowLeft, Car, Upload } from 'lucide-react';
import axios from 'axios';

interface AddCarFormInputs {
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van' | 'luxury' | 'motorbike';
  transmission: 'auto' | 'manual';
  fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  seats: number;
  color: string;
  daily_rate: number;
  insurance_rate?: number;
  description?: string;
}

export default function AddCar() {
  const router = useRouter();
  const { user, loading, isShop } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carId, setCarId] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCarFormInputs>({
    defaultValues: {
      year: new Date().getFullYear(),
      seats: 5,
      car_type: 'sedan',
      transmission: 'auto',
      fuel_type: 'gasoline',
    },
  });

  const carTypes = [
    { value: 'sedan', label: 'รถเก๋ง' },
    { value: 'suv', label: 'รถ SUV' },
    { value: 'hatchback', label: 'รถแฮทช์แบ็ค' },
    { value: 'pickup', label: 'รถกระบะ' },
    { value: 'van', label: 'รถตู้' },
    { value: 'luxury', label: 'รถหรู' },
    { value: 'motorbike', label: 'มอเตอร์ไซค์' },
  ];

  const transmissionTypes = [
    { value: 'auto', label: 'อัตโนมัติ' },
    { value: 'manual', label: 'ธรรมดา' },
  ];

  const fuelTypes = [
    { value: 'gasoline', label: 'น้ำมันเบนซิน' },
    { value: 'diesel', label: 'น้ำมันดีเซล' },
    { value: 'hybrid', label: 'ไฮบริด' },
    { value: 'electric', label: 'ไฟฟ้า' },
  ];

  // รีเซ็ตฟอร์มและ state สำหรับเพิ่มรถคันใหม่
  const startNewCar = () => {
    setCarId(null);
    setShowImageUpload(false);
    setSelectedFiles([]);
    setUploadingImages(false);
    setUploadError('');
    setUploadSuccess(false);
    setSubmitError('');
    setFileInputKey(Date.now());
    reset({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      car_type: 'sedan',
      transmission: 'auto',
      fuel_type: 'gasoline',
      seats: 5,
      color: '',
      daily_rate: 0,
      insurance_rate: undefined,
      description: '',
    });
  };

  const onSubmit: SubmitHandler<AddCarFormInputs> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('กรุณาเข้าสู่ระบบ');

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newId: number = res.data.carId;
      setCarId(newId);
      setShowImageUpload(true);
      setSelectedFiles([]);
      setUploadError('');
      setUploadSuccess(false);
      setFileInputKey(Date.now());
    } catch (err: any) {
      console.error('Add car error:', err);
      setSubmitError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มรถยนต์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      setUploadError('');
      setUploadSuccess(false); // รีเซ็ตสถานะสำเร็จเมื่อเลือกไฟล์ใหม่
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0 || !carId) {
      setUploadError('กรุณาเลือกรูปภาพ');
      return;
    }

    try {
      setUploadingImages(true);
      setUploadError('');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('กรุณาเข้าสู่ระบบ');

      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('car_images', file);
        if (index === 0) formData.append('is_primary', 'true');
      });

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadSuccess(true);
    } catch (err: any) {
      console.error('Upload images error:', err);
      setUploadError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploadingImages(false);
    }
  };

  // ตรวจสอบว่าเป็นร้านเช่ารถหรือไม่
  useEffect(() => {
    if (!loading && user && !isShop()) {
      router.push('/');
    }
  }, [user, loading, isShop, router]);

  // รีเซ็ตสถานะการอัปโหลดเมื่อเปลี่ยน carId
  useEffect(() => {
    if (carId) {
      setSelectedFiles([]);
      setUploadSuccess(false);
      setUploadError('');
      setFileInputKey(Date.now());
    }
  }, [carId]);

  // แสดงหน้าโหลดขณะกำลังตรวจสอบสถานะการล็อกอิน
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500 border-r-green-500"></div>
          <p className="mt-4 text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/shop/dashboard')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับสู่แดชบอร์ด
          </button>
          {showImageUpload && (
            <button
              onClick={startNewCar}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm"
            >
              <Car className="w-4 h-4 mr-2" />
              เพิ่มรถคันใหม่
            </button>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">เพิ่มรถยนต์ใหม่</h1>

          {submitError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {!showImageUpload ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                    ยี่ห้อรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="brand"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('brand', { required: 'กรุณากรอกยี่ห้อรถ' })}
                  />
                  {errors.brand && (
                    <p className="mt-2 text-sm text-red-600">{errors.brand.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    รุ่นรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="model"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('model', { required: 'กรุณากรอกรุ่นรถ' })}
                  />
                  {errors.model && (
                    <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    ปีรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('year', {
                      required: 'กรุณากรอกปีรถ',
                      min: { value: 1990, message: 'ปีรถต้องตั้งแต่ 1990 เป็นต้นไป' },
                      max: {
                        value: new Date().getFullYear() + 1,
                        message: `ปีรถต้องไม่เกิน ${new Date().getFullYear() + 1}`,
                      },
                    })}
                  />
                  {errors.year && (
                    <p className="mt-2 text-sm text-red-600">{errors.year.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                    ทะเบียนรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="license_plate"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('license_plate', { required: 'กรุณากรอกทะเบียนรถ' })}
                  />
                  {errors.license_plate && (
                    <p className="mt-2 text-sm text-red-600">{errors.license_plate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="car_type" className="block text-sm font-medium text-gray-700">
                    ประเภทรถ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="car_type"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('car_type', { required: 'กรุณาเลือกประเภทรถ' })}
                  >
                    {carTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.car_type && (
                    <p className="mt-2 text-sm text-red-600">{errors.car_type.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">
                    ระบบเกียร์ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="transmission"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('transmission', { required: 'กรุณาเลือกระบบเกียร์' })}
                  >
                    {transmissionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.transmission && (
                    <p className="mt-2 text-sm text-red-600">{errors.transmission.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                    ประเภทเชื้อเพลิง <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="fuel_type"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('fuel_type', { required: 'กรุณาเลือกประเภทเชื้อเพลิง' })}
                  >
                    {fuelTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.fuel_type && (
                    <p className="mt-2 text-sm text-red-600">{errors.fuel_type.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                    จำนวนที่นั่ง <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="seats"
                    type="number"
                    min="2"
                    max="15"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('seats', {
                      required: 'กรุณากรอกจำนวนที่นั่ง',
                      min: { value: 2, message: 'จำนวนที่นั่งต้องมีอย่างน้อย 2 ที่นั่ง' },
                      max: { value: 15, message: 'จำนวนที่นั่งต้องไม่เกิน 15 ที่นั่ง' },
                    })}
                  />
                  {errors.seats && (
                    <p className="mt-2 text-sm text-red-600">{errors.seats.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    สีรถ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="color"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('color', { required: 'กรุณากรอกสีรถ' })}
                  />
                  {errors.color && (
                    <p className="mt-2 text-sm text-red-600">{errors.color.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
                    ราคาเช่าต่อวัน (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="daily_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('daily_rate', {
                      required: 'กรุณากรอกราคาเช่าต่อวัน',
                      min: { value: 0, message: 'ราคาเช่าต้องไม่ต่ำกว่า 0 บาท' },
                    })}
                  />
                  {errors.daily_rate && (
                    <p className="mt-2 text-sm text-red-600">{errors.daily_rate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="insurance_rate" className="block text-sm font-medium text-gray-700">
                    ค่าประกันต่อวัน (บาท)
                  </label>
                  <input
                    id="insurance_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    {...register('insurance_rate', {
                      min: { value: 0, message: 'ค่าประกันต้องไม่ต่ำกว่า 0 บาท' },
                    })}
                    placeholder="0 (ไม่บังคับ)"
                  />
                  {errors.insurance_rate && (
                    <p className="mt-2 text-sm text-red-600">{errors.insurance_rate.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    กรอกค่าประกันรถต่อวัน (หากไม่มีให้เว้นว่าง)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  {...register('description')}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/shop/dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    'บันทึกข้อมูลรถยนต์'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-green-700">
                    บันทึกข้อมูลรถยนต์สำเร็จ! กรุณาอัปโหลดรูปภาพรถยนต์
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center space-x-3">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-green-700">อัปโหลดรูปภาพสำเร็จ!</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">รูปภาพรถยนต์</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="car-images"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                      >
                        <span>เลือกไฟล์</span>
                        <input
                          key={fileInputKey}
                          id="car-images"
                          name="car-images"
                          type="file"
                          multiple
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploadingImages}
                        />
                      </label>
                      <p className="pl-1">หรือลากและวาง</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF สูงสุด 5MB</p>
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">เลือกแล้ว {selectedFiles.length} ไฟล์:</p>
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {selectedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/shop/dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm"
                >
                  ข้ามการอัปโหลดรูปภาพ
                </button>
                <button
                  type="button"
                  onClick={uploadImages}
                  disabled={selectedFiles.length === 0 || uploadingImages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm disabled:opacity-50"
                >
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    'อัปโหลดรูปภาพ'
                  )}
                </button>
                {uploadSuccess && (
                  <button
                    type="button"
                    onClick={startNewCar}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                  >
                    <Car className="w-4 h-4 mr-2 inline-block" />
                    เพิ่มรถคันใหม่
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}