'use client'

import React, { useState } from 'react'
import { IExpenseWithId, ICategoryWithId } from '@/types'
import { formatSAR } from '@/lib/utils'

interface ExpenseListProps {
  expenses: IExpenseWithId[]
  categories: ICategoryWithId[]
  loading: boolean
  onEdit: (expense: IExpenseWithId) => void
  onDelete: (expenseId: string) => void
}

export default function ExpenseList({ expenses, categories, loading, onEdit, onDelete }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (expense: IExpenseWithId) => {
    if (!expense._id) return
    
    if (!confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      return
    }

    setDeletingId(expense._id)
    
    try {
      const response = await fetch(`/api/expenses/${expense._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(expense._id)
      } else {
        alert('Failed to delete expense')
      }
    } catch (error) {
      alert('Error deleting expense')
    } finally {
      setDeletingId(null)
    }
  }

  const getCategoryColor = (categoryName: string) => {
    const colors = [
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    ]
    
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName)
    return categoryIndex >= 0 ? colors[categoryIndex % colors.length] : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">💰</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No expenses yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Click "Add Expense" to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Title & Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map((expense) => (
              <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {expense.title}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                      {expense.expenseType && expense.expenseType !== 'other' && (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          expense.expenseType === 'investment' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {expense.expenseType === 'investment' ? '🛒 Investment' : '💰 Revenue'}
                        </span>
                      )}
                      {expense.tripId && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          🚛 Trip
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatSAR(expense.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    {expense.vehicleName && (
                      <div className="flex items-center">
                        <span className="text-gray-400 dark:text-gray-500 mr-1">🚗</span>
                        <span>{expense.vehicleName}</span>
                      </div>
                    )}
                    {expense.tripName && (
                      <div className="flex items-center">
                        <span className="text-gray-400 dark:text-gray-500 mr-1">🚛</span>
                        <span>{expense.tripName}</span>
                      </div>
                    )}
                    {expense.description && (
                      <div className="flex items-start">
                        <span className="text-gray-400 dark:text-gray-500 mr-1 mt-0.5">📝</span>
                        <span className="max-w-xs truncate" title={expense.description}>
                          {expense.description}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit expense"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
                      disabled={deletingId === expense._id}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Delete expense"
                    >
                      {deletingId === expense._id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}