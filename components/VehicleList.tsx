'use client'

import { useState } from 'react'
import { IVehicle } from '@/models/Vehicle'

interface VehicleListProps {
  vehicles: IVehicle[]
  loading: boolean
  onEdit: (vehicle: IVehicle) => void
  onDelete: (vehicleId: string) => void
}

export default function VehicleList({ vehicles, loading, onEdit, onDelete }: VehicleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (vehicle: IVehicle) => {
    if (!vehicle._id) return
    
    if (!confirm(`Are you sure you want to delete "${vehicle.vehicleName}"?`)) {
      return
    }

    setDeletingId(vehicle._id)
    
    try {
      const response = await fetch(`/api/vehicles/${vehicle._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(vehicle._id)
      } else {
        alert('Failed to delete vehicle')
      }
    } catch (error) {
      alert('Error deleting vehicle')
    } finally {
      setDeletingId(null)
    }
  }
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🚗</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No vehicles yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Click "Add Vehicle" to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle._id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{vehicle.vehicleName}</h3>
              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {vehicle.vehicleNumber}
              </span>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onEdit(vehicle)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded"
                title="Edit vehicle"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(vehicle)}
                disabled={deletingId === vehicle._id}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded disabled:opacity-50"
                title="Delete vehicle"
              >
                {deletingId === vehicle._id ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <span className="font-medium w-24">Driver:</span>
              <span>{vehicle.driverName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Co-Passenger:</span>
              <span>{vehicle.coPassengerName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-24">Added:</span>
              <span>{new Date(vehicle.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}