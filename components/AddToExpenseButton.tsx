'use client'

import React, { useState, useEffect } from 'react'
import { ITripWithId, IVehicleWithId } from '@/types'

interface AddToExpenseButtonProps {
  vehicle: IVehicleWithId
  trip: ITripWithId
  onExpenseAdded?: () => void
}

interface Category {
  _id: string
  name: string
}

export default function AddToExpenseButton({ vehicle, trip, onExpenseAdded }: AddToExpenseButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expenseType, setExpenseType] = useState<'investment' | 'revenue'>('investment')
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (trip) {
      setDescription(`${trip.tripName} - ${vehicle.vehicleName} (${expenseType === 'investment' ? 'Oil Purchase' : 'Oil Sales'})`)
    }
  }, [trip, vehicle, expenseType])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
        // Set default category based on expense type
        const defaultCategory = data.data.find((cat: Category) => 
          expenseType === 'investment' 
            ? cat.name.toLowerCase().includes('fuel') || cat.name.toLowerCase().includes('oil') || cat.name.toLowerCase().includes('purchase')
            : cat.name.toLowerCase().includes('income') || cat.name.toLowerCase().includes('revenue') || cat.name.toLowerCase().includes('sales')
        )
        if (defaultCategory) {
          setSelectedCategory(defaultCategory._id)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddToExpense = async () => {
    if (!selectedCategory) {
      alert('Please select a category')
      return
    }

    setLoading(true)
    
    try {
      const amount = expenseType === 'investment' ? trip.totalPurchases : trip.totalSales
      
      if (amount <= 0) {
        alert(`No ${expenseType} amount to add to expenses`)
        setLoading(false)
        return
      }

      const expenseData = {
        vehicleId: vehicle._id,
        vehicleName: vehicle.vehicleName,
        categoryId: selectedCategory,
        amount: amount,
        description: description,
        date: trip.endDate || new Date(),
        tripId: trip._id,
        tripName: trip.tripName,
        expenseType: expenseType
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully added ${expenseType} to expenses!`)
        setShowModal(false)
        if (onExpenseAdded) {
          onExpenseAdded()
        }
      } else {
        alert('Failed to add expense: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors flex items-center space-x-1"
        title="Add trip data to expenses"
      >
        <span>💼</span>
        <span>Add to Expenses</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Trip to Expenses
            </h3>
            
            <div className="space-y-4">
              {/* Expense Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="investment"
                      checked={expenseType === 'investment'}
                      onChange={(e) => setExpenseType(e.target.value as 'investment' | 'revenue')}
                      className="mr-2"
                    />
                    <span className="text-sm">Investment (ر.س {trip.totalPurchases?.toLocaleString() || 0})</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="revenue"
                      checked={expenseType === 'revenue'}
                      onChange={(e) => setExpenseType(e.target.value as 'investment' | 'revenue')}
                      className="mr-2"
                    />
                    <span className="text-sm">Revenue (ر.س {trip.totalSales?.toLocaleString() || 0})</span>
                  </label>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter expense description..."
                />
              </div>

              {/* Trip Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Trip Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Trip: {trip.tripName}</div>
                  <div>Vehicle: {vehicle.vehicleName} ({vehicle.vehicleNumber})</div>
                  <div>Period: {new Date(trip.startDate).toLocaleDateString()} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'Ongoing'}</div>
                  <div className="font-medium">
                    Amount: ر.س {(expenseType === 'investment' ? trip.totalPurchases : trip.totalSales)?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddToExpense}
                disabled={loading || !selectedCategory}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add to Expenses'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}