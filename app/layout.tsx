import './globals.css'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata = {
  title: 'Emaadi',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="fleet-manager-theme">
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <header className="bg-white dark:bg-gray-900 shadow-soft border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                <div className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Mobile Logo */}
                      <div className="lg:hidden flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Fleet</span>
                      </div>
                      
                      {/* Desktop Title */}
                      <div className="hidden lg:block">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Emaadi
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                        Transport and Trading 
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <ThemeToggle />
                      <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </header>
              
              {/* Main Content Area */}
              <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 lg:pb-6">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  )
}