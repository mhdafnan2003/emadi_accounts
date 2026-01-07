import './globals.css'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'

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
          <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              
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