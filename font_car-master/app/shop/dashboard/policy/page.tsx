'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FileText, Save, Edit, Trash2, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLang } from '../../../providers';
import { texts } from '../../../texts';

export default function ShopPolicyPage() {
  const router = useRouter();
  const { user, loading, isShop } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = texts[lang] ?? {};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const [isMounted, setIsMounted] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [policy, setPolicy] = useState<string>('');
  const [originalPolicy, setOriginalPolicy] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => setIsMounted(true), []);

  // Guard: only shop can access
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isShop()) {
        router.replace('/');
      }
    }
  }, [user, loading, isShop, router]);

  useEffect(() => {
    if (!user || loading || !isMounted) return;

    const fetchPolicy = async () => {
  try {
    setIsFetching(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) throw new Error(t.auth?.notAuthenticated || 'Not authenticated');
    if (!user?.id) throw new Error(t.auth?.notAuthenticated || 'Not authenticated');

    // ✅ ใช้เส้นทางใหม่: /shops/:shopId/policy
    const res = await axios.get(`${API_URL}/shops/${user.id}/policy`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // รองรับได้ทั้งรูปแบบ { policy } หรือ { shop: { policy } }
    const p: string =
      typeof res.data?.policy === 'string'
        ? res.data.policy
        : typeof res.data?.shop?.policy === 'string'
        ? res.data.shop.policy
        : '';

    setOriginalPolicy(p && p.trim() ? p : null);
    setPolicy(p || '');
    setIsEditing(!p || !p.trim()); // ถ้ายังไม่มีนโยบาย เปิดโหมดแก้ไข
  } catch (e: any) {
    console.error('Fetch policy error:', e);
    setError(
      e?.response?.data?.message ||
        t.Policy?.errors?.fetchFailed ||
        'ไม่สามารถโหลดนโยบายได้'
    );
  } finally {
    setIsFetching(false);
  }
};


    fetchPolicy();
  }, [user, loading, isMounted, t]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error(t.auth?.notAuthenticated || 'Not authenticated');

      const body = { policy: policy?.toString() ?? '' };
      if (!body.policy.trim()) {
        setError(t.Policy?.errors?.emptyPolicy || 'กรุณากรอกข้อความนโยบาย');
        setIsSaving(false);
        return;
      }

      if (originalPolicy && originalPolicy.trim()) {
        // UPDATE
        await axios.put(`${API_URL}/shops/policy`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.Policy?.success?.updated || 'แก้นโยบายสำเร็จ');
      } else {
        // CREATE
        await axios.post(`${API_URL}/shops/policy`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t.Policy?.success?.created || 'สร้างนโยบายสำเร็จ');
      }

      setOriginalPolicy(body.policy);
      setIsEditing(false);

      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      console.error('Save policy error:', e);
      setError(e?.response?.data?.message || t.Policy?.errors?.saveFailed || 'บันทึกนโยบายไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error(t.auth?.notAuthenticated || 'Not authenticated');

      await axios.delete(`${API_URL}/shops/policy`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPolicy('');
      setOriginalPolicy(null);
      setIsEditing(true);
      setShowDeleteConfirm(false);
      setSuccess(t.Policy?.success?.deleted || 'ลบนโยบายเรียบร้อย');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      console.error('Delete policy error:', e);
      setError(e?.response?.data?.message || t.Policy?.errors?.deleteFailed || 'ลบนโยบายไม่สำเร็จ');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isMounted || loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2"
             style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{ color: 'var(--primary)', backgroundColor: 'var(--muted)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.common?.back || 'กลับ'}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                {t.Policy?.title || 'จัดการนโยบายร้านค้า'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t.Policy?.subtitle || 'เพิ่ม/แก้ไข/ลบนโยบายที่จะโชว์ให้ลูกค้าเห็นในหน้าร้านของคุณ'}
              </p>
            </div>
          </div>


        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start space-x-3"
               style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-start space-x-3"
               style={{ backgroundColor: '#10b981', color: 'white' }}>
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{success}</div>
          </div>
        )}

        {/* Body */}
        <div className="rounded-2xl shadow-lg border"
             style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          {isFetching ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2"
                   style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }} />
              <p className="mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t.Policy?.loading || 'กำลังโหลดนโยบาย...'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                      {originalPolicy ? (t.Policy?.editTitle || 'แก้ไขนโยบาย') : (t.Policy?.createTitle || 'สร้างนโยบาย')}
                    </h2>
                    <button
                      onClick={() => setShowPreview(p => !p)}
                      className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showPreview ? (t.Policy?.buttons?.hidePreview || 'ซ่อนตัวอย่าง') : (t.Policy?.buttons?.showPreview || 'แสดงตัวอย่าง')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                        {t.Policy?.labels?.policyText || 'ข้อความนโยบาย (จะแสดงต่อผู้ใช้)'}
                      </label>
                      <textarea
                        value={policy}
                        onChange={(e) => setPolicy(e.target.value)}
                        rows={14}
                        className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-2 transition-all duration-200 resize-y"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                       
                      />
                      <div className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {t.common?.characterCount?.replace('{count}', policy.length.toLocaleString()) || `อักขระ: ${policy.length.toLocaleString()}`}
                      </div>
                    </div>

                    {showPreview && (
                      <div className="flex flex-col">
                        <label className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                          {t.Policy?.labels?.preview || 'ตัวอย่างที่ลูกค้าจะเห็น'}
                        </label>
                        <div className="rounded-xl border p-4 whitespace-pre-line"
                             style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                          {policy.trim() ? policy : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.Policy?.noPolicyText || 'ยังไม่มีข้อความ'}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      onClick={() => {
                        setPolicy(originalPolicy || '');
                        setIsEditing(false);
                        setError(null);
                      }}
                      className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                      disabled={isSaving}
                    >
                      {t.common?.cancel || 'ยกเลิก'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          {t.Policy?.buttons?.saving || 'กำลังบันทึก...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t.Policy?.buttons?.save || 'บันทึกนโยบาย'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                    {t.Policy?.previewTitle || 'ตัวอย่างนโยบาย'}
                  </h2>
                  <div className="rounded-xl border p-5 min-h-32 whitespace-pre-line"
                       style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    {originalPolicy?.trim()
                      ? originalPolicy
                      : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.Policy?.noPolicy || 'ยังไม่มีนโยบาย โปรดกด “แก้ไข” เพื่อสร้าง'}</span>}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {originalPolicy ? (t.Policy?.buttons?.edit || 'แก้ไขนโยบาย') : (t.Policy?.buttons?.create || 'สร้างนโยบาย')}
                    </button>
                    
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="inline-block align-middle rounded-2xl text-left overflow-hidden shadow-xl transform transition-all w-full max-w-md relative z-10"
                 style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--destructive)' }}>
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                      {t.Policy?.deleteConfirm?.title || 'ยืนยันการลบนโยบาย'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {t.Policy?.deleteConfirm?.message || 'เมื่อลบแล้วลูกค้าจะไม่เห็นนโยบายบนหน้าร้านของคุณ ต้องการดำเนินการต่อหรือไม่?'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border"
                  style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
                  disabled={isDeleting}
                >
                  {t.common?.cancel || 'ยกเลิก'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
                >
                  {isDeleting ? (t.Policy?.buttons?.deleting || 'กำลังลบ...') : (t.Policy?.buttons?.delete || 'ลบนโยบาย')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}