'use client'

import React, { useState } from 'react'
import { IPurchaseWithId } from '@/types'
import { formatSAR, formatLitres } from '@/lib/utils'

interface PurchaseListProps {
  purchases: IPurchaseWithId[]
  loading: boolean
  onEdit: (purchase: IPurchaseWithId) => void
  onDelete: (purchaseId: string) => void
}

export default function PurchaseList({ purchases, loading, onEdit, onDelete }: PurchaseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (purchase: IPurchaseWithId) => {
    if (!purchase._id) return
    
    if (!confirm(`Are you sure you want to delete this ${purchase.type.toLowerCase()} transaction?`)) {
      return
    }

    setDeletingId(purchase._id)
    
    try {
      const response = await fetch(`/api/purchases/${purchase._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(purchase._id)
      } else {
        alert('Failed to delete transaction')
      }
    } catch (error) {
      alert('Error deleting transaction')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">⛽</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
        <p className="text-gray-500">Click "Add Transaction" to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <div
          key={purchase._id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  purchase.type === 'Purchase' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {purchase.type}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(purchase.date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Price:</span>
                  <div className={`text-lg font-bold ${
                    purchase.type === 'Purchase' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatSAR(purchase.price)}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Litres:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {formatLitres(purchase.litre)}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Price per Litre:</span>
                  <div className="text-lg font-bold text-gray-900">
                    ر.س {(purchase.price / purchase.litre).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onEdit(purchase)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                title="Edit transaction"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(purchase)}
                disabled={deletingId === purchase._id}
                className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                title="Delete transaction"
              >
                {deletingId === purchase._id ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}