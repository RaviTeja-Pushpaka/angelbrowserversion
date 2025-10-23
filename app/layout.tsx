import { Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import './globals.css';

const font = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#a855f7',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Angel - AI Assistant for Interviews, Sales & Meetings',
  description: 'Your AI-powered assistant for interviews, sales calls, business meetings, and custom use cases.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="fantasy" className={font.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
