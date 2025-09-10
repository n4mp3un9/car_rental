'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, X } from 'lucide-react';
import { useLang } from "../providers";
import { texts } from "../texts";

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
  color: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance' | 'deleted' | 'hidden';
  description?: string;
  image_url?: string;
}

interface EditImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  car: Car;
}

export default function EditImagesModal({ isOpen, onClose, onSuccess, car }: EditImagesModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    car.image_url ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}` : undefined
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL_CAR || 'http://localhost:8000/api/cars';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  const getToken = () => localStorage.getItem('token');
  const { lang } = useLang();
  const t = texts[lang];

  const handleUploadMainImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const resp = await axios.put(`${apiUrl}/${car.id}/image`, form, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const newUrl: string | undefined = resp.data?.image_url;
      if (newUrl) {
        setImageUrl(`${baseUrl}${newUrl}?t=${Date.now()}`);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadMainImage(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{t.editimages.edit}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

          {/* Upload Section */}
          <div className="mb-6">
            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
              {t.editimages.new}
            </label>
            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <p className="pl-1">{uploading ? 'กำลังอัปโหลด...' : t.editimages.click}</p>
                </div>
                <p className="text-xs text-gray-500">{t.editimages.a}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="image-upload"
              name="image"
              type="file"
              className="sr-only"
              multiple={false}
              accept="image/*"
              onChange={onFileChange}
              disabled={uploading}
            />
          </div>

          {/* Display Current Image */}
          
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {t.editimages.b}
          </button>
        </div>
      </div>
    </div>
  );
}