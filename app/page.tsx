'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingCard } from '@/components/ui/LoadingSpinner'
import { formatDashboardCurrencyArabic } from '@/lib/utils'

type StatCard = {
  title: string
  value: string
  icon: JSX.Element
  color: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
}

export default function Dashboard() {
  const [branches, setBranches] = useState<Array<{ _id: string; branchName: string }>>([])
  const [branchId, setBranchId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [dashboard, setDashboard] = useState<any>(null)

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (branchId) params.set('branchId', branchId)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const qs = params.toString()
    return `/api/dashboard${qs ? `?${qs}` : ''}`
  }, [branchId, dateFrom, dateTo])

  useEffect(() => {
    let cancelled = false
    const loadBranches = async () => {
      try {
        const res = await fetch('/api/branches')
        const data = await res.json()
        if (!cancelled && data?.success) {
          setBranches(data.data || [])
        }
      } catch {
        // ignore
      }
    }
    loadBranches()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadDashboard = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(dashboardUrl)
        const data = await res.json()
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to load dashboard')
        }
        if (!cancelled) setDashboard(data.data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [dashboardUrl])

  const statCards = useMemo(() => {
    const totalsRevenue = Number(dashboard?.totals?.revenue || 0)
    const totalsExpense = Number(dashboard?.totals?.expense || 0)
    const totalsProfit = Number(dashboard?.totals?.profit || (totalsRevenue - totalsExpense) || 0)
    const todayRevenue = Number(dashboard?.today?.revenue || 0)
    const todayExpense = Number(dashboard?.today?.expense || 0)

    const cards: StatCard[] = [
      {
        title: 'Total Revenue',
        value: formatDashboardCurrencyArabic(totalsRevenue),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        color: 'bg-gradient-to-br from-green-500 to-green-600',
        change: dateFrom || dateTo ? 'Selected range' : 'All time',
        changeType: 'neutral',
      },
      {
        title: 'Total Expense',
        value: formatDashboardCurrencyArabic(totalsExpense),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        color: 'bg-gradient-to-br from-red-500 to-red-600',
        change: dateFrom || dateTo ? 'Selected range' : 'All time',
        changeType: 'neutral',
      },
      {
        title: 'Total Profit',
        value: formatDashboardCurrencyArabic(totalsProfit),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        ),
        color: totalsProfit >= 0
          ? 'bg-gradient-to-br from-green-500 to-green-600'
          : 'bg-gradient-to-br from-red-500 to-red-600',
        change: dateFrom || dateTo ? 'Selected range' : 'All time',
        changeType: 'neutral',
      },
      {
        title: "Today's Revenue",
        value: formatDashboardCurrencyArabic(todayRevenue),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        color: 'bg-gradient-to-br from-green-500 to-green-600',
        change: 'Today',
        changeType: 'neutral',
      },
      {
        title: "Today's Expense",
        value: formatDashboardCurrencyArabic(todayExpense),
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        color: 'bg-gradient-to-br from-red-500 to-red-600',
        change: 'Today',
        changeType: 'neutral',
      },
    ]

    return cards
  }, [dashboard, dateFrom, dateTo])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        {/* <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your fleet.
        </p> */}
      </div>

      {/* Filters */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17.999v-5.585L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date from
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date to
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          {error ? (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          Array.from({ length: statCards.length }).map((_, i) => <LoadingCard key={i} />)
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

      {/* Vehicle-wise Revenue & Expense */}
      <Card className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m4 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v12m16 0a2 2 0 01-2 2H7a2 2 0 01-2-2m16 0H5" />
            </svg>
            <span>Vehicle Revenue & Expense</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ) : (dashboard?.byVehicle?.length || 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-4 font-medium">Vehicle</th>
                    <th className="py-2 pr-4 font-medium">Revenue</th>
                    <th className="py-2 pr-4 font-medium">Expense</th>
                    {/* <th className="py-2 pr-4 font-medium">Profit</th> */}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.byVehicle.map((row: any) => (
                    <tr key={row.vehicleId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        {row.vehicleName}{row.vehicleNumber ? ` (${row.vehicleNumber})` : ''}
                      </td>
                      <td className="py-3 pr-4 text-green-600 dark:text-green-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.revenue || 0))}
                      </td>
                      <td className="py-3 pr-4 text-red-600 dark:text-red-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.expense || 0))}
                      </td>
                      {/* <td className={`py-3 pr-4 font-medium ${Number(row.profit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatDashboardCurrencyArabic(Number(row.profit || 0))}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No vehicle data available for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}