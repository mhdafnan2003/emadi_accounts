'use client'

import { useMemo, useState, useEffect } from 'react'
import VehicleForm from '@/components/VehicleForm'
import VehicleList from '@/components/VehicleList'
import { IBranchWithId, IVehicleWithId } from '@/types'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<IVehicleWithId[]>([])
  const [branches, setBranches] = useState<IBranchWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<IVehicleWithId | null>(null)
  const [branchFilter, setBranchFilter] = useState('all')

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

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches')
        const data = await response.json()
        if (data.success) {
          setBranches(data.data)
        }
      } catch {
        // Non-blocking
      }
    }

    fetchBranches()
  }, [])

  const sortedBranches = useMemo(() => {
    return [...branches].sort((a, b) => a.branchName.localeCompare(b.branchName))
  }, [branches])

  const filteredVehicles = useMemo(() => {
    if (branchFilter === 'all') return vehicles
    if (branchFilter === 'none') return vehicles.filter((v) => !v.branchId)
    return vehicles.filter((v) => v.branchId === branchFilter)
  }, [vehicles, branchFilter])

  const handleVehicleAdded = (newVehicle: IVehicleWithId) => {
    setVehicles((prev) => [newVehicle, ...prev])
    // Keep modal open so user can add next vehicle.
  }

  const handleVehicleUpdated = (updatedVehicle: IVehicleWithId) => {
    setVehicles(vehicles.map(veh => 
      veh._id === updatedVehicle._id ? updatedVehicle : veh
    ))
    setEditingVehicle(null)
    setShowForm(false)
  }

  const handleVehicleDeleted = (deletedId: string) => {
    setVehicles(vehicles.filter(veh => veh._id !== deletedId))
  }

  const handleEdit = (vehicle: IVehicleWithId) => {
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={handleCancelEdit}
            className="absolute inset-0 bg-black/40"
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <VehicleForm
                vehicle={editingVehicle}
                onVehicleAdded={handleVehicleAdded}
                onVehicleUpdated={handleVehicleUpdated}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vehicle List</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {loading
                ? 'Loading...'
                : branchFilter === 'all'
                  ? `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} total`
                  : `${filteredVehicles.length} of ${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="min-w-[200px]">
            <label htmlFor="branchFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by branch
            </label>
            <select
              id="branchFilter"
              name="branchFilter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All branches</option>
              <option value="none">No branch</option>
              {sortedBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6">
          <VehicleList
            vehicles={filteredVehicles}
            branches={branches}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleVehicleDeleted}
          />
        </div>
      </div>
    </div>
  )
}