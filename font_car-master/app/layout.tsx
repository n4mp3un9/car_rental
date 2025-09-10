import { AuthProvider } from './contexts/AuthContext'; 
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';
import ThemeToggle from './components/ThemeToggle';
import { LangProvider } from "./providers";
import { texts } from "./texts";
import LanguageSwitcher from "./components/LanguageSwitcher";


import './globals.css'; 
import type { Metadata } from 'next'; 

export const metadata: Metadata = { title: 'ระบบล็อกอิน - NextJS และ NodeJS', description: 'ระบบล็อกอินที่สร้างด้วย NextJS, NodeJS และ MySQL', };
export default function RootLayout({ children, }: { children: React.ReactNode; }) 

{ 
  return (
    <html lang="th" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LangProvider>
          <ThemeProvider>
            <AuthProvider>
              <ThemeWrapper>
                {/* <ThemeToggle /> */}
                <LanguageSwitcher /> {/* ⬅️ ปุ่มภาษา (fixed top-right) */}
                {children}
              </ThemeWrapper>
            </AuthProvider>
          </ThemeProvider>
        </LangProvider>
      </body>
    </html>
  );
}