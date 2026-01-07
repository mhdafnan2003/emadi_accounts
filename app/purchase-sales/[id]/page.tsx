'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ICategoryWithId, IPurchaseSaleTransactionWithId, IPurchaseSaleWithId } from '@/types'
import { formatSAR } from '@/lib/utils'

type TxType = 'purchase' | 'sale' | 'expense'

export default function PurchaseSaleDetailPage({ params }: { params: { id: string } }) {
  const id = params.id

  const [item, setItem] = useState<IPurchaseSaleWithId | null>(null)
  const [transactions, setTransactions] = useState<IPurchaseSaleTransactionWithId[]>([])
  const [categories, setCategories] = useState<ICategoryWithId[]>([])

  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [undoing, setUndoing] = useState(false)

  const [activeModal, setActiveModal] = useState<TxType | null>(null)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)

  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    tins: '',
    category: '',
    description: '',
  })

  const fetchItem = async () => {
    const response = await fetch(`/api/purchase-sales/${id}`)
    const data = await response.json()
    if (data.success) setItem(data.data)
  }

  const completeCollection = async () => {
    if (!item?._id) return
    if ((item as any).completed) return

    const ok = window.confirm('Complete collection for this Purchase & Sale?')
    if (!ok) return

    setCompleting(true)
    try {
      const response = await fetch(`/api/purchase-sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completeCollection: true }),
      })
      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to complete collection')
        return
      }
      setItem(data.data)
    } catch (error) {
      console.error('Error completing collection:', error)
      alert('Error completing collection')
    } finally {
      setCompleting(false)
    }
  }

  const undoCompleteCollection = async () => {
    if (!item?._id) return
    if (!(item as any).completed) return

    const ok = window.confirm('Undo completed collection? This will remove the added revenue entry.')
    if (!ok) return

    setUndoing(true)
    try {
      const response = await fetch(`/api/purchase-sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undoCompleteCollection: true }),
      })
      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to undo collection')
        return
      }
      setItem(data.data)
    } catch (error) {
      console.error('Error undoing collection:', error)
      alert('Error undoing collection')
    } finally {
      setUndoing(false)
    }
  }

  const fetchTransactions = async () => {
    const response = await fetch(`/api/purchase-sales/${id}/transactions`)
    const data = await response.json()
    if (data.success) setTransactions(data.data)
  }

  const fetchCategories = async () => {
    const response = await fetch('/api/categories')
    const data = await response.json()
    if (data.success) setCategories(data.data)
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchItem(), fetchTransactions(), fetchCategories()])
      } catch (error) {
        console.error('Error loading purchase-sale:', error)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [id])

  const { totalPurchase, totalSales, totalExpense, profit } = useMemo(() => {
    let purchase = 0
    let sales = 0
    let expense = 0

    for (const tx of transactions) {
      const amount = Number(tx.amount || 0)
      if (!Number.isFinite(amount)) continue

      if (tx.type === 'purchase') purchase += amount
      else if (tx.type === 'sale') sales += amount
      else if (tx.type === 'expense') expense += amount
    }

    return {
      totalPurchase: purchase,
      totalSales: sales,
      totalExpense: expense,
      profit: sales - (purchase + expense),
    }
  }, [transactions])

  const closeModal = () => {
    setActiveModal(null)
    setEditingTxId(null)
    setTxForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      tins: '',
      category: '',
      description: '',
    })
  }

  const openModal = (type: TxType) => {
    setActiveModal(type)
    setEditingTxId(null)
    setTxForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      tins: '',
      category: '',
      description: '',
    })
  }

  const openEditModal = (tx: IPurchaseSaleTransactionWithId) => {
    setActiveModal(tx.type)
    setEditingTxId(tx._id)

    const dateValue = new Date(tx.date)
    const yyyy = dateValue.getFullYear()
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0')
    const dd = String(dateValue.getDate()).padStart(2, '0')

    const categoryId = tx.category
      ? (categories.find(c => c.name === tx.category)?._id ?? '')
      : ''

    setTxForm({
      date: `${yyyy}-${mm}-${dd}`,
      amount: String(tx.amount ?? ''),
      tins: tx.tins != null ? String(tx.tins) : '',
      category: categoryId,
      description: tx.description ?? '',
    })
  }

  const deleteTransaction = async (txId: string) => {
    const ok = window.confirm('Delete this transaction?')
    if (!ok) return

    setTxLoading(true)
    try {
      const response = await fetch(`/api/purchase-sales/${id}/transactions/${txId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to delete transaction')
        return
      }
      await Promise.all([fetchTransactions(), fetchItem()])
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction')
    } finally {
      setTxLoading(false)
    }
  }

  const submitTransaction = async () => {
    if (!activeModal) return

    setTxLoading(true)
    try {
      const payload: any = {
        type: activeModal,
        date: new Date(txForm.date),
        amount: parseFloat(txForm.amount),
        description: txForm.description || undefined,
      }

      if (!Number.isFinite(payload.amount)) {
        alert('Amount is required')
        return
      }

      if (activeModal === 'purchase' || activeModal === 'sale') {
        if (!txForm.tins) {
          alert('No of tins is required')
          return
        }
        const tins = parseFloat(txForm.tins)
        if (!Number.isFinite(tins)) {
          alert('No of tins must be a number')
          return
        }
        payload.tins = tins
      }

      if (activeModal === 'expense') {
        if (!txForm.category) {
          alert('Category is required')
          return
        }
        const categoryName = categories.find(c => c._id === txForm.category)?.name
        payload.category = categoryName || txForm.category
      }

      const url = editingTxId
        ? `/api/purchase-sales/${id}/transactions/${editingTxId}`
        : `/api/purchase-sales/${id}/transactions`

      const response = await fetch(url, {
        method: editingTxId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!data.success) {
        alert(data.error || 'Failed to add transaction')
        return
      }

      await Promise.all([fetchTransactions(), fetchItem()])
      closeModal()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Error adding transaction')
    } finally {
      setTxLoading(false)
    }
  }

  const modalTitlePrefix = editingTxId ? 'Edit' : 'Add'
  const modalTitle = activeModal === 'purchase'
    ? `${modalTitlePrefix} Purchase`
    : activeModal === 'sale'
      ? `${modalTitlePrefix} Sale`
      : activeModal === 'expense'
        ? `${modalTitlePrefix} Expense`
        : ''

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Purchase &amp; Sale</div>
        <div className="text-gray-600 dark:text-gray-400">Record not found.</div>
        <Link href="/purchase-sales" className="text-blue-600 hover:text-blue-800">← Back</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/purchase-sales" className="text-sm text-blue-600 hover:text-blue-800">← Back</Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vehicle: {item.vehicleName} {item.vehicleNumber ? `(${item.vehicleNumber})` : ''}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={completeCollection}
            disabled={completing || Boolean((item as any).completed)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title={(item as any).completed ? 'Collection completed' : 'Complete collection'}
          >
            {(item as any).completed ? 'Completed' : (completing ? 'Completing...' : 'Complete Collection')}
          </button>
          {(item as any).completed ? (
            <button
              onClick={undoCompleteCollection}
              disabled={undoing}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Undo completed collection"
            >
              {undoing ? 'Undoing...' : 'Undo Collection'}
            </button>
          ) : null}
          <button
            onClick={() => openModal('purchase')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Add Purchase
          </button>
          <button
            onClick={() => openModal('sale')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Sale
          </button>
          <button
            onClick={() => openModal('expense')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Purchase</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(totalPurchase)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(totalSales)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(totalExpense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatSAR(profit)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx) => {
                const badgeClass = tx.type === 'sale'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : tx.type === 'purchase'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'

                const sign = tx.type === 'sale' ? '+' : '-'

                return (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {sign}{formatSAR(tx.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {tx.tins ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {tx.category || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {tx.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(tx)}
                          className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={txLoading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx._id)}
                          className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          disabled={txLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={closeModal}
            className="absolute inset-0 bg-black/40"
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{modalTitle}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (ر.س) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={txForm.amount}
                    onChange={(e) => setTxForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>

                {(activeModal === 'purchase' || activeModal === 'sale') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No of tins</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={txForm.tins}
                      onChange={(e) => setTxForm(prev => ({ ...prev, tins: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                )}

                {activeModal === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                    <select
                      value={txForm.category}
                      onChange={(e) => setTxForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={txForm.description}
                    onChange={(e) => setTxForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Enter description..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  disabled={txLoading}
                  onClick={submitTransaction}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {txLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
