// app/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'customer' | 'shop';
  phone?: string;
  address?: string;
  profile_image?: string;
  status: 'active' | 'inactive';
  shop_name?: string;
  shop_description?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isShop: () => boolean;
  isCustomer: () => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'customer' | 'shop';
  phone?: string;
  address?: string;
  shop_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 // แก้ไขในไฟล์ app/contexts/AuthContext.tsx
 useEffect(() => {
  // เพิ่ม state เพื่อติดตามว่าตรวจสอบแล้วหรือยัง
  const checkAuthOnce = async () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetchUserData(token);
        } catch (error) {
          console.error("Error fetching user data:", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      // ไม่ว่าผลลัพธ์จะเป็นอย่างไร ให้ตั้งค่า loading เป็น false
      setLoading(false);
    }
  };
  
  checkAuthOnce();
}, []);

  const fetchUserData = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data');
      // ถ้า token ไม่ถูกต้องหรือหมดอายุ ให้ logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Registering with API URL:", API_URL);
      console.log("Registration data:", userData);
      
      const response = await axios.post(`${API_URL}/register`, userData, {
        timeout: 10000, // เพิ่ม timeout 10 วินาที
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Registration response:", response.data);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Registration error details:', err);
      if (err.response) {
        // มีการตอบกลับจาก server แต่ status code ไม่ใช่ 2xx
        console.error('Server responded with:', err.response.status, err.response.data);
      } else if (err.request) {
        // ส่งคำขอไปแล้วแต่ไม่ได้รับการตอบกลับ
        console.error('No response received:', err.request);
      }
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return false;
      }

      const response = await axios.put(`${API_URL}/profile`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser({...user, ...response.data.user} as User);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Update profile failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isShop = () => {
    return user?.role === 'shop';
  };

  const isCustomer = () => {
    return user?.role === 'customer';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isShop,
        isCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};