'use client';

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const response = await axios.post('/api/auth/signup', {
                email,
                password,
                confirmPassword
            });
            
            console.log('Signup successful:', response.data);
            // Redirect to verify email page after successful signup
            router.push('/auth/verify-email');
        } catch (error) {
            console.error('Signup error:', error);
            if (error && typeof error === 'object' && 'response' in error && 
                error.response && typeof error.response === 'object' && 
                'data' in error.response && error.response.data && 
                typeof error.response.data === 'object' && 'error' in error.response.data) {
                
                const errorData = error.response.data.error;
                if (typeof errorData === 'string') {
                    setErrors({ general: errorData });
                } else if (Array.isArray(errorData)) {
                    // Handle validation errors
                    const validationErrors: Record<string, string> = {};
                    errorData.forEach((err: { path?: string[]; message: string }) => {
                        validationErrors[err.path?.[0] || 'general'] = err.message;
                    });
                    setErrors(validationErrors);
                }
            } else {
                setErrors({ general: 'An error occurred during signup' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
                <div className="text-red-600 text-sm">{errors.general}</div>
            )}
            
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none text-black focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none text-black focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>
            
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none text-black focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            
            <div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? 'Signing up...' : 'Signup'}
                </button>
            </div>
        </form>
    );
};