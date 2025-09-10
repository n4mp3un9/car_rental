'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { useLang } from '../../providers';
import { texts } from '../../texts';
import { Car, Bell, User, Clock, AlertCircle, CheckCircle, X, Eye, ArrowLeft, Check } from 'lucide-react';

interface BookingNotification {
  id: number;
  rental_id?: number;
  car_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  rental_status?: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'return_requested';
  payment_status?: 'pending' | 'pending_verification' | 'paid' | 'rejected' | 'refunded' | 'failed';
  total_amount?: number;
  created_at: string;
  brand?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  image_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_id?: number;
  payment_method?: string;
  payment_date?: string;
  proof_image?: string;
  amount?: number;
}

interface ReturnRequest {
  id: number;
  created_at: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  image_url?: string;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  total_amount: number;
}

interface CancellationRequest {
  id: number;
  created_at: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  image_url?: string;
  customer_name: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  total_amount?: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading, isShop } = useAuth();
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = texts[lang];
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingNotification | ReturnRequest | CancellationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'returns' | 'cancelled'>('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ---------- สี badge ต่อสถานะ ----------
  const getChipStyle = (status?: string): React.CSSProperties => {
    const chip = (bg: string, text: string, border?: string) =>
      ({ backgroundColor: bg, color: text, borderColor: border ?? bg, borderWidth: 1 });

    switch (status) {
      case 'pending':                  return chip('#FFE8D5', '#9A3412', '#FB923C');
      case 'pending_verification':     return chip('#F3E8FF', '#6B21A8', '#C084FC');
      case 'confirmed':                return chip('#E6F0FF', '#0B3D91', '#60A5FA');
      case 'ongoing':                  return chip('#EEF2FF', '#1E2366', '#818CF8');
      case 'paid':                     return chip('#E8FFF4', '#065F46', '#34D399');
      case 'completed':                return chip('#F1F5F9', '#1F2937', '#94A3B8');
      case 'return_requested':         return chip('#E0F2FE', '#0C4A6E', '#7DD3FC');
      case 'refunded':                 return chip('#F7FEE7', '#3F6212', '#A3E635');
      case 'cancelled':
      case 'rejected':
      case 'failed':                   return chip('#FFE4E6', '#9F1239', '#F87171');
      default:                         return chip('var(--accent)', 'var(--foreground)', 'var(--border)');
    }
  };
  // --------------------------------------

  const fetchAll = async () => {
    try {
      setDataLoading(true);
      if (!token) throw new Error(t.auth.pleaseLogin || 'Not authenticated');

      const [rentalsRes, paymentsRes, returnsRes, cancelsRes] = await Promise.all([
        axios.get(`${apiUrl}/shop/bookings/pending`, { headers: authHeader }).catch(() => ({ data: { bookings: [] } })),
        axios.get(`${apiUrl}/shop/pending-payments`, { headers: authHeader }).catch(() => ({ data: { payments: [] } })),
        axios.get(`${apiUrl}/shop/returns`, { headers: authHeader }).catch(() => ({ data: { returnRequests: [] } })),
        axios.get(`${apiUrl}/shop/cancellations`, { headers: authHeader }).catch(() => ({ data: { cancellations: [] } })),
      ]);

      const cancellations = (cancelsRes.data.cancellations || []).map((c: any): CancellationRequest => ({
        ...c, id: Number(c.id), total_amount: Number(c.total_amount || 0),
      }));
      const cancelledRentalIds = new Set(cancellations.map((c: CancellationRequest) => c.id));

      const rentals = (rentalsRes.data.bookings || [])
        .filter((r: any) => !cancelledRentalIds.has(r.id))
        .map((r: any): BookingNotification => ({
          ...r, id: Number(r.id), rental_id: r.id,
          total_amount: Number(r.total_amount || 0), created_at: r.created_at,
        }));

      const payments = (paymentsRes.data.payments || [])
        .filter((p: any) => !cancelledRentalIds.has(p.rental_id))
        .map((p: any): BookingNotification => ({
          id: Number(p.rental_id), rental_id: p.rental_id,
          payment_id: Number(p.payment_id || p.id),
          payment_status: p.payment_status, payment_method: p.payment_method,
          payment_date: p.payment_date, proof_image: p.proof_image,
          amount: Number(p.amount || 0), total_amount: Number(p.total_amount || 0),
          brand: p.brand, model: p.model, year: Number(p.year || 0),
          license_plate: p.license_plate, image_url: p.image_url,
          customer_name: p.customer_name, customer_email: p.customer_email,
          start_date: p.start_date, end_date: p.end_date, created_at: p.created_at,
        }));

      const mergedMap = new Map<number, BookingNotification>();
      [...rentals, ...payments].forEach((item) => {
        const k = item.rental_id ?? item.id;
        const prev = mergedMap.get(k);
        mergedMap.set(k, { ...(prev || {}), ...item, id: k });
      });

      const merged = Array.from(mergedMap.values())
        .filter((n) => n.rental_status !== 'cancelled')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(merged);
      setReturnRequests((returnsRes.data.returnRequests || []).map((r: any) => ({
        ...r, id: Number(r.id), total_amount: Number(r.total_amount || 0),
      })));
      setCancellationRequests(cancellations);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || t.notifications.errorFetch || 'Failed to fetch notifications');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) return router.replace('/login');
      if (!isShop()) return router.replace('/dashboard');
      fetchAll();
      const iv = setInterval(fetchAll, 30000);
      return () => clearInterval(iv);
    }
  }, [loading, user, isShop, router]);

  const pendingOnly = useMemo(
    () => notifications.filter(
      (n) => n.rental_status === 'pending' || n.payment_status === 'pending_verification'
    ),
    [notifications]
  );

  const formatDateTime = (value: string | number | Date) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '-';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: lang !== 'th', timeZone: 'Asia/Bangkok', timeZoneName: 'short',
    }).format(dt);
  };

  const pendingCount = pendingOnly.length;

  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(`${baseUrl}${imageUrl}`);
    setShowPreviewModal(true);
  };

  const approveOrReject = async (approve: boolean) => {
    if (!selected) return;
    try {
      if (!token) throw new Error(t.auth.pleaseLogin || 'Not authenticated');

      let endpoint = '';
      if (activeTab === 'returns') {
        endpoint = `${apiUrl}/shop/rentals/${(selected as ReturnRequest).id}/approve-return`;
      } else {
        const item = selected as BookingNotification;
        endpoint =
          item.payment_status === 'pending_verification'
            ? `${apiUrl}/shop/payments/${item.rental_id}/verify`
            : `${apiUrl}/shop/rentals/${item.id}/approve`;
      }

      await axios.post(endpoint, { approve }, { headers: authHeader });

      if (activeTab === 'returns') {
        setReturnRequests((prev) => prev.filter((r) => r.id !== (selected as ReturnRequest).id));
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== (selected as BookingNotification).id));
      }
      window.dispatchEvent(new Event('shop:notifications:refresh'));
      setSuccessMessage(approve ? t.notifications.successApprove : t.notifications.successReject);
    } catch (e: any) {
      setError(e?.response?.data?.message || t.notifications.errorProcess || 'Failed to process');
    } finally {
      setShowDetailModal(false);
      setSelected(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const acknowledgeCancelled = async (id: number) => {
    try {
      await axios.post(`${apiUrl}/shop/cancellations/${id}/acknowledge`, {}, { headers: authHeader });
      setCancellationRequests((prev) => prev.filter((c) => c.id !== id));
      window.dispatchEvent(new Event('shop:cancellation:acknowledged'));
      setSuccessMessage(t.Booking.cancelModal.confirm || 'Acknowledged cancellation');
    } catch (e: any) {
      setError(t.notifications.errorAcknowledge || 'Failed to acknowledge cancellation');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t.common.unknown || 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const dateTimeLabel = t?.notifications?.dateTimeLabel ?? (lang === 'th' ? 'วันที่และเวลา' : 'Date & time');

  const formatDateTimeNoTZ = (value: string | number | Date, lang: 'th' | 'en') => {
    const locale = lang === 'th' ? 'th-TH' : 'en-US';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '-';
    const date = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' }).format(dt);
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: lang !== 'th', timeZone: 'Asia/Bangkok' }).format(dt);
    const joiner = lang === 'th' ? 'เวลา' : 'at';
    return `${date} ${joiner} ${time}`;
  };

  type Item = BookingNotification | ReturnRequest | CancellationRequest;

  const filtered: Item[] = useMemo(() => {
    switch (activeTab) {
      case 'pending': return pendingOnly;
      case 'returns': return returnRequests;
      case 'cancelled': return cancellationRequests;
      default:
        return [...notifications, ...returnRequests, ...cancellationRequests].sort(
          (a, b) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime()
        );
    }
  }, [activeTab, notifications, returnRequests, cancellationRequests, pendingOnly]);

  // --- Tabs ---
  const Tabs = () => {
    const tabs = [
      { k: 'all', label: t.notifications.tabs.all, badge: notifications.length + returnRequests.length + cancellationRequests.length, icon: Bell },
      { k: 'pending', label: t.notifications.tabs.pending, badge: pendingCount, icon: Clock },
      { k: 'returns', label: t.notifications.tabs.returns, badge: returnRequests.length, icon: Check },
      { k: 'cancelled', label: t.notifications.tabs.cancelled, badge: cancellationRequests.length, icon: X }
    ] as any[];

    return (
      <div className="rounded-2xl shadow-lg border transition-colors duration-300" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="border-b transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
          <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto">
            {tabs.map(({ k, label, badge, icon: Icon }) => (
              <button
                key={k}
                onClick={() => setActiveTab(k)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 hover:scale-105 ${activeTab === k ? 'border-b-2 font-semibold' : 'border-transparent'}`}
                style={{ borderColor: activeTab === k ? 'var(--primary)' : 'transparent', color: activeTab === k ? 'var(--primary)' : 'var(--muted-foreground)' }}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                        style={{ backgroundColor: activeTab === k ? 'var(--primary)' : 'var(--accent)', color: activeTab === k ? 'var(--primary-foreground)' : 'var(--accent-foreground)' }}>
                    {badge}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-center gap-3"
                 style={{ backgroundColor: 'var(--destructive)', borderColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-center gap-3"
                 style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', color: 'var(--success-foreground)' }}>
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-300" style={{ borderColor: 'var(--primary)' }} />
              <p className="mt-4 text-lg transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                {t.common.loading || 'กำลังโหลดข้อมูล...'}
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map((item) => (<Card key={`${activeTab}-${(item as any).id}`} item={item} />))}
            </div>
          ) : (
            <div className="rounded-xl shadow-lg border p-10 text-center transition-colors duration-300" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="mx-auto h-20 w-20 rounded-full grid place-items-center mb-4" style={{ backgroundColor: 'var(--accent)' }}>
                <Bell className="h-10 w-10" style={{ color: 'var(--accent-foreground)' }} />
              </div>
              <h3 className="text-xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                {t.notifications.emptyTitle || 'ไม่มีแจ้งเตือน'}
              </h3>
              <p className="mt-2 text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                {t.notifications.emptyDesc || 'ไม่มีแจ้งเตือนในขณะนี้'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Card ---
  const Card = ({ item }: { item: Item }) => {
    const isReturn = activeTab === 'returns';
    const isCancel = activeTab === 'cancelled' || (item as any).rental_status === 'cancelled';
    const img = (item as any).image_url;
    const title = `${(item as any).brand || ''} ${(item as any).model || ''} ${(item as any).year ? `(${(item as any).year})` : ''}`.trim();

    return (
      <div className="rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:-translate-y-0.5"
           style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-20 w-20 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                {img ? (<img src={`${baseUrl}${img}`} alt={title} className="h-full w-full object-cover" />) : (
                  <div className="h-full w-full grid place-items-center" style={{ backgroundColor: 'var(--accent)' }}>
                    <Car className="h-10 w-10" style={{ color: 'var(--accent-foreground)' }} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                  {title || t.common.unknown}
                </div>
                {(item as any).license_plate && (
                  <div className="text-sm transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                    {t.Booking.license ?? 'ป้ายทะเบียน'}: {(item as any).license_plate}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {isReturn ? (
                  <span className="px-3 py-1 rounded-lg text-sm font-semibold border"
                        style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {t.notifications.tabs.returns}
                  </span>
                ) : isCancel ? (
                  <span className="px-3 py-1 rounded-lg text-sm font-semibold border"
                        style={{ backgroundColor: 'var(--destructive)', borderColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
                    {t.status.cancelled}
                  </span>
                ) : (
                  <>
                    {(item as BookingNotification).rental_status && (
                      <span className="px-3 py-1 rounded-lg text-sm font-semibold border"
                            style={getChipStyle((item as BookingNotification).rental_status)}>
                        {t.Booking.status?.[
                          (item as BookingNotification).rental_status as keyof typeof t.Booking.status
                        ] || (item as BookingNotification).rental_status}
                      </span>
                    )}
                    {(item as BookingNotification).payment_status && (
                      <span className="px-3 py-1 rounded-lg text-sm font-semibold border"
                            style={getChipStyle((item as BookingNotification).payment_status)}>
                        {t.payStatus?.[
                          (item as BookingNotification).payment_status as keyof typeof t.payStatus
                        ] || (item as BookingNotification).payment_status}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-1 text-sm">
                {(item as any).customer_name && (
                  <div className="transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                    <User className="w-4 h-4 inline mr-2" />
                    {t.notifications.customer}: {(item as any).customer_name}
                  </div>
                )}
                {(item as any).start_date && (
                  <div className="transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                    <Clock className="w-4 h-4 inline mr-2" />
                    {t.notifications.rentalPeriod}:{' '}
                    {new Date((item as any).start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')} -{' '}
                    {new Date((item as any).end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                  </div>
                )}
                {'payment_date' in (item as any) && (item as any).payment_date && (
                  <div className="transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {t?.notifications?.paymentInfo || 'ข้อมูลการชำระเงิน'}: {formatDateTimeNoTZ((item as any).payment_date, lang)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isCancel && (
                <>
                  {(item as any).proof_image && (
                    <button type="button" onClick={() => openImagePreview((item as any).proof_image)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}>
                      <Eye className="w-4 h-4 inline mr-2" />
                      {t.notifications.viewProof || 'ดูหลักฐาน'}
                    </button>
                  )}
                  {(item as any).total_amount && (
                    <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                      ฿{Number((item as any).total_amount).toLocaleString()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelected(item as any); setShowDetailModal(true); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    {isReturn ? (
                      <>
                        <Check className="w-4 h-4 inline mr-2" />
                        {t.notifications.approveReturn || 'อนุมัติการคืน'}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 inline mr-2" />
                        {t.notifications.review || 'ตรวจสอบ'}
                      </>
                    )}
                  </button>
                </>
              )}
              {isCancel && (
                <button
                  type="button"
                  onClick={() => { setSelected(item as any); setShowDetailModal(true); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {t.notifications.review || 'ตรวจสอบ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--primary)' }}>
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold transition-colors duration-300" style={{ color: 'var(--foreground)' }}>
                {t.notifications.title ?? 'การแจ้งเตือน'}
              </h1>
              <p className="text-lg transition-colors duration-300" style={{ color: 'var(--muted-foreground)' }}>
                {t.notifications.count?.(filtered.length) ?? `มีการแจ้งเตือนทั้งหมด ${filtered.length} รายการ`}
              </p>
            </div>
          </div>
        </div>

        <Tabs />
      </div>

      {/* ===== Modal: Pending/Returns ===== */}
      {showDetailModal && selected && activeTab !== 'cancelled' && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4" onClick={() => setShowDetailModal(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div
              className="relative rounded-lg shadow-xl max-w-2xl w-full transition-colors duration-300"
              style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full grid place-items-center" style={{ backgroundColor: 'var(--accent)' }}>
                    <CheckCircle className="h-7 w-7" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {activeTab === 'returns' ? t.notifications.approveReturn : t.notifications.review}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {activeTab === 'returns' ? t.notifications.returnNote : t.notifications.reviewNote}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
                  <div className="space-y-2 text-sm">
                    {(selected as any).customer_name && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.customer}</span>
                        <span className="font-semibold">{(selected as any).customer_name}</span>
                      </div>
                    )}
                    {(selected as any).customer_email && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.email}</span>
                        <span className="font-semibold">{(selected as any).customer_email}</span>
                      </div>
                    )}
                    {(selected as any).brand && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.type}</span>
                        <span className="font-semibold">
                          {(selected as any).brand} {(selected as any).model} {(selected as any).year ? `(${(selected as any).year})` : ''}
                        </span>
                      </div>
                    )}
                    {(selected as any).license_plate && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}> {t.notifications.license} </span>
                        <span className="font-semibold">{(selected as any).license_plate}</span>
                      </div>
                    )}
                    {(selected as any).start_date && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.start} </span>
                        <span className="font-semibold">
                          {new Date((selected as any).start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                    )}
                    {(selected as any).end_date && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.end}</span>
                        <span className="font-semibold">
                          {new Date((selected as any).end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                    )}
                    {(selected as any).total_amount && (
                      <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}> {t.notifications.money} </span>
                        <span className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                          ฿{Number((selected as any).total_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(selected as any).proof_image && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">{t.notifications.proofOfPayment}</h4>
                    <div className="rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={`${baseUrl}${(selected as any).proof_image}`}
                        alt="หลักฐานการชำระเงิน"
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '250px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => openImagePreview((selected as any).proof_image)}
                      className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      {t.notifications.viewLarge}
                    </button>
                  </div>
                )}

                <div className="mt-6 p-4 rounded-lg flex items-start gap-3 transition-colors duration-300" style={{ backgroundColor: 'var(--accent)' }}>
                  <AlertCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {activeTab === 'returns'
                      ? (t.notifications.returnNote || 'หากอนุมัติการคืนรถ รถจะกลับไปเป็นสถานะพร้อมเช่า')
                      : (t.notifications.reviewNote || 'หากอนุมัติการจอง ลูกค้าจะเช่ารถได้ตามกำหนด หากปฏิเสธจะแจ้งลูกค้าว่าการจองถูกปฏิเสธ')}
                  </p>
                </div>
              </div>

              <div className="p-6 flex justify-end gap-3 transition-colors duration-300" style={{ backgroundColor: 'var(--card)' }}>
                <button
                  type="button"
                  onClick={() => approveOrReject(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg"
                  style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground)' }}
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {t.notifications.cf}
                </button>
                <button
                  type="button"
                  onClick={() => approveOrReject(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg"
                  style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
                >
                  <X className="w-4 h-4 inline mr-2" />
                  {t.notifications.cc}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  {t.common.close || 'ปิด'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Cancelled ===== */}
      {showDetailModal && selected && activeTab === 'cancelled' && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4" onClick={() => setShowDetailModal(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div
              className="relative rounded-lg shadow-xl max-w-2xl w-full transition-colors duration-300"
              style={{ backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full grid place-items-center" style={{ backgroundColor: 'var(--accent)' }}>
                    <X className="h-7 w-7" style={{ color: 'var(--destructive)' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t.notifications.cancellationDetails || 'รายละเอียดการยกเลิก'}</h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {t.notifications.cancellationDetailsDesc || 'ตรวจสอบรายละเอียดการยกเลิกจากลูกค้า'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg transition-colors duration-300" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
                  <div className="space-y-2 text-sm">
                    {(selected as CancellationRequest).customer_name && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.customer}</span>
                        <span className="font-semibold">{(selected as CancellationRequest).customer_name}</span>
                      </div>
                    )}
                    {(selected as CancellationRequest).customer_email && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}> {t.notifications.email}</span>
                        <span className="font-semibold">{(selected as CancellationRequest).customer_email}</span>
                      </div>
                    )}
                    {(selected as CancellationRequest).brand && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.type}</span>
                        <span className="font-semibold">
                          {(selected as CancellationRequest).brand} {(selected as CancellationRequest).model} {(selected as CancellationRequest).year ? `(${(selected as CancellationRequest).year})` : ''}
                        </span>
                      </div>
                    )}
                    {(selected as CancellationRequest).license_plate && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.license}</span>
                        <span className="font-semibold">{(selected as CancellationRequest).license_plate}</span>
                      </div>
                    )}
                    {(selected as CancellationRequest).start_date && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.start}</span>
                        <span className="font-semibold">
                          {new Date((selected as CancellationRequest).start_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                    )}
                    {(selected as CancellationRequest).end_date && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.end}</span>
                        <span className="font-semibold">
                          {new Date((selected as CancellationRequest).end_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                        </span>
                      </div>
                    )}
                    {(selected as any).total_amount && (
                      <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>{t.notifications.money}</span>
                        <span className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                          ฿{Number((selected as any).total_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg flex items-start gap-3 transition-colors duration-300" style={{ backgroundColor: 'var(--accent)' }}>
                  <AlertCircle className="w-5 h-5" style={{ color: 'var(--destructive)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {t.notifications.cancellationNote || 'การจองนี้ถูกยกเลิกโดยลูกค้าแล้ว กรุณารับทราบเพื่อลบการแจ้งเตือน'}
                  </p>
                </div>
              </div>

              <div className="p-6 flex justify-end gap-3 transition-colors duration-300" style={{ backgroundColor: 'var(--card)' }}>
                <button
                  type="button"
                  onClick={() => { acknowledgeCancelled((selected as CancellationRequest).id); setShowDetailModal(false); setSelected(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {t.notifications.acknowledge || 'รับทราบ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  {t.common.close || 'ปิด'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Image Preview Modal ===== */}
      {showPreviewModal && previewImage && (
        <div className="fixed inset-0 z-[110] overflow-y-auto" onClick={() => setShowPreviewModal(false)}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/75" />
            <div
              className="relative rounded-lg overflow-hidden max-w-4xl max-h-[95vh] shadow-xl transition-colors duration-300"
              style={{ backgroundColor: 'var(--card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full transition-colors duration-300"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">ปิด</span>
              </button>
              <div className="p-2">
                <img src={previewImage} alt="หลักฐานการชำระเงิน" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
