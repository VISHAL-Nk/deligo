'use client';

import React from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Heart,
  ClipboardList,
  Search,
  Users,
  Store,
  Truck,
  MessageSquare,
  Star,
  FileText,
  Bell,
  FolderOpen,
  Tag,
  RefreshCw,
  LucideIcon,
} from 'lucide-react';

// Predefined empty state configurations
export type EmptyStateVariant =
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'products'
  | 'search'
  | 'users'
  | 'sellers'
  | 'delivery'
  | 'messages'
  | 'reviews'
  | 'notifications'
  | 'categories'
  | 'inventory'
  | 'coupons'
  | 'generic';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  iconColor: string;
  bgColor: string;
}

const variantConfigs: Record<EmptyStateVariant, EmptyStateConfig> = {
  cart: {
    icon: ShoppingCart,
    title: 'Your cart is empty',
    description: 'Looks like you haven\'t added anything to your cart yet. Start shopping to fill it up!',
    ctaText: 'Start Shopping',
    ctaHref: '/',
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  wishlist: {
    icon: Heart,
    title: 'Your wishlist is empty',
    description: 'Save items you love by clicking the heart icon. They\'ll appear here for easy access.',
    ctaText: 'Explore Products',
    ctaHref: '/products',
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-50',
  },
  orders: {
    icon: ClipboardList,
    title: 'No orders yet',
    description: 'You haven\'t placed any orders yet. Start shopping and your orders will appear here.',
    ctaText: 'Start Shopping',
    ctaHref: '/',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  products: {
    icon: Package,
    title: 'No products found',
    description: 'There are no products to display. Try adjusting your filters or search criteria.',
    ctaText: 'Clear Filters',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'We couldn\'t find anything matching your search. Try different keywords or browse categories.',
    ctaText: 'Browse All Products',
    ctaHref: '/products',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  users: {
    icon: Users,
    title: 'No users found',
    description: 'There are no users matching your criteria. Try adjusting your filters.',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  sellers: {
    icon: Store,
    title: 'No sellers found',
    description: 'There are no seller applications to review at the moment.',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  delivery: {
    icon: Truck,
    title: 'No delivery partners found',
    description: 'There are no delivery partner applications to review at the moment.',
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
  },
  messages: {
    icon: MessageSquare,
    title: 'No messages yet',
    description: 'You don\'t have any messages. Start a conversation or wait for customers to reach out.',
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-50',
  },
  reviews: {
    icon: Star,
    title: 'No reviews yet',
    description: 'Be the first to review this product! Share your experience with others.',
    ctaText: 'Write a Review',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  notifications: {
    icon: Bell,
    title: 'No notifications',
    description: 'You\'re all caught up! New notifications will appear here.',
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  categories: {
    icon: FolderOpen,
    title: 'No categories found',
    description: 'There are no categories yet. Create your first category to organize products.',
    ctaText: 'Add Category',
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
  inventory: {
    icon: Package,
    title: 'No inventory items',
    description: 'Your inventory is empty. Add products to start tracking stock levels.',
    ctaText: 'Add Products',
    ctaHref: '/seller/products/new',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  coupons: {
    icon: Tag,
    title: 'No coupons available',
    description: 'There are no active coupons at the moment. Create one to offer discounts to customers.',
    ctaText: 'Create Coupon',
    iconColor: 'text-lime-500',
    bgColor: 'bg-lime-50',
  },
  generic: {
    icon: FileText,
    title: 'Nothing here yet',
    description: 'There\'s nothing to display at the moment. Check back later.',
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
};

interface EmptyStateProps {
  /** Predefined variant for common empty states */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: LucideIcon;
  /** Custom title (overrides variant title) */
  title?: string;
  /** Custom description (overrides variant description) */
  description?: string;
  /** Custom CTA button text (overrides variant ctaText) */
  ctaText?: string;
  /** Custom CTA button href (overrides variant ctaHref) */
  ctaHref?: string;
  /** Custom onClick handler for CTA button */
  onCtaClick?: () => void;
  /** Custom icon color class (overrides variant iconColor) */
  iconColor?: string;
  /** Custom background color class (overrides variant bgColor) */
  bgColor?: string;
  /** Icon size */
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry button click handler */
  onRetry?: () => void;
  /** Children to render below the description */
  children?: React.ReactNode;
}

const iconSizes = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
};

const containerSizes = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
  xl: 'w-28 h-28',
};

export default function EmptyState({
  variant = 'generic',
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  ctaText: customCtaText,
  ctaHref: customCtaHref,
  onCtaClick,
  iconColor: customIconColor,
  bgColor: customBgColor,
  iconSize = 'lg',
  className = '',
  showRetry = false,
  onRetry,
  children,
}: EmptyStateProps) {
  const config = variantConfigs[variant];
  
  const Icon = customIcon || config.icon;
  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const ctaText = customCtaText ?? config.ctaText;
  const ctaHref = customCtaHref ?? config.ctaHref;
  const iconColor = customIconColor || config.iconColor;
  const bgColor = customBgColor || config.bgColor;

  const hasAction = ctaText && (ctaHref || onCtaClick);

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fadeIn ${className}`}
      role="status"
      aria-label={title}
    >
      {/* Icon Container with Animation */}
      <div
        className={`${containerSizes[iconSize]} ${bgColor} rounded-full flex items-center justify-center mb-6 animate-bounce-subtle`}
      >
        <Icon className={`${iconSizes[iconSize]} ${iconColor}`} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md text-sm sm:text-base leading-relaxed">
        {description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasAction && (
          ctaHref && !onCtaClick ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {ctaText}
            </Link>
          ) : (
            <button
              onClick={onCtaClick}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {ctaText}
            </button>
          )
        )}

        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>

      {/* Custom Children */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

// Export a card wrapper variant for consistent styling
export function EmptyStateCard(props: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <EmptyState {...props} />
    </div>
  );
}

// Export small inline variant for tables and lists
export function EmptyStateInline({
  icon: Icon = FileText,
  message = 'No items found',
  className = '',
}: {
  icon?: LucideIcon;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-gray-500 ${className}`}>
      <Icon className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
}

// Export for table empty rows
export function EmptyStateTableRow({
  colSpan,
  icon: Icon = FileText,
  message = 'No items found',
}: {
  colSpan: number;
  icon?: LucideIcon;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12">
        <EmptyStateInline icon={Icon} message={message} />
      </td>
    </tr>
  );
}
