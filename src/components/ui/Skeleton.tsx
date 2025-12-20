'use client';

import React from 'react';

/**
 * Base Skeleton Component with shimmer animation
 */
interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
}) => {
  const baseClasses = 'bg-gray-200';
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Product Card Skeleton
 */
export const ProductCardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border rounded-xl shadow-sm p-3 bg-white flex flex-col min-w-48"
        >
          {/* Image placeholder */}
          <div className="w-full h-48 mb-3 rounded-lg skeleton-shimmer bg-gray-200" />
          
          {/* Title placeholder */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 skeleton-shimmer" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 skeleton-shimmer" />
          
          {/* Price and button row */}
          <div className="flex justify-between items-center mt-auto">
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer" />
              <div className="h-3 bg-gray-200 rounded w-12 skeleton-shimmer" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Product Grid Skeleton
 */
export const ProductGridSkeleton: React.FC<{ 
  count?: number; 
  columns?: string;
}> = ({ 
  count = 8,
  columns = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
}) => {
  return (
    <div className={`grid ${columns} gap-4`}>
      <ProductCardSkeleton count={count} />
    </div>
  );
};

/**
 * Category Card Skeleton
 */
export const CategoryCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center p-6 bg-gray-50 rounded-xl"
        >
          {/* Icon circle */}
          <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 skeleton-shimmer" />
          {/* Category name */}
          <div className="h-4 bg-gray-200 rounded w-20 skeleton-shimmer" />
        </div>
      ))}
    </>
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton: React.FC<{ 
  columns?: number; 
  rows?: number;
}> = ({ columns = 5, rows = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div 
                className="h-4 bg-gray-200 rounded skeleton-shimmer"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/**
 * User/Profile Card Skeleton
 */
export const UserCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            {/* Name */}
            <div className="h-4 bg-gray-200 rounded w-1/3 skeleton-shimmer" />
            {/* Email */}
            <div className="h-3 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
          </div>
          {/* Action button */}
          <div className="h-8 w-20 bg-gray-200 rounded skeleton-shimmer" />
        </div>
      ))}
    </>
  );
};

/**
 * Order Card Skeleton
 */
export const OrderCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 skeleton-shimmer" />
              <div className="h-3 bg-gray-200 rounded w-24 skeleton-shimmer" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex gap-3">
            {[1, 2].map((item) => (
              <div key={item} className="w-16 h-16 bg-gray-200 rounded skeleton-shimmer" />
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="h-5 bg-gray-200 rounded w-20 skeleton-shimmer" />
            <div className="h-8 w-24 bg-gray-200 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Cart Item Skeleton
 */
export const CartItemSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm flex gap-4">
          {/* Product image */}
          <div className="w-24 h-24 bg-gray-200 rounded-lg skeleton-shimmer flex-shrink-0" />
          
          <div className="flex-1 space-y-2">
            {/* Product name */}
            <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
            {/* Price */}
            <div className="h-5 bg-gray-200 rounded w-20 skeleton-shimmer" />
            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 w-8 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-8 w-8 bg-gray-200 rounded skeleton-shimmer" />
            </div>
          </div>
          
          {/* Delete button */}
          <div className="h-8 w-8 bg-gray-200 rounded skeleton-shimmer" />
        </div>
      ))}
    </>
  );
};

/**
 * Statistics Card Skeleton
 */
export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2 skeleton-shimmer" />
          <div className="h-8 bg-gray-200 rounded w-16 skeleton-shimmer" />
        </div>
      ))}
    </>
  );
};

/**
 * Product Detail Page Skeleton
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back button */}
        <div className="h-6 bg-gray-200 rounded w-20 mb-6 skeleton-shimmer" />
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="h-96 bg-gray-200 rounded-lg mb-4 skeleton-shimmer" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded skeleton-shimmer" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Product info */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
            <div className="h-4 bg-gray-200 rounded w-1/4 skeleton-shimmer" />
            <div className="h-12 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
              <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-12 bg-gray-200 rounded flex-1 skeleton-shimmer" />
              <div className="h-12 bg-gray-200 rounded flex-1 skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Stats Skeleton
 */
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCardSkeleton count={4} />
    </div>
  );
};

/**
 * Seller Product Grid Skeleton
 */
export const SellerProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Product image */}
          <div className="aspect-square bg-gray-200 skeleton-shimmer" />
          
          {/* Product details */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
            <div className="h-3 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
            
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer" />
              <div className="h-4 bg-gray-200 rounded w-12 skeleton-shimmer" />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-3 bg-gray-200 rounded w-12 skeleton-shimmer" />
              <div className="h-3 bg-gray-200 rounded w-16 skeleton-shimmer" />
            </div>
            
            <div className="flex gap-2 pt-2">
              <div className="h-10 bg-gray-200 rounded flex-1 skeleton-shimmer" />
              <div className="h-10 w-10 bg-gray-200 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Search Results Skeleton
 */
export const SearchResultsSkeleton: React.FC<{ 
  count?: number;
  viewMode?: 'grid' | 'list';
}> = ({ count = 8, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm flex gap-4 p-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg skeleton-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
              <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer" />
                <div className="h-3 bg-gray-200 rounded w-20 skeleton-shimmer" />
              </div>
              <div className="h-10 bg-gray-200 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4 skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded skeleton-shimmer" />
            <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer" />
              <div className="h-3 bg-gray-200 rounded w-16 skeleton-shimmer" />
            </div>
            <div className="h-10 bg-gray-200 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Notification List Skeleton
 */
export const NotificationSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-100 flex gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
            <div className="h-3 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
            <div className="h-3 bg-gray-200 rounded w-20 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Review Card Skeleton
 */
export const ReviewSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full skeleton-shimmer" />
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-24 skeleton-shimmer" />
              <div className="h-3 bg-gray-200 rounded w-20 skeleton-shimmer" />
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="w-4 h-4 bg-gray-200 rounded skeleton-shimmer" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
            <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Page Header Skeleton
 */
export const PageHeaderSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 mb-8">
      <div className="h-8 bg-gray-200 rounded w-1/3 skeleton-shimmer" />
      <div className="h-4 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
    </div>
  );
};

/**
 * Filter Bar Skeleton
 */
export const FilterBarSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 h-10 bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-10 w-32 bg-gray-200 rounded skeleton-shimmer" />
        <div className="h-10 w-24 bg-gray-200 rounded skeleton-shimmer" />
      </div>
    </div>
  );
};

export default Skeleton;
