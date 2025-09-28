'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const VerifyEmailPage = () => {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | null>(null)
  const [message, setMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Get token from URL search params
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    setToken(urlToken)
  }, [])

  const verifyEmailToken = useCallback(async (verificationToken: string) => {
    setVerificationStatus('pending')
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      
      if (response.ok) {
        setVerificationStatus('success')
        setMessage('Email verified successfully! Redirecting to complete your profile...')
        // Redirect to signin to establish session, then middleware will handle the rest
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setVerificationStatus('error')
        setMessage('Invalid or expired verification link. Please request a new one.')
      }
    } catch {
      setVerificationStatus('error')
      setMessage('An error occurred while verifying your email. Please try again.')
    }
  }, [router])

  useEffect(() => {
    // If there's a token in the URL, verify it
    if (token && isClient) {
      verifyEmailToken(token)
    }
  }, [token, isClient, verifyEmailToken])

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return <div>Loading...</div>
  }

  // Show verification result if there's a token
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="text-center">
              {verificationStatus === 'pending' && (
                <div>
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verifying...</h3>
                  <p className="text-gray-600">Please wait while we verify your email.</p>
                </div>
              )}
              
              {verificationStatus === 'success' && (
                <div>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Successful!</h3>
                  <p className="text-gray-600">{message}</p>
                </div>
              )}
              
              {verificationStatus === 'error' && (
                <div>
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Failed</h3>
                  <p className="text-gray-600 mb-4">{message}</p>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Go back to signup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show "check your email" message if no token
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;ve sent a verification email to your registered email address
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
            <p className="text-gray-600 mb-4">
              Please click the verification link in the email we sent you to verify your account.
            </p>
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage

