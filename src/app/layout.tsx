import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import Providers from "@/components/Providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
  
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deligo - Online Shopping Platform",
  description: "Your one-stop shop for all your needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <Toaster 
              position="top-right"
              containerClassName="toast-container"
              containerStyle={{
                top: 20,
                right: 20,
              }}
              gutter={8}
              toastOptions={{
                // Default options for all toasts
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  maxWidth: '380px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                // Type-specific configurations
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                  },
                },
                loading: {
                  style: {
                    background: '#6b7280',
                    color: '#fff',
                  },
                },
              }}
            />
            {children}
            <Analytics />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
