'use client'

import React, { useState, useEffect } from 'react'
import { IPurchase } from '@/models/Purchase'
import { IVehicle } from '@/models/Vehicle'
import { ITrip } from '@/models/Trip'

interface PurchaseFormProps {
  vehicle: IVehicle
  trip?: ITrip
  purchase?: IPurchase | null
  onPurchaseAdded: (purchase: IPurchase) => void
  onPurchaseUpdated: (purchase: IPurchase) => void
  onCancel?: () => void
}

export default function PurchaseForm({ 
  vehicle,
  trip,
  purchase, 
  onPurchaseAdded, 
  onPurchaseUpdated,
  onCancel 
}: PurchaseFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    price: '',
    litre: '',
    type: 'Purchase' as 'Purchase' | 'Sales',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (purchase) {
      setFormData({
        date: new Date(purchase.date).toISOString().split('T')[0],
        price: purchase.price.toString(),
        litre: purchase.litre.toString(),
        type: purchase.type,
      })
    }
  }, [purchase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        tripId: trip?._id || '',
        tripName: trip?.tripName || '',
        vehicleId: vehicle._id,
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        date: new Date(formData.date),
        price: parseFloat(formData.price),
        litre: parseFloat(formData.litre),
        type: formData.type,
      }

      const url = purchase ? `/api/purchases/${purchase._id}` : '/api/purchases'
      const method = purchase ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        if (purchase) {
          onPurchaseUpdated(data.data)
        } else {
          onPurchaseAdded(data.data)
        }
        
        if (!purchase) {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            price: '',
            litre: '',
            type: 'Purchase',
          })
        }
      } else {
        setError(data.error || 'Failed to save transaction')
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

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="Purchase">Oil Collection (Purchase)</option>
            <option value="Sales">Oil Sale</option>
          </select>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            {formData.type === 'Purchase' ? 'Purchase Price (ر.س) *' : 'Sale Price (ر.س) *'}
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="litre" className="block text-sm font-medium text-gray-700 mb-1">
            {formData.type === 'Purchase' ? 'Oil Collected (Litres) *' : 'Oil Sold (Litres) *'}
          </label>
          <input
            type="number"
            id="litre"
            name="litre"
            value={formData.litre}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : purchase ? 'Update Transaction' : 'Add Transaction'}
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