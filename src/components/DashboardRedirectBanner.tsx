// src/components/DashboardRedirectBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { X, ArrowRight, Store, Truck, Shield, LayoutDashboard } from 'lucide-react';

const BANNER_DISMISS_KEY = 'dashboard_banner_dismissed';

type UserRole = 'customer' | 'seller' | 'delivery' | 'support' | 'admin';

interface RoleConfig {
  title: string;
  description: string;
  dashboardUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  buttonColor: string;
}

const roleConfigs: Record<string, RoleConfig> = {
  seller: {
    title: 'Seller Dashboard Available',
    description: 'Manage your products, orders, and analytics from your seller dashboard.',
    dashboardUrl: '/seller',
    icon: Store,
    bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
    textColor: 'text-blue-800',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  delivery: {
    title: 'Driver Dashboard Available',
    description: 'View available deliveries, manage your assignments, and track earnings.',
    dashboardUrl: '/driver',
    icon: Truck,
    bgColor: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
    textColor: 'text-orange-800',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  admin: {
    title: 'Admin Dashboard Available',
    description: 'Access the admin panel to manage users, orders, and platform settings.',
    dashboardUrl: '/admin',
    icon: Shield,
    bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
    textColor: 'text-purple-800',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  support: {
    title: 'Support Dashboard Available',
    description: 'View and manage customer support tickets and inquiries.',
    dashboardUrl: '/support',
    icon: LayoutDashboard,
    bgColor: 'bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200',
    textColor: 'text-teal-800',
    buttonColor: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
};

// Extended session type to include role
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

export default function DashboardRedirectBanner() {
  const { data: session, status } = useSession();
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash
  const [isVisible, setIsVisible] = useState(false);

  // Cast session user to extended type
  const user = session?.user as ExtendedUser | undefined;

  useEffect(() => {
    // Check if banner was previously dismissed for this session
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
      const userRole = user?.role;
      
      // Only show banner if:
      // 1. User is authenticated
      // 2. User has a non-customer role
      // 3. Banner hasn't been dismissed for this role
      if (
        status === 'authenticated' && 
        userRole && 
        userRole !== 'customer' &&
        roleConfigs[userRole]
      ) {
        const dismissedRoles = dismissed ? JSON.parse(dismissed) : {};
        if (!dismissedRoles[userRole]) {
          setIsDismissed(false);
          // Small delay to trigger animation
          setTimeout(() => setIsVisible(true), 100);
        }
      }
    }
  }, [user, status]);

  const handleDismiss = () => {
    const userRole = user?.role;
    if (userRole && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
      const dismissedRoles = dismissed ? JSON.parse(dismissed) : {};
      dismissedRoles[userRole] = true;
      localStorage.setItem(BANNER_DISMISS_KEY, JSON.stringify(dismissedRoles));
    }
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300); // Wait for animation
  };

  // Don't render if dismissed or loading
  if (isDismissed || status === 'loading') return null;
  
  const userRole = user?.role;
  if (!userRole || userRole === 'customer' || !roleConfigs[userRole]) return null;

  const config = roleConfigs[userRole];
  const Icon = config.icon;

  return (
    <div
      className={`
        ${config.bgColor} border-b
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Icon and Message */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white shadow-sm`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className={`font-semibold ${config.textColor}`}>
                👋 {config.title}
              </span>
              <span className={`text-sm ${config.textColor} opacity-90 hidden md:inline`}>
                — {config.description}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={config.dashboardUrl}
              className={`
                ${config.buttonColor}
                inline-flex items-center gap-2 px-4 py-2 rounded-lg
                font-medium text-sm transition-colors shadow-sm
              `}
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDismiss}
              className={`
                p-2 rounded-lg transition-colors
                hover:bg-white/50 ${config.textColor}
              `}
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
