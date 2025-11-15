'use client'

import { useState, useEffect } from 'react'
import { IVehicle } from '@/models/Vehicle'

interface VehicleFormProps {
  vehicle?: IVehicle | null
  onVehicleAdded: (vehicle: IVehicle) => void
  onVehicleUpdated: (vehicle: IVehicle) => void
  onCancel?: () => void
}

export default function VehicleForm({ 
  vehicle, 
  onVehicleAdded, 
  onVehicleUpdated,
  onCancel 
}: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vehicleName: '',
    vehicleNumber: '',
    driverName: '',
    coPassengerName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        driverName: vehicle.driverName,
        coPassengerName: vehicle.coPassengerName,
      })
    }
  }, [vehicle])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const url = vehicle ? `/api/vehicles/${vehicle._id}` : '/api/vehicles'
      const method = vehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        if (vehicle) {
          onVehicleUpdated(data.data)
        } else {
          onVehicleAdded(data.data)
        }
        
        if (!vehicle) {
          setFormData({
            vehicleName: '',
            vehicleNumber: '',
            driverName: '',
            coPassengerName: '',
          })
        }
      } else {
        setError(data.error || 'Failed to save vehicle')
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="vehicleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vehicle Name
          </label>
          <input
            type="text"
            id="vehicleName"
            name="vehicleName"
            value={formData.vehicleName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter vehicle name"
          />
        </div>

        <div>
          <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vehicle Number
          </label>
          <input
            type="text"
            id="vehicleNumber"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter vehicle number"
          />
        </div>

        <div>
          <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Driver Name
          </label>
          <input
            type="text"
            id="driverName"
            name="driverName"
            value={formData.driverName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter driver name"
          />
        </div>

        <div>
          <label htmlFor="coPassengerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Co-Passenger Name
          </label>
          <input
            type="text"
            id="coPassengerName"
            name="coPassengerName"
            value={formData.coPassengerName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter co-passenger name"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
  )
}