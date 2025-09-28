'use client';
import { Search, ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React, { type FormEvent, useState } from 'react'
import LogoutButton from '../Logout';
import SplitText from '../gsap/SplitText';

const Navbar = () => {
    const session = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchTerm)}`); // Using 'query' is a common convention
            setSearchTerm("");
        }
    };

    return (
        <nav className="bg-green-600 text-white px-6 py-3 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">
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
                <div className="hidden md:block relative w-1/2">
                    <form onSubmit={handleSearch} className="flex items-center bg-white rounded-lg px-3 py-1">
                        <input
                            type="text"
                            placeholder="Search for products..."
                            className="flex-grow px-2 py-1 outline-none text-black"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        // onFocus={() => setIsDropdownVisible(true)} // ✅ Show dropdown on focus
                        />
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-700"
                        >
                            <Search size={20} />
                        </button>
                    </form>
                </div>
                <div className="flex items-center gap-6">
                    {/* Fixed Link for the cart below */}
                    <Link href="/cart" className="relative flex items-center">
                        <ShoppingCart size={24} />
                        {/* You can uncomment this when you have the totalItems state */}
                        {/* {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                                {totalItems}
                            </span>
                        )} */}
                    </Link>
                    {session?.status === 'authenticated' ? (
                        <>
                            <Link href="/profile" className="border bordershadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]  p-2 rounded-full hover:bg-green-700 transition text-center">
                                {session.data.user?.name || 'Profile'}
                            </Link>
                            <LogoutButton />
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="hover:underline">
                                Login
                            </Link>
                            <Link href="/auth/register" className="hover:underline">
                                Register
                            </Link>
                        </>
                    )}

                </div>
            </div>
        </nav>
    )
}

export default Navbar;