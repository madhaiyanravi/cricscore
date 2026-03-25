import type { Metadata, Viewport } from 'next';
import { Teko, Inter } from 'next/font/google';
import './globals.css';
import InstallBanner from '@/components/InstallBanner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

const teko = Teko({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a7a3c',
};

export const metadata: Metadata = {
  title: 'CricScore — Live Cricket Scorer',
  description: 'Ball-by-ball cricket scoring. Install as an app and score offline.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CricScore',
  },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${teko.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body antialiased min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <InstallBanner />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
