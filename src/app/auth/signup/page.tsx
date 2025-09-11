'use client'
import FacebookSignInButton from "@/components/FacebookLoginButton"
import GoogleSignInButton from "@/components/GoogleLoginButton"
import { Signup } from "@/components/Signup"
import Link from "next/link"

const SignupPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>
                
                <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
                    {/* OAuth Buttons */}
                    <div className="space-y-3">
                        <GoogleSignInButton />
                        <FacebookSignInButton />
                    </div>
                    
                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>
                    
                    {/* Signup Form */}
                    <Signup />
                </div>
            </div>
        </div>
    )
}

export default SignupPage
