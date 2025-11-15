'use client'

import React, { useState } from 'react'
import { IVehicle } from '@/models/Vehicle'
import { ITrip } from '@/models/Trip'
import { IPurchase } from '@/models/Purchase'

interface QuickTripFormProps {
  vehicle: IVehicle
  onTripCreated: (trip: ITrip) => void
  onCancel: () => void
}

interface TransactionData {
  id: string
  type: 'Purchase' | 'Sales'
  price: string
  litre: string
  date: string
}

export default function QuickTripForm({ vehicle, onTripCreated, onCancel }: QuickTripFormProps) {
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [transactions, setTransactions] = useState<TransactionData[]>([
    {
      id: '1',
      type: 'Purchase',
      price: '',
      litre: '',
      date: new Date().toISOString().split('T')[0]
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addTransaction = () => {
    const newTransaction: TransactionData = {
      id: Date.now().toString(),
      type: 'Purchase',
      price: '',
      litre: '',
      date: new Date().toISOString().split('T')[0]
    }
    setTransactions([...transactions, newTransaction])
  }

  const removeTransaction = (id: string) => {
    if (transactions.length > 1) {
      setTransactions(transactions.filter(t => t.id !== id))
    }
  }

  const updateTransaction = (id: string, field: keyof TransactionData, value: string) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate transactions
      const validTransactions = transactions.filter(t => 
        t.price && t.litre && parseFloat(t.price) > 0 && parseFloat(t.litre) > 0
      )

      if (validTransactions.length === 0) {
        setError('Please add at least one valid transaction')
        setLoading(false)
        return
      }

      // Create trip first
      const tripData = {
        vehicleId: vehicle._id,
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        tripName: tripName || `Trip - ${new Date().toLocaleDateString()}`,
        startDate: new Date(startDate),
        status: 'Active'
      }

      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      })

      const tripResult = await tripResponse.json()

      if (!tripResult.success) {
        throw new Error(tripResult.error || 'Failed to create trip')
      }

      const createdTrip = tripResult.data

      // Create all transactions
      const transactionPromises = validTransactions.map(async (transaction) => {
        const purchaseData = {
          tripId: createdTrip._id,
          tripName: createdTrip.tripName,
          vehicleId: vehicle._id,
          vehicleName: vehicle.vehicleName,
          vehicleNumber: vehicle.vehicleNumber,
          date: new Date(transaction.date),
          price: parseFloat(transaction.price),
          litre: parseFloat(transaction.litre),
          type: transaction.type
        }

        const response = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purchaseData)
        })

        return response.json()
      })

      await Promise.all(transactionPromises)

      // Fetch updated trip with statistics
      const updatedTripResponse = await fetch(`/api/trips/${createdTrip._id}`)
      const updatedTripResult = await updatedTripResponse.json()

      if (updatedTripResult.success) {
        onTripCreated(updatedTripResult.data)
      } else {
        onTripCreated(createdTrip)
      }

    } catch (error: any) {
      setError(error.message || 'Failed to create trip and transactions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Trip Details */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Trip Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trip Name
            </label>
            <input
              type="text"
              id="tripName"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder={`Trip - ${new Date().toLocaleDateString()}`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transactions</h3>
          <button
            type="button"
            onClick={addTransaction}
            className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            + Add Transaction
          </button>
        </div>

        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={transaction.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Transaction {index + 1}</h4>
                {transactions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTransaction(transaction.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={transaction.type}
                    onChange={(e) => updateTransaction(transaction.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Purchase">Oil Collection (Purchase)</option>
                    <option value="Sales">Oil Sale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={transaction.date}
                    onChange={(e) => updateTransaction(transaction.id, 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {transaction.type === 'Purchase' ? 'Purchase Price (ر.س) *' : 'Sale Price (ر.س) *'}
                  </label>
                  <input
                    type="number"
                    value={transaction.price}
                    onChange={(e) => updateTransaction(transaction.id, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {transaction.type === 'Purchase' ? 'Oil Collected (L) *' : 'Oil Sold (L) *'}
                  </label>
                  <input
                    type="number"
                    value={transaction.litre}
                    onChange={(e) => updateTransaction(transaction.id, 'litre', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Transaction Preview */}
              {transaction.price && transaction.litre && parseFloat(transaction.price) > 0 && parseFloat(transaction.litre) > 0 && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'Purchase' 
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                        : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    }`}>
                      {transaction.type}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ر.س {parseFloat(transaction.price).toLocaleString()} for {parseFloat(transaction.litre).toLocaleString()}L
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ر.س {(parseFloat(transaction.price) / parseFloat(transaction.litre)).toFixed(2)}/L
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {transactions.some(t => t.price && t.litre && parseFloat(t.price) > 0 && parseFloat(t.litre) > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Trip Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {(() => {
              const validTransactions = transactions.filter(t => 
                t.price && t.litre && parseFloat(t.price) > 0 && parseFloat(t.litre) > 0
              )
              const purchases = validTransactions.filter(t => t.type === 'Purchase')
              const sales = validTransactions.filter(t => t.type === 'Sales')
              const totalPurchases = purchases.reduce((sum, t) => sum + parseFloat(t.price), 0)
              const totalSales = sales.reduce((sum, t) => sum + parseFloat(t.price), 0)
              const totalPurchaseLitres = purchases.reduce((sum, t) => sum + parseFloat(t.litre), 0)
              const totalSalesLitres = sales.reduce((sum, t) => sum + parseFloat(t.litre), 0)
              const profit = totalSales - totalPurchases

              return (
                <>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Investment:</span>
                    <div className="font-bold text-red-600 dark:text-red-400">ر.س {totalPurchases.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{totalPurchaseLitres.toLocaleString()}L collected</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                    <div className="font-bold text-green-600 dark:text-green-400">ر.س {totalSales.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{totalSalesLitres.toLocaleString()}L sold</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{profit >= 0 ? 'Profit:' : 'Loss:'}</span>
                    <div className={`font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ر.س {Math.abs(profit).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(totalPurchaseLitres - totalSalesLitres).toLocaleString()}L remaining
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 dark:bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Trip...' : 'Create Trip & Add Transactions'}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}