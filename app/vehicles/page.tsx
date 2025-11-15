'use client'

import { useState, useEffect } from 'react'
import VehicleForm from '@/components/VehicleForm'
import VehicleList from '@/components/VehicleList'
import { IVehicle } from '@/models/Vehicle'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<IVehicle | null>(null)

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      if (data.success) {
        setVehicles(data.data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleVehicleAdded = (newVehicle: IVehicle) => {
    setVehicles([newVehicle, ...vehicles])
    setShowForm(false)
  }

  const handleVehicleUpdated = (updatedVehicle: IVehicle) => {
    setVehicles(vehicles.map(veh => 
      veh._id === updatedVehicle._id ? updatedVehicle : veh
    ))
    setEditingVehicle(null)
    setShowForm(false)
  }

  const handleVehicleDeleted = (deletedId: string) => {
    setVehicles(vehicles.filter(veh => veh._id !== deletedId))
  }

  const handleEdit = (vehicle: IVehicle) => {
    setEditingVehicle(vehicle)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingVehicle(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vehicles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your vehicle fleet</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>{showForm ? 'Cancel' : 'Add Vehicle'}</span>
        </button>
      </div>

      {/* Add Vehicle Form - Shows when button is clicked */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <VehicleForm
              vehicle={editingVehicle}
              onVehicleAdded={handleVehicleAdded}
              onVehicleUpdated={handleVehicleUpdated}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vehicle List</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {loading ? 'Loading...' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="p-6">
          <VehicleList
            vehicles={vehicles}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleVehicleDeleted}
          />
        </div>
      </div>
    </div>
  )
}