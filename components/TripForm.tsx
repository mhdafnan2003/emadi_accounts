'use client'

import { useState, useEffect } from 'react'
import { ITripWithId, IVehicleWithId } from '@/types'

interface TripFormProps {
  vehicle: IVehicleWithId
  trip?: ITripWithId | null
  onTripAdded: (trip: ITripWithId) => void
  onTripUpdated: (trip: ITripWithId) => void
  onCancel?: () => void
}

export default function TripForm({ 
  vehicle,
  trip, 
  onTripAdded, 
  onTripUpdated,
  onCancel 
}: TripFormProps) {
  const [formData, setFormData] = useState({
    tripName: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active' as 'Active' | 'Completed',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (trip) {
      setFormData({
        tripName: trip.tripName,
        startDate: new Date(trip.startDate).toISOString().split('T')[0],
        status: trip.status,
      })
    }
  }, [trip])

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
        vehicleId: vehicle._id,
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        tripName: formData.tripName,
        startDate: new Date(formData.startDate),
        status: formData.status,
        ...(formData.status === 'Completed' && { endDate: new Date() })
      }

      const url = trip ? `/api/trips/${trip._id}` : '/api/trips'
      const method = trip ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        if (trip) {
          onTripUpdated(data.data)
        } else {
          onTripAdded(data.data)
        }
        
        if (!trip) {
          setFormData({
            tripName: '',
            startDate: new Date().toISOString().split('T')[0],
            status: 'Active',
          })
        }
      } else {
        setError(data.error || 'Failed to save trip')
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
          <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1">
            Trip Name *
          </label>
          <input
            type="text"
            id="tripName"
            name="tripName"
            value={formData.tripName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., Downtown Collection Route, Industrial Area Trip"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {trip && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trip Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}
      </div>

      {/* Vehicle Info Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">Vehicle Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Vehicle:</span>
            <div className="font-medium">{vehicle.vehicleName}</div>
          </div>
          <div>
            <span className="text-gray-600">Number:</span>
            <div className="font-medium">{vehicle.vehicleNumber}</div>
          </div>
          <div>
            <span className="text-gray-600">Driver:</span>
            <div className="font-medium">{vehicle.driverName}</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : trip ? 'Update Trip' : 'Start Trip'}
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