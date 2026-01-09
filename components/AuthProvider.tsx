'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token')
        const user = localStorage.getItem('user')

        if (!token || !user) {
            // Not authenticated, redirect to login unless already on login page
            if (pathname !== '/login') {
                router.push('/login')
            }
            setIsLoading(false)
        } else {
            setIsAuthenticated(true)
            setIsLoading(false)

            // If on login page and authenticated, redirect to dashboard
            if (pathname === '/login') {
                router.push('/')
            }
        }
    }, [pathname, router])

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg mb-4 animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    // If on login page, show it without authentication check
    if (pathname === '/login') {
        return <>{children}</>
    }

    // Only show children if authenticated
    return isAuthenticated ? <>{children}</> : null
}
