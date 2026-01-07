'use client'

import React from 'react'
import { IBranchWithId, IPurchaseSaleWithId, IVehicleWithId } from '@/types'

interface PurchaseSaleFormProps {
  vehicles: IVehicleWithId[]
  branches: IBranchWithId[]
  item?: IPurchaseSaleWithId | null
  onAdded: (item: IPurchaseSaleWithId) => void
  onUpdated: (item: IPurchaseSaleWithId) => void
  onCancel?: () => void
}

export default function PurchaseSaleForm({ vehicles, branches, item, onAdded, onUpdated, onCancel }: PurchaseSaleFormProps) {
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    openingBalance: '',
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!item) return
    setFormData({
      date: new Date(item.date).toISOString().split('T')[0],
      vehicleId: item.vehicleId,
      openingBalance: item.openingBalance.toString(),
    })
  }, [item])

  const selectedVehicle = React.useMemo(() => {
    return vehicles.find(v => v._id === formData.vehicleId)
  }, [vehicles, formData.vehicleId])

  const selectedBranchName = React.useMemo(() => {
    const branchId = selectedVehicle?.branchId
    if (!branchId) return '—'
    return branches.find(b => b._id === branchId)?.branchName || 'Unknown branch'
  }, [branches, selectedVehicle?.branchId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        date: new Date(formData.date),
        vehicleId: formData.vehicleId,
        openingBalance: parseFloat(formData.openingBalance),
      }

      if (!submitData.vehicleId) {
        setError('Vehicle is required')
        setLoading(false)
        return
      }

      if (!Number.isFinite(submitData.openingBalance)) {
        setError('Opening balance is required')
        setLoading(false)
        return
      }

      const url = item ? `/api/purchase-sales/${item._id}` : '/api/purchase-sales'
      const method = item ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        if (item) {
          onUpdated(data.data)
        } else {
          onAdded(data.data)
        }

        if (!item) {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            vehicleId: '',
            openingBalance: '',
          })
        }
      } else {
        setError(data.error || 'Failed to save purchase-sale')
      }
    } catch {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Opening Balance (ر.س) *
          </label>
          <input
            type="number"
            id="openingBalance"
            name="openingBalance"
            value={formData.openingBalance}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vehicle *
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select vehicle</option>
            {vehicles.map(vehicle => {
              const branchName = vehicle.branchId
                ? (branches.find(b => b._id === vehicle.branchId)?.branchName || 'Unknown branch')
                : '—'
              return (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.vehicleName} ({vehicle.vehicleNumber}) — {branchName}
                </option>
              )
            })}
          </select>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Branch: <span className="font-medium text-gray-900 dark:text-gray-100">{selectedBranchName}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
