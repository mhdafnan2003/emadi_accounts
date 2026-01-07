'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingCard } from '@/components/ui/LoadingSpinner'
import { formatDashboardCurrencyArabic } from '@/lib/utils'

type Tx = {
  id: string
  source: 'expense' | 'purchase-sale'
  type: string
  date: string
  amount: number
  direction: 'income' | 'expense'
  branchId?: string
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string
  category?: string
  description?: string
  purchaseSaleId?: string
}

type VehicleSummary = {
  vehicleId: string
  vehicleName?: string
  vehicleNumber?: string
  purchase: number
  sale: number
  expense: number
}

type BranchExpense = { branchId: string | null; total: number }

export default function TransactionsPage() {
  const [branches, setBranches] = useState<Array<{ _id: string; branchName: string }>>([])

  const [branchId, setBranchId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [transactions, setTransactions] = useState<Tx[]>([])
  const [byVehicle, setByVehicle] = useState<VehicleSummary[]>([])
  const [branchExpenses, setBranchExpenses] = useState<BranchExpense[]>([])

  const [exporting, setExporting] = useState(false)

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of branches) map.set(b._id, b.branchName)
    return map
  }, [branches])

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (branchId) params.set('branchId', branchId)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const qs = params.toString()
    return `/api/transactions${qs ? `?${qs}` : ''}`
  }, [branchId, dateFrom, dateTo])

  useEffect(() => {
    let cancelled = false
    const loadBranches = async () => {
      try {
        const res = await fetch('/api/branches')
        const data = await res.json()
        if (!cancelled && data?.success) setBranches(data.data || [])
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
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(url)
        const data = await res.json()
        if (!data?.success) throw new Error(data?.error || 'Failed to load transactions')
        if (cancelled) return
        setTransactions(data.data?.transactions || [])
        setByVehicle(data.data?.summaries?.byVehicle || [])
        setBranchExpenses(data.data?.summaries?.branchExpenses || [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load transactions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [url])

  const exportTransactionsToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export')
      return
    }

    const escapeCell = (value: any) => {
      if (value === null || value === undefined) return ''
      const s = String(value)
      if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }

    const rows = transactions.map((tx) => {
      const branchName = tx.branchId ? (branchNameById.get(tx.branchId) || 'Unknown branch') : ''
      const vehicleLabel = tx.vehicleName
        ? `${tx.vehicleName}${tx.vehicleNumber ? ` (${tx.vehicleNumber})` : ''}`
        : ''

      const date = new Date(tx.date)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')

      return {
        Date: `${yyyy}-${mm}-${dd}`,
        Direction: tx.direction,
        Type: tx.type,
        Amount: Number(tx.amount || 0),
        Source: tx.source === 'purchase-sale' ? 'Purchase & Sale' : 'Expense',
        Vehicle: vehicleLabel,
       // VehicleId: tx.vehicleId || '',
        Branch: branchName,
       // BranchId: tx.branchId || '',
        Category: tx.category || '',
        Description: tx.description || '',
        PurchaseSaleId: tx.purchaseSaleId || '',
        TransactionId: tx.id,
      }
    })

    const headers = Object.keys(rows[0] || {})
    const csv = [
      headers.map(escapeCell).join(','),
      ...rows.map((r) => headers.map((h) => escapeCell((r as any)[h])).join(',')),
    ].join('\n')

    // Add UTF-8 BOM so Excel displays Arabic correctly
    const withBom = `\ufeff${csv}`
    const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8;' })

    const now = new Date()
    const fyyyy = now.getFullYear()
    const fmm = String(now.getMonth() + 1).padStart(2, '0')
    const fdd = String(now.getDate()).padStart(2, '0')

    const rangeLabel = `${dateFrom || 'all'}_${dateTo || 'all'}`
    const branchLabel = branchId && branchId !== 'all' ? branchId : 'all'
    const filename = `transactions_${branchLabel}_${rangeLabel}_${fyyyy}-${fmm}-${fdd}.csv`

    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
      </div>

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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date to</label>
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

      <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>All Transactions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              loading={exporting}
              disabled={loading || transactions.length === 0}
              onClick={() => {
                setExporting(true)
                try {
                  exportTransactionsToCSV()
                } finally {
                  setExporting(false)
                }
              }}
              title="Export all visible transactions to an Excel-friendly CSV"
            >
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <LoadingCard />
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Vehicle</th>
                    <th className="py-2 pr-4 font-medium">Branch</th>
                    <th className="py-2 pr-4 font-medium">Amount</th>
                    <th className="py-2 pr-4 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const branchName = tx.branchId ? (branchNameById.get(tx.branchId) || 'Unknown branch') : '—'
                    const vehicleLabel = tx.vehicleName
                      ? `${tx.vehicleName}${tx.vehicleNumber ? ` (${tx.vehicleNumber})` : ''}`
                      : '—'

                    const amountClass = tx.direction === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'

                    const sourceLabel = tx.source === 'purchase-sale' ? 'Purchase & Sale' : 'Expense'

                    return (
                      <tr key={`${tx.source}-${tx.id}`} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                          {tx.type}
                        </td>
                        <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                          {tx.purchaseSaleId ? (
                            <Link
                              href={`/purchase-sales/${tx.purchaseSaleId}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {vehicleLabel}
                            </Link>
                          ) : (
                            vehicleLabel
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{branchName}</td>
                        <td className={`py-3 pr-4 font-medium ${amountClass}`}>
                          {formatDashboardCurrencyArabic(Number(tx.amount || 0))}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{sourceLabel}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle>Vehicle Transactions (Purchase / Sale / Expense)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <LoadingCard />
          ) : byVehicle.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">No vehicle transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-4 font-medium">Vehicle</th>
                    <th className="py-2 pr-4 font-medium">Purchase</th>
                    <th className="py-2 pr-4 font-medium">Sale</th>
                    <th className="py-2 pr-4 font-medium">Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {byVehicle.map((row) => (
                    <tr key={row.vehicleId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        {row.vehicleName || 'Vehicle'}{row.vehicleNumber ? ` (${row.vehicleNumber})` : ''}
                      </td>
                      <td className="py-3 pr-4 text-red-600 dark:text-red-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.purchase || 0))}
                      </td>
                      <td className="py-3 pr-4 text-green-600 dark:text-green-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.sale || 0))}
                      </td>
                      <td className="py-3 pr-4 text-orange-600 dark:text-orange-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.expense || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <CardTitle>Branch Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <LoadingCard />
          ) : branchExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">No branch expenses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-4 font-medium">Branch</th>
                    <th className="py-2 pr-4 font-medium">Total Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {branchExpenses.map((row) => (
                    <tr key={row.branchId || 'no-branch'} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        {row.branchId ? (branchNameById.get(row.branchId) || 'Unknown branch') : '—'}
                      </td>
                      <td className="py-3 pr-4 text-red-600 dark:text-red-400 font-medium">
                        {formatDashboardCurrencyArabic(Number(row.total || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
