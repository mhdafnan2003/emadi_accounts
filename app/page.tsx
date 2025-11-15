'use client'

import { useState, useEffect } from 'react'
import { IVehicle } from '@/models/Vehicle'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner, LoadingCard } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDashboardCurrency, formatDashboardCurrencyArabic } from '@/lib/utils'
import VehicleProfitCard from '@/components/VehicleProfitCard'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
  })
  const [profitData, setProfitData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profitLoading, setProfitLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const [vehiclesResponse, expensesResponse] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/expenses')
      ])
      
      const vehiclesData = await vehiclesResponse.json()
      const expensesData = await expensesResponse.json()
      
      if (vehiclesData.success && expensesData.success) {
        const vehicles = vehiclesData.data
        const expenses = expensesData.data
        
        // Separate expenses by type
        const operationalExpenses = expenses.filter((exp: any) => 
          !exp.expenseType || exp.expenseType === 'other'
        )
        
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyExpenses = expenses
          .filter((exp: any) => {
            const expDate = new Date(exp.date)
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
          })
          .reduce((sum: number, exp: any) => sum + exp.amount, 0)
        
        setStats({
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.length,
          totalDrivers: new Set(vehicles.map((v: IVehicle) => v.driverName)).size,
          totalExpenses: operationalExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
          monthlyExpenses,
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProfitData = async () => {
    try {
      const [vehiclesResponse, expensesResponse] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/expenses')
      ])
      
      const vehiclesData = await vehiclesResponse.json()
      const expensesData = await expensesResponse.json()
      
      if (vehiclesData.success && expensesData.success) {
        const vehicles = vehiclesData.data
        const expenses = expensesData.data.filter((exp: any) => 
          exp.expenseType && ['investment', 'revenue'].includes(exp.expenseType) && exp.vehicleName
        )

        // Calculate profit for each vehicle
        const vehicleProfits = vehicles.map((vehicle: any) => {
          const vehicleExpenses = expenses.filter((exp: any) => exp.vehicleName === vehicle.vehicleName)
          
          const investments = vehicleExpenses
            .filter((exp: any) => exp.expenseType === 'investment')
            .reduce((sum: number, exp: any) => sum + exp.amount, 0)
          
          const revenues = vehicleExpenses
            .filter((exp: any) => exp.expenseType === 'revenue')
            .reduce((sum: number, exp: any) => sum + exp.amount, 0)
          
          const profit = revenues - investments
          
          return {
            vehicleId: vehicle._id,
            vehicleName: vehicle.vehicleName,
            driverName: vehicle.driverName,
            plateNumber: vehicle.vehicleNumber,
            investments,
            revenues,
            profit,
            isProfitable: profit > 0,
            transactionCount: vehicleExpenses.length
          }
        })

        // Sort by profit (highest first)
        vehicleProfits.sort((a, b) => b.profit - a.profit)

        // Calculate totals
        const totalInvestments = vehicleProfits.reduce((sum, vp) => sum + vp.investments, 0)
        const totalRevenues = vehicleProfits.reduce((sum, vp) => sum + vp.revenues, 0)
        const totalProfit = totalRevenues - totalInvestments
        const profitableVehicles = vehicleProfits.filter(vp => vp.isProfitable).length

        setProfitData({
          vehicleProfits,
          summary: {
            totalInvestments,
            totalRevenues,
            totalProfit,
            profitableVehicles,
            totalVehicles: vehicles.length,
            profitMargin: totalRevenues > 0 ? ((totalProfit / totalRevenues) * 100) : 0
          }
        })
      }
    } catch (error) {
      console.error('Error calculating profit data:', error)
    } finally {
      setProfitLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    calculateProfitData()
  }, [])

  // Calculate net revenue (profit - operational expenses)
  const netRevenue = profitData ? profitData.summary.totalProfit - stats.totalExpenses : 0

  const statCards = [
    {
      title: 'Vehicle Profit',
      value: profitData ? formatDashboardCurrencyArabic(Math.abs(profitData.summary.totalProfit)) : formatDashboardCurrencyArabic(0),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: profitData && profitData.summary.totalProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600',
      change: profitData ? `${profitData.summary.profitableVehicles}/${profitData.summary.totalVehicles} profitable` : '0/0 profitable',
      changeType: profitData && profitData.summary.totalProfit >= 0 ? 'positive' as const : 'negative' as const,
    },
    {
      title: 'Total Expenses',
      value: formatDashboardCurrencyArabic(stats.totalExpenses),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      change: 'Operational costs',
      changeType: 'neutral' as const,
    },
    {
      title: 'Net Revenue',
      value: formatDashboardCurrencyArabic(Math.abs(netRevenue)),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: netRevenue >= 0 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600',
      change: 'Profit - Expenses',
      changeType: netRevenue >= 0 ? 'positive' as const : 'negative' as const,
    },
    {
      title: 'This Month',
      value: formatDashboardCurrencyArabic(stats.monthlyExpenses),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: 'Monthly activity',
      changeType: 'neutral' as const,
    },
  ]

  const quickActions = [
    {
      title: 'Manage Vehicles',
      description: 'Add, view, and manage your fleet',
      href: '/vehicles',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'View Profits',
      description: 'Analyze vehicle profitability',
      href: '/expenses',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      title: 'Track Expenses',
      description: 'Monitor and categorize expenses',
      href: '/expenses',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your fleet.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
        ) : (
          statCards.map((card, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-medium transition-all duration-200 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {card.value}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs font-medium ${
                        card.changeType === 'positive' 
                          ? 'text-green-600 dark:text-green-400' 
                          : card.changeType === 'negative'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        summary
                      </span>
                    </div>
                  </div>
                  <div className={`${card.color} p-3 rounded-xl text-white shadow-lg`}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Financial Breakdown */}
      {!loading && !profitLoading && profitData && (
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Financial Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Investment vs Revenue */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Oil Trading</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Investment</span>
                    <span className="font-semibold text-red-600">
                      {formatDashboardCurrencyArabic(profitData.summary.totalInvestments)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-semibold text-green-600">
                      {formatDashboardCurrencyArabic(profitData.summary.totalRevenues)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vehicle Profit</span>
                      <span className={`font-bold ${profitData.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatDashboardCurrencyArabic(Math.abs(profitData.summary.totalProfit))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Operational Costs</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Expenses</span>
                    <span className="font-semibold text-red-600">
                      {formatDashboardCurrencyArabic(stats.totalExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-orange-600">
                      {formatDashboardCurrencyArabic(stats.monthlyExpenses)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Result */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Final Result</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vehicle Profit</span>
                    <span className={`font-semibold ${profitData.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitData.summary.totalProfit >= 0 ? '+' : '-'}{formatDashboardCurrencyArabic(Math.abs(profitData.summary.totalProfit))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expenses</span>
                    <span className="font-semibold text-red-600">
                      -{formatDashboardCurrencyArabic(stats.totalExpenses)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Net Revenue</span>
                      <span className={`font-bold text-lg ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netRevenue >= 0 ? '+' : '-'}{formatDashboardCurrencyArabic(Math.abs(netRevenue))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-medium"
              >
                <div className={`${action.color} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
                <svg className="w-5 h-5 ml-auto text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Profits Section */}
      <Card className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Vehicle Profits</span>
            </div>
            <Link 
              href="/expenses" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              View Details →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profitLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48"></div>
                </div>
              ))}
            </div>
          ) : profitData && profitData.vehicleProfits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profitData.vehicleProfits.slice(0, 6).map((vehicleProfit: any, index: number) => (
                <div key={vehicleProfit.vehicleId} className="animate-slide-up" style={{ animationDelay: `${600 + index * 100}ms` }}>
                  <VehicleProfitCard vehicleProfit={vehicleProfit} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No profit data available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start recording investments and revenues to see vehicle profits here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card className="animate-slide-up" style={{ animationDelay: '1300ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No recent activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start by adding vehicles or recording expenses to see activity here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}