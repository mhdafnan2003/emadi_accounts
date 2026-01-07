'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { IBranchWithId, IVehicleWithId } from '@/types'

interface VehicleListProps {
  vehicles: IVehicleWithId[]
  branches?: IBranchWithId[]
  loading: boolean
  onEdit: (vehicle: IVehicleWithId) => void
  onDelete: (vehicleId: string) => void
}

export default function VehicleList({ vehicles, branches: branchesProp, loading, onEdit, onDelete }: VehicleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [branchesFallback, setBranchesFallback] = useState<IBranchWithId[]>([])

  useEffect(() => {
    if (branchesProp) return
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches')
        const data = await response.json()
        if (data.success) {
          setBranchesFallback(data.data)
        }
      } catch {
        // Non-blocking: list still works without branches.
      }
    }

    fetchBranches()
  }, [branchesProp])

  const branches = branchesProp ?? branchesFallback

  const branchNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const branch of branches) {
      map.set(branch._id, branch.branchName)
    }
    return map
  }, [branches])

  const groupedVehicles = useMemo(() => {
    const groupMap = new Map<string, IVehicleWithId[]>()

    for (const vehicle of vehicles) {
      const key = vehicle.branchId || ''
      const list = groupMap.get(key)
      if (list) list.push(vehicle)
      else groupMap.set(key, [vehicle])
    }

    const toLabel = (key: string) => {
      if (!key) return 'No branch'
      return branchNameById.get(key) || 'Unknown branch'
    }

    return Array.from(groupMap.entries())
      .map(([key, list]) => ({
        key,
        label: toLabel(key),
        items: list,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [vehicles, branchNameById])

  const getVehicleBranchLabel = useMemo(() => {
    return (vehicle: IVehicleWithId) => {
      if (!vehicle.branchId) return '—'
      return branchNameById.get(vehicle.branchId) || 'Unknown branch'
    }
  }, [branchNameById])

  const handleDelete = async (vehicle: IVehicleWithId) => {
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Co-Passenger
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Added
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="inline-flex gap-2">
                    <div className="h-8 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No vehicles yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Click &quot;Add Vehicle&quot; to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Vehicle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Branch
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Driver
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Co-Passenger
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Added
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {groupedVehicles.map((group) => (
            <Fragment key={`group-${group.key || 'none'}`}>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td colSpan={6} className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {group.label} <span className="text-gray-500 dark:text-gray-300 font-normal">({group.items.length})</span>
                </td>
              </tr>
              {group.items.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {vehicle.vehicleName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {vehicle.vehicleNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{getVehicleBranchLabel(vehicle)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{vehicle.driverName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">{vehicle.coPassengerName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(vehicle.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(vehicle)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Edit vehicle"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle)}
                        disabled={deletingId === vehicle._id}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete vehicle"
                      >
                        {deletingId === vehicle._id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}