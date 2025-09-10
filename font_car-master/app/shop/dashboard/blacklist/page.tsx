"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search, UserX, UserCheck, AlertCircle, Users, Shield } from "lucide-react";
import { useLang } from "../../../providers";
import { texts } from "../../../texts";
import { ScrollText, FileText, ShieldCheck } from 'lucide-react';


type Customer = {
  id: number;
  username: string;
  email: string;
};

type BlacklistItem = {
  id: number;              // customer id
  username: string;
  email: string;
  reason?: string | null;
  created_at?: string;
};

const BlacklistDashboard = () => {
  const API_URL = "http://localhost:8000/api";
  const { lang } = useLang();
  const t = texts[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("ดัดแปลงรถโดยไม่ได้รับการอนุญาต");
  const [otherReason, setOtherReason] = useState("");
  const reasonOptions = [
    
  t.blaklist.a,
  t.blaklist.b,
  t.blaklist.c,
  t.blaklist.d,
  t.blaklist.e,
];

  const authHeader = {
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  };

  // ดึงรายการ blacklist เมื่อ mount
  useEffect(() => {
    const fetchBlacklist = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/blacklist`, { headers: authHeader });
        setBlacklist(res.data); // คาดว่าเป็น array
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch blacklist");
      } finally {
        setLoading(false);
      }
    };
    fetchBlacklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ค้นหาลูกค้า
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/blacklist/search?query=${encodeURIComponent(searchQuery.trim())}`,
        { headers: authHeader }
      );
      setCustomers(res.data); // คาดว่าเป็น array
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to search customers");
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มลูกค้าเข้า blacklist
  const handleAddToBlacklist = async (customerId: number) => {
  // --- Start of changes ---
  let finalReason = selectedReason;

  // ตรวจสอบว่าถ้าเลือก 'อื่นๆ' ได้กรอกเหตุผลมาหรือไม่
  if (selectedReason === "อื่นๆ (โปรดระบุ)") {
    if (!otherReason.trim()) {
      setError("โปรดระบุเหตุผลในช่อง 'อื่นๆ'");
      return; // หยุดการทำงานถ้าไม่กรอก
    }
    finalReason = otherReason.trim();
  }
  // --- End of changes ---

  setLoading(true);
  try {
    await axios.post(
      `${API_URL}/blacklist`,
      // ส่ง finalReason ที่เตรียมไว้
      { customerId, reason: finalReason },
      { headers: authHeader }
    );
    // refresh รายการ
    const res = await axios.get(`${API_URL}/blacklist`, { headers: authHeader });
    setBlacklist(res.data);
    
    // รีเซ็ต state เหตุผล (เผื่อกรอก 'อื่นๆ' ไว้)
    setOtherReason(""); 
    
    setError(null);
    // ตัดคนที่เพิ่มแล้วออกจากผลค้นหา (ถ้ายังอยู่)
    setCustomers((list) => list.filter((c) => c.id !== customerId));
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to add to blacklist");
  } finally {
    setLoading(false);
  }
};

  // ลบลูกค้าออกจาก blacklist
  const handleRemoveFromBlacklist = async (customerId: number) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/blacklist`, {
        headers: authHeader,
        data: { customerId },
      });
      // refresh รายการ
      const res = await axios.get(`${API_URL}/blacklist`, { headers: authHeader });
      setBlacklist(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove from blacklist");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTH = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString((lang === 'th' ? 'th-TH' : 'en-US'), {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl  mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <Shield className="text-white w-8 h-8" />
              <h1 className="text-3xl font-bold text-white">{t.blaklist.title}</h1>
            </div>
            <p className="text-red-100 mt-2">{t.blaklist.subtitle}</p>
          </div>

          {/* Search Section */}
          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.blaklist.emai}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    {t.blaklist.search}
                  </>
                )}
              </button>
            </div>

            {/* เหตุผลรวม (ตามรูปแบบ state ที่ให้มา) */}
            <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <label htmlFor="reason-select" className="block text-lg font-semibold text-slate-800 mb-3">
                {t.blaklist.label}
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <select
                    id="reason-select"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white focus:border-red-500 focus:outline-none transition-all duration-200 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                    }}
                  >
                    {reasonOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Input for "Other" reason, shows conditionally */}
                {selectedReason === "อื่นๆ (โปรดระบุ)" && (
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder={t.blaklist.f}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:outline-none transition-all duration-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-red-500 w-5 h-5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {customers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <Users className="text-white w-6 h-6" />
                <h2 className="text-xl font-semibold text-white">{t.blaklist.results}</h2>
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                  {customers.length} {t.blaklist.list}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {customers.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {cust.username?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{cust.username}</p>
                            <p className="text-slate-500 text-sm">{cust.email}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToBlacklist(cust.id)}
                        disabled={loading}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            กำลังเพิ่ม...
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4" />
                            {t.blaklist.add}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Blacklist */}
        <div className="bg-white rounded-2xl  overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <UserX className="text-white w-6 h-6" />
              <h2 className="text-xl font-semibold text-white">{t.blaklist.listname}</h2>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {blacklist.length} {t.blaklist.list}
              </span>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="ml-3 text-slate-600">กำลังโหลด...</p>
              </div>
            )}

            {blacklist.length === 0 && !loading && (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">{t.blaklist.no}</p>
                <p className="text-slate-400 text-sm mt-2">{t.blaklist.notitle}</p>
              </div>
            )}

            {blacklist.length > 0 && (
              <div className="space-y-4">
                {blacklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 border border-red-200 bg-red-50 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {item.username?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.username}</p>
                            <p className="text-slate-600 text-sm">{item.email}</p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <p className="text-sm text-slate-600 mb-1">{t.blaklist.reason}:</p>
                          <p className="text-slate-800 font-medium">{item.reason || "—"}</p>
                        </div>

                        <p className="text-slate-500 text-sm mt-2">
                          {t.blaklist.date}: {formatDateTH(item.created_at)}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemoveFromBlacklist(item.id)}
                          disabled={loading}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              กำลังลบ...
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4" />
                              {t.blaklist.cancel}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlacklistDashboard;
