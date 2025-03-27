// app/layout.tsx
import { AuthProvider } from './contexts/AuthContext';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ระบบล็อกอิน - NextJS และ NodeJS',
  description: 'ระบบล็อกอินที่สร้างด้วย NextJS, NodeJS และ MySQL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}