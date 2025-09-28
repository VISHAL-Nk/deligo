'use client';
import { Search, ShoppingCart, User, Settings, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { type FormEvent, useState, useRef, useEffect, useCallback } from 'react'
import LogoutButton from '../Logout';
import SplitText from '../reactBit/SplitText';

// Types for search suggestions
interface SearchSuggestion {
    id: string;
    text: string;
    type: 'product' | 'category' | 'recent' | 'trending';
    count?: number;
    image?: string;
    category?: string;
    price?: number;
}

interface SearchSuggestionsResponse {
    suggestions: SearchSuggestion[];
    categories: SearchSuggestion[];
    trending: SearchSuggestion[];
    recent: SearchSuggestion[];
}

const Navbar = () => {
    const session = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestionsResponse | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Debounce search suggestions
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchSearchSuggestions = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchSuggestions(null);
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSearchSuggestions(data);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            // Fallback to empty suggestions instead of mock data
            setSearchSuggestions({
                suggestions: [],
                categories: [],
                trending: [],
                recent: []
            });
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, []);

    const debouncedFetchSuggestions = useCallback((query: string) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fetchSearchSuggestions(query);
        }, 300);
    }, [fetchSearchSuggestions]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedSuggestionIndex(-1);
        debouncedFetchSuggestions(value);
    };

    const handleSearch = (e?: FormEvent, suggestion?: SearchSuggestion) => {
        if (e?.preventDefault) {
            e.preventDefault();
        }
        const query = suggestion ? suggestion.text : searchTerm;
        if (query.trim()) {
            router.push(`/search?query=${encodeURIComponent(query)}`);
            setSearchTerm("");
            setIsSearchFocused(false);
            setSearchSuggestions(null);
            setSelectedSuggestionIndex(-1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchSuggestions) return;

        const allSuggestions = [
            ...searchSuggestions.suggestions,
            ...searchSuggestions.categories,
            ...searchSuggestions.trending,
            ...searchSuggestions.recent
        ];

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
                prev < allSuggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        } else if (e.key === 'Enter') {
            if (selectedSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedSuggestion = allSuggestions[selectedSuggestionIndex];
                handleSearch(undefined, selectedSuggestion);
            } else {
                // Let the form submission handle it naturally
                return;
            }
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
            setSearchSuggestions(null);
            setSelectedSuggestionIndex(-1);
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        handleSearch(undefined, suggestion);
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 font-medium">$1</mark>');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
                setSearchSuggestions(null);
                setSelectedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderSuggestionItem = (suggestion: SearchSuggestion, index: number, allSuggestionsIndex: number) => {
        const isSelected = selectedSuggestionIndex === allSuggestionsIndex;
        const iconMap = {
            product: <Search size={16} className="text-gray-400" />,
            category: <div className="w-4 h-4 bg-blue-100 rounded border border-blue-300" />,
            recent: <Clock size={16} className="text-gray-400" />,
            trending: <TrendingUp size={16} className="text-orange-400" />
        };

        return (
            <li key={suggestion.id}>
                <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                >
                    {/* Icon or Image */}
                    {suggestion.image ? (
                        <div className="relative w-6 h-6 flex-shrink-0">
                            <Image 
                                src={suggestion.image} 
                                alt={suggestion.text}
                                fill
                                className="object-cover rounded"
                                sizes="24px"
                            />
                        </div>
                    ) : (
                        iconMap[suggestion.type]
                    )}
                    
                    <div className="flex-1 min-w-0">
                        <span 
                            className="block text-sm text-gray-700 truncate"
                            dangerouslySetInnerHTML={{ 
                                __html: highlightMatch(suggestion.text, searchTerm) 
                            }}
                        />
                        {/* Show category for products */}
                        {suggestion.type === 'product' && suggestion.category && (
                            <span className="text-xs text-gray-400 truncate">
                                in {suggestion.category}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        {/* Show price for products */}
                        {suggestion.type === 'product' && suggestion.price && (
                            <span className="font-medium text-green-600">
                                ${suggestion.price}
                            </span>
                        )}
                        {/* Show count */}
                        {suggestion.count && (
                            <span>
                                {suggestion.count} {suggestion.type === 'category' ? 'items' : 'results'}
                            </span>
                        )}
                    </div>
                </button>
            </li>
        );
    };

    return (
        <nav className="bg-green-600 text-white px-4 md:px-6 py-3 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold hover:text-green-100 transition-colors">
                    <SplitText
                        text="Deligo"
                        className="text-2xl font-semibold text-center"
                        delay={100}
                        duration={0.6}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.1}
                        rootMargin="-100px"
                        textAlign="center"  
                    />
                </Link>

                {/* Search Bar - Hidden on mobile, visible on medium screens and up */}
                <div className="hidden md:flex relative flex-1 max-w-md mx-6" ref={searchRef}>
                    <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow-sm w-full">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search for products..."
                            className="flex-grow px-4 py-2 outline-none text-gray-700 text-sm rounded-l-lg"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onFocus={() => {
                                setIsSearchFocused(true);
                                if (searchTerm) {
                                    debouncedFetchSuggestions(searchTerm);
                                }
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                        >
                            <Search size={18} />
                        </button>
                    </form>

                    {/* Search Suggestions Dropdown */}
                    {isSearchFocused && (searchSuggestions || isLoadingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                            {isLoadingSuggestions ? (
                                <div className="px-4 py-3 text-center text-gray-500">
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    <span className="ml-2">Loading suggestions...</span>
                                </div>
                            ) : searchSuggestions ? (
                                <div>
                                    {/* Product Suggestions */}
                                    {searchSuggestions.suggestions.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Products</span>
                                            </div>
                                            <ul>
                                                {searchSuggestions.suggestions.map((suggestion, index) => 
                                                    renderSuggestionItem(suggestion, index, index)
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Categories */}
                                    {searchSuggestions.categories.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Categories</span>
                                            </div>
                                            <ul>
                                                {searchSuggestions.categories.map((suggestion, index) => 
                                                    renderSuggestionItem(suggestion, index, searchSuggestions.suggestions.length + index)
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Trending Searches */}
                                    {searchSuggestions.trending.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Trending</span>
                                            </div>
                                            <ul>
                                                {searchSuggestions.trending.map((suggestion, index) => 
                                                    renderSuggestionItem(
                                                        suggestion, 
                                                        index, 
                                                        searchSuggestions.suggestions.length + searchSuggestions.categories.length + index
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Recent Searches */}
                                    {searchSuggestions.recent && searchSuggestions.recent.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Recent Searches</span>
                                            </div>
                                            <ul>
                                                {searchSuggestions.recent.map((suggestion, index) => 
                                                    renderSuggestionItem(
                                                        suggestion, 
                                                        index, 
                                                        searchSuggestions.suggestions.length + 
                                                        searchSuggestions.categories.length + 
                                                        searchSuggestions.trending.length + index
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Right side navigation */}
                <div className="flex items-center gap-4">
                    {/* Mobile search button */}
                    <button className="md:hidden p-2 hover:bg-green-700 rounded-lg transition-colors">
                        <Search size={20} />
                    </button>

                    {/* Cart */}
                    <Link href="/cart" className="relative p-2 hover:bg-green-700 rounded-lg transition-colors">
                        <ShoppingCart size={20} />
                    </Link>

                    {/* User Authentication */}
                    {session?.status === 'authenticated' ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors duration-200 text-sm font-medium"
                            >
                                <User size={16} />
                                <span className="hidden sm:inline">
                                    {session.data.user?.name || 'User'}
                                </span>
                                <ChevronDown 
                                    size={14} 
                                    className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <User size={16} />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </Link>
                                    <hr className="my-1 border-gray-200" />
                                    <div className="px-4 py-2">
                                        <LogoutButton />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link 
                                href="/auth/signin" 
                                className="px-3 py-2 text-sm font-medium hover:bg-green-700 rounded-lg transition-colors"
                            >
                                Login
                            </Link>
                            <Link 
                                href="/auth/signup" 
                                className="px-3 py-2 bg-green-700 hover:bg-green-800 rounded-lg text-sm font-medium transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="md:hidden mt-3">
                <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg shadow-sm">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="flex-grow px-4 py-2 outline-none text-gray-700 text-sm rounded-l-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                    >
                        <Search size={18} />
                    </button>
                </form>
            </div>
        </nav>
    )
}

export default Navbar;