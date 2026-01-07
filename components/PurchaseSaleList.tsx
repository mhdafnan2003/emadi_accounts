'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { IBranchWithId, IPurchaseSaleWithId, IVehicleWithId } from '@/types'
import { formatSAR } from '@/lib/utils'

interface PurchaseSaleListProps {
  items: IPurchaseSaleWithId[]
  vehicles: IVehicleWithId[]
  branches: IBranchWithId[]
  loading: boolean
  onEdit: (item: IPurchaseSaleWithId) => void
  onDelete: (id: string) => void
  onUpdated: (item: IPurchaseSaleWithId) => void
}

export default function PurchaseSaleList({ items, vehicles, branches, loading, onEdit, onDelete, onUpdated }: PurchaseSaleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  const vehicleById = useMemo(() => {
    const map = new Map<string, IVehicleWithId>()
    for (const v of vehicles) map.set(v._id, v)
    return map
  }, [vehicles])

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of branches) map.set(b._id, b.branchName)
    return map
  }, [branches])

  const getVehicleLabel = (item: IPurchaseSaleWithId) => {
    const v = vehicleById.get(item.vehicleId)
    const name = item.vehicleName || v?.vehicleName || 'Unknown vehicle'
    const number = item.vehicleNumber || v?.vehicleNumber
    return number ? `${name} (${number})` : name
  }

  const getBranchLabel = (item: IPurchaseSaleWithId) => {
    const v = vehicleById.get(item.vehicleId)
    const branchId = item.branchId || v?.branchId
    if (!branchId) return '—'
    return branchNameById.get(branchId) || 'Unknown branch'
  }

  const handleDelete = async (item: IPurchaseSaleWithId) => {
    if (!item._id) return

    if (!confirm('Are you sure you want to delete this record?')) return

    setDeletingId(item._id)
    try {
      const response = await fetch(`/api/purchase-sales/${item._id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        onDelete(item._id)
      } else {
        alert('Failed to delete record')
      }
    } catch {
      alert('Error deleting record')
    } finally {
      setDeletingId(null)
    }
  }

  const handleComplete = async (item: IPurchaseSaleWithId) => {
    if (!item._id) return
    if ((item as any).completed) return

    const ok = confirm('Complete collection for this Purchase & Sale?')
    if (!ok) return

    setCompletingId(item._id)
    try {
      const response = await fetch(`/api/purchase-sales/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completeCollection: true }),
      })
      const data = await response.json()
      if (data.success) {
        onUpdated(data.data)
      } else {
        alert(data.error || 'Failed to complete collection')
      }
    } catch {
      alert('Error completing collection')
    } finally {
      setCompletingId(null)
    }
  }

  const handleUndoComplete = async (item: IPurchaseSaleWithId) => {
    if (!item._id) return
    if (!(item as any).completed) return

    const ok = confirm('Undo completed collection? This will remove the added revenue entry.')
    if (!ok) return

    setUndoingId(item._id)
    try {
      const response = await fetch(`/api/purchase-sales/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undoCompleteCollection: true }),
      })
      const data = await response.json()
      if (data.success) {
        onUpdated(data.data)
      } else {
        alert(data.error || 'Failed to undo collection')
      }
    } catch {
      alert('Error undoing collection')
    } finally {
      setUndoingId(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🧾</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No purchase & sale records</h3>
        <p className="text-gray-500 dark:text-gray-400">Click Create to add the first record.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opening Balance</th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Balance</th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tins Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              (() => {
                const currentBalance = item.currentBalance ?? item.openingBalance
                const profit = Number(currentBalance || 0) - Number(item.openingBalance || 0)
                const profitClass = profit >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'

                return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <Link
                    href={`/purchase-sales/${item._id}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {getVehicleLabel(item)}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {getBranchLabel(item)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatSAR(item.openingBalance)}
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatSAR(currentBalance)}
                  </div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-lg font-bold ${profitClass}`}>
                    {formatSAR(profit)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {item.currentTins ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleComplete(item)}
                      disabled={Boolean((item as any).completed) || completingId === item._id}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                      title={(item as any).completed ? 'Collection completed' : 'Complete collection'}
                    >
                      {(item as any).completed ? '✅' : (completingId === item._id ? '⏳' : '✔️')}
                    </button>
                    {(item as any).completed ? (
                      <button
                        onClick={() => handleUndoComplete(item)}
                        disabled={undoingId === item._id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Undo completed collection"
                      >
                        {undoingId === item._id ? '⏳' : '↩️'}
                      </button>
                    ) : null}
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item._id}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === item._id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
                )
              })()
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
