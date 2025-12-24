// src/components/ui/SearchFilters.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  IndianRupee,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

// ============ Types ============

export interface FilterState {
  categories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  inStock: boolean;
  hasDiscount: boolean;
}

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: CategoryOption[];
  loading?: boolean;
  resultCount?: number;
  onReset?: () => void;
  className?: string;
}

// ============ Default Filters ============

export const defaultFilters: FilterState = {
  categories: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStock: false,
  hasDiscount: false,
};

// ============ Price Range Presets ============

const priceRanges = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹25,000', min: 10000, max: 25000 },
  { label: 'Above ₹25,000', min: 25000, max: null },
];

// ============ Rating Options ============

const ratingOptions = [
  { value: 4, label: '4★ & above' },
  { value: 3, label: '3★ & above' },
  { value: 2, label: '2★ & above' },
  { value: 1, label: '1★ & above' },
];

// ============ Filter Section Component ============

interface FilterSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, icon, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-green-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// ============ Price Range Slider Component ============

interface PriceRangeSliderProps {
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

function PriceRangeSlider({ minPrice, maxPrice, onChange }: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState<string>(minPrice?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(maxPrice?.toString() || '');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalMin(minPrice?.toString() || '');
    setLocalMax(maxPrice?.toString() || '');
    
    // Check if current values match a preset
    const presetIndex = priceRanges.findIndex(
      (range) => range.min === minPrice && range.max === maxPrice
    );
    setSelectedPreset(presetIndex >= 0 ? presetIndex : null);
  }, [minPrice, maxPrice]);

  const handlePresetClick = (index: number) => {
    const range = priceRanges[index];
    setSelectedPreset(index);
    onChange(range.min, range.max);
  };

  const handleCustomApply = () => {
    const min = localMin ? parseFloat(localMin) : null;
    const max = localMax ? parseFloat(localMax) : null;
    setSelectedPreset(null);
    onChange(min, max);
  };

  const handleClearPrice = () => {
    setLocalMin('');
    setLocalMax('');
    setSelectedPreset(null);
    onChange(null, null);
  };

  return (
    <div className="space-y-4">
      {/* Price Range Presets */}
      <div className="space-y-2">
        {priceRanges.map((range, index) => (
          <label
            key={index}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selectedPreset === index
                ? 'bg-green-50 border border-green-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="price-range"
              checked={selectedPreset === index}
              onChange={() => handlePresetClick(index)}
              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">{range.label}</span>
          </label>
        ))}
      </div>

      {/* Custom Price Range */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Custom Range</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IndianRupee size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="relative flex-1">
            <IndianRupee size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCustomApply}
            className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply
          </button>
          {(minPrice !== null || maxPrice !== null) && (
            <button
              onClick={handleClearPrice}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Rating Filter Component ============

interface RatingFilterProps {
  selectedRating: number | null;
  onChange: (rating: number | null) => void;
}

function RatingFilter({ selectedRating, onChange }: RatingFilterProps) {
  return (
    <div className="space-y-2">
      {ratingOptions.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
            selectedRating === option.value
              ? 'bg-green-50 border border-green-200'
              : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="rating"
            checked={selectedRating === option.value}
            onChange={() => onChange(selectedRating === option.value ? null : option.value)}
            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
          />
          <span className="flex items-center gap-1 text-sm">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < option.value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </span>
            <span className="text-gray-600 ml-1">& above</span>
          </span>
        </label>
      ))}
    </div>
  );
}

// ============ Category Filter Component ============

interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

function CategoryFilter({ categories, selectedCategories, onChange }: CategoryFilterProps) {
  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  if (categories.length === 0) {
    return <p className="text-sm text-gray-500">No categories available</p>;
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {categories.map((category) => (
        <label
          key={category._id}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
            selectedCategories.includes(category._id)
              ? 'bg-green-50 border border-green-200'
              : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="checkbox"
            checked={selectedCategories.includes(category._id)}
            onChange={() => handleCategoryToggle(category._id)}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="flex-1 text-sm text-gray-700">{category.name}</span>
          {category.productCount !== undefined && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {category.productCount}
            </span>
          )}
        </label>
      ))}
    </div>
  );
}

// ============ Active Filter Pills ============

interface ActiveFiltersProps {
  filters: FilterState;
  categories: CategoryOption[];
  onRemove: (type: string, value?: string) => void;
  onClearAll: () => void;
}

function ActiveFilters({ filters, categories, onRemove, onClearAll }: ActiveFiltersProps) {
  const activeFiltersCount = 
    filters.categories.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  if (activeFiltersCount === 0) return null;

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c._id === id);
    return cat?.name || id;
  };

  const getPriceLabel = () => {
    if (filters.minPrice !== null && filters.maxPrice !== null) {
      return `₹${filters.minPrice} - ₹${filters.maxPrice}`;
    } else if (filters.minPrice !== null) {
      return `Above ₹${filters.minPrice}`;
    } else if (filters.maxPrice !== null) {
      return `Under ₹${filters.maxPrice}`;
    }
    return '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-gray-600">Active filters:</span>
      
      {/* Category Pills */}
      {filters.categories.map((catId) => (
        <span
          key={catId}
          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full"
        >
          {getCategoryName(catId)}
          <button
            onClick={() => onRemove('category', catId)}
            className="hover:bg-green-200 rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {/* Price Pill */}
      {(filters.minPrice !== null || filters.maxPrice !== null) && (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
          {getPriceLabel()}
          <button
            onClick={() => onRemove('price')}
            className="hover:bg-blue-200 rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </span>
      )}

      {/* Rating Pill */}
      {filters.minRating !== null && (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
          {filters.minRating}★ & above
          <button
            onClick={() => onRemove('rating')}
            className="hover:bg-yellow-200 rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </span>
      )}

      {/* In Stock Pill */}
      {filters.inStock && (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
          In Stock
          <button
            onClick={() => onRemove('inStock')}
            className="hover:bg-purple-200 rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </span>
      )}

      {/* Discount Pill */}
      {filters.hasDiscount && (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
          Discounted
          <button
            onClick={() => onRemove('discount')}
            className="hover:bg-orange-200 rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </span>
      )}

      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="text-sm text-red-600 hover:text-red-800 hover:underline ml-2"
      >
        Clear all
      </button>
    </div>
  );
}

// ============ Main SearchFilters Component ============

export default function SearchFilters({
  filters,
  onFiltersChange,
  categories,
  loading = false,
  resultCount,
  onReset,
  className = '',
}: SearchFiltersProps) {
  const handleCategoryChange = useCallback((selectedCategories: string[]) => {
    onFiltersChange({ ...filters, categories: selectedCategories });
  }, [filters, onFiltersChange]);

  const handlePriceChange = useCallback((min: number | null, max: number | null) => {
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((rating: number | null) => {
    onFiltersChange({ ...filters, minRating: rating });
  }, [filters, onFiltersChange]);

  const handleInStockChange = useCallback((checked: boolean) => {
    onFiltersChange({ ...filters, inStock: checked });
  }, [filters, onFiltersChange]);

  const handleDiscountChange = useCallback((checked: boolean) => {
    onFiltersChange({ ...filters, hasDiscount: checked });
  }, [filters, onFiltersChange]);

  const handleRemoveFilter = useCallback((type: string, value?: string) => {
    switch (type) {
      case 'category':
        if (value) {
          onFiltersChange({
            ...filters,
            categories: filters.categories.filter((id) => id !== value),
          });
        }
        break;
      case 'price':
        onFiltersChange({ ...filters, minPrice: null, maxPrice: null });
        break;
      case 'rating':
        onFiltersChange({ ...filters, minRating: null });
        break;
      case 'inStock':
        onFiltersChange({ ...filters, inStock: false });
        break;
      case 'discount':
        onFiltersChange({ ...filters, hasDiscount: false });
        break;
    }
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    onFiltersChange(defaultFilters);
    onReset?.();
  }, [onFiltersChange, onReset]);

  const activeFiltersCount = 
    filters.categories.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <ActiveFilters
            filters={filters}
            categories={categories}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAll}
          />
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {loading ? (
              <span className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>{resultCount.toLocaleString()} products found</>
            )}
          </p>
        </div>
      )}

      {/* Filter Sections */}
      <div className="p-4">
        {/* Categories */}
        <FilterSection 
          title="Categories" 
          icon={<Filter size={16} />}
          defaultOpen={true}
        >
          <CategoryFilter
            categories={categories}
            selectedCategories={filters.categories}
            onChange={handleCategoryChange}
          />
        </FilterSection>

        {/* Price Range */}
        <FilterSection 
          title="Price Range" 
          icon={<IndianRupee size={16} />}
          defaultOpen={true}
        >
          <PriceRangeSlider
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onChange={handlePriceChange}
          />
        </FilterSection>

        {/* Rating */}
        <FilterSection 
          title="Customer Rating" 
          icon={<Star size={16} />}
          defaultOpen={true}
        >
          <RatingFilter
            selectedRating={filters.minRating}
            onChange={handleRatingChange}
          />
        </FilterSection>

        {/* Additional Filters */}
        <FilterSection 
          title="More Options" 
          defaultOpen={false}
        >
          <div className="space-y-3">
            {/* In Stock Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-700">In Stock Only</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleInStockChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>

            {/* Discount Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-700">Discounted Items</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.hasDiscount}
                  onChange={(e) => handleDiscountChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

// ============ Mobile Filter Drawer ============

interface MobileFilterDrawerProps extends SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  ...props
}: MobileFilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-sm bg-white z-50 transform transition-transform lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="h-full overflow-y-auto">
          <SearchFilters {...props} />
        </div>

        {/* Apply Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

// ============ Sort Options Component ============

export interface SortOption {
  value: string;
  label: string;
  order: 'asc' | 'desc';
}

export const sortOptions: SortOption[] = [
  { value: 'relevance', label: 'Relevance', order: 'desc' },
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'price-asc', label: 'Price: Low to High', order: 'asc' },
  { value: 'price-desc', label: 'Price: High to Low', order: 'desc' },
  { value: 'rating', label: 'Highest Rated', order: 'desc' },
  { value: 'popularity', label: 'Most Popular', order: 'desc' },
];

interface SortDropdownProps {
  value: string;
  onChange: (value: string, order: 'asc' | 'desc') => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className = '' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = sortOptions.find((opt) => {
    if (opt.value.includes('-')) {
      return opt.value === value;
    }
    return opt.value === value.replace('-asc', '').replace('-desc', '') || 
           opt.value === value;
  }) || sortOptions[0];

  const handleSelect = (option: SortOption) => {
    const sortValue = option.value.includes('-') 
      ? option.value.split('-')[0] 
      : option.value;
    onChange(sortValue, option.order);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <span className="text-sm text-gray-700">Sort by: {selectedOption.label}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  selectedOption.value === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
