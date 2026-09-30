import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { UpdateToast } from '@/components/UpdateToast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"SF Pro Text"',
    '"Segoe UI"',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
});

export const metadata: Metadata = {
  title: 'QueueR – Payment QR Wallet',
  description: 'Skip the queue. Flash your QueueR. Mobile-first unified payment cards in Apple Wallet style.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QueueR',
  },
  icons: {
    icon: [
      { url: '/QueueR.png', sizes: '512x512', type: 'image/png' },
      { url: '/QueueR.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/QueueR.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F7' },
    { media: '(prefers-color-scheme: dark)', color: '#1D1D1F' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('queuer_theme') || localStorage.getItem('theme') || 'system';
                  if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else if (t === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-bg text-text" suppressHydrationWarning>
        <ToastProvider>
          {children}
          <UpdateToast />
        </ToastProvider>
      </body>
    </html>
  );
}
