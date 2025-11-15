'use client'

import React from 'react'
import { IExpense } from '@/models/Expense'
import { IVehicle } from '@/models/Vehicle'
import { ICategory } from '@/models/Category'

interface ExpenseFormProps {
  vehicles: IVehicle[]
  categories: ICategory[]
  expense?: IExpense | null
  onExpenseAdded: (expense: IExpense) => void
  onExpenseUpdated: (expense: IExpense) => void
  onCancel?: () => void
}

export default function ExpenseForm({ 
  vehicles, 
  categories,
  expense, 
  onExpenseAdded, 
  onExpenseUpdated,
  onCancel 
}: ExpenseFormProps) {
  const [formData, setFormData] = React.useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    vehicleName: '',
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title,
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || '',
        date: new Date(expense.date).toISOString().split('T')[0],
        vehicleId: expense.vehicleId || '',
        vehicleName: expense.vehicleName || '',
      })
    }
  }, [expense])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'vehicleId') {
      const selectedVehicle = vehicles.find(v => v._id === value)
      setFormData(prev => ({
        ...prev,
        vehicleId: value,
        vehicleName: selectedVehicle ? selectedVehicle.vehicleName : '',
      }))
    } else if (name === 'category') {
      // Clear vehicle selection if category is not Maintenance or Fuel
      const requiresVehicle = value === 'Maintenance' || value === 'Fuel'
      setFormData(prev => ({
        ...prev,
        [name]: value,
        vehicleId: !requiresVehicle ? '' : prev.vehicleId,
        vehicleName: !requiresVehicle ? '' : prev.vehicleName,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      }

      const url = expense ? `/api/expenses/${expense._id}` : '/api/expenses'
      const method = expense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        if (expense) {
          onExpenseUpdated(data.data)
        } else {
          onExpenseAdded(data.data)
        }
        
        if (!expense) {
          setFormData({
            title: '',
            amount: '',
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            vehicleId: '',
            vehicleName: '',
          })
        }
      } else {
        setError(data.error || 'Failed to save expense')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Expense Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter expense title"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (ر.س) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {(formData.category === 'Maintenance' || formData.category === 'Fuel') && (
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle *
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.vehicleName} ({vehicle.vehicleNumber})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Additional details about the expense"
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}