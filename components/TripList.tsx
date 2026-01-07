'use client'

import React, { useState } from 'react'
import { ITripWithId, IVehicleWithId } from '@/types'
import Link from 'next/link'
import AddToExpenseButton from './AddToExpenseButton'

interface TripListProps {
  trips: ITripWithId[]
  loading: boolean
  onDelete: (tripId: string) => void
  onTripUpdated?: (trip: ITripWithId) => void
  vehicle?: IVehicleWithId
}

export default function TripList({ trips, loading, onDelete, onTripUpdated, vehicle }: TripListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const handleDelete = async (trip: ITripWithId) => {
    if (!trip._id) return
    
    if (!confirm(`Are you sure you want to delete trip "${trip.tripName}"?`)) {
      return
    }

    setDeletingId(trip._id)
    
    try {
      const response = await fetch(`/api/trips/${trip._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(trip._id)
      } else {
        alert('Failed to delete trip')
      }
    } catch (error) {
      alert('Error deleting trip')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCompleteTrip = async (trip: ITripWithId) => {
    if (!trip._id) return
    
    const action = trip.status === 'Active' ? 'complete' : 'reactivate'
    const confirmMessage = trip.status === 'Active' 
      ? `Complete trip "${trip.tripName}"? This will set the end date to today.`
      : `Reactivate trip "${trip.tripName}"? This will remove the end date and set status to Active.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setCompletingId(trip._id)
    
    try {
      const updateData = trip.status === 'Active' 
        ? { status: 'Completed', endDate: new Date() }
        : { status: 'Active', endDate: null }

      const response = await fetch(`/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success && onTripUpdated) {
        onTripUpdated(data.data)
      } else if (!data.success) {
        alert(`Failed to ${action} trip`)
      }
    } catch (error) {
      alert(`Error ${action}ing trip`)
    } finally {
      setCompletingId(null)
    }
  }

  const getTripDuration = (trip: ITripWithId) => {
    const start = new Date(trip.startDate)
    const end = trip.endDate ? new Date(trip.endDate) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🚛</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No trips yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Click &quot;Quick Start Trip&quot; to begin tracking oil collection operations.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Trip
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Summary
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {trips.map((trip) => (
            <tr key={trip._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {trip.tripName}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'Active'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    {trip.status}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      trip.isProfitable
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {trip.isProfitable ? 'Profitable' : 'Loss'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  Started: {new Date(trip.startDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {trip.endDate
                    ? `Ended: ${new Date(trip.endDate).toLocaleDateString()}`
                    : `Ongoing: ${getTripDuration(trip)} day${getTripDuration(trip) !== 1 ? 's' : ''}`}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Investment:</span>{' '}
                    <span className="text-red-600 dark:text-red-400 font-semibold">ر.س {trip.totalPurchases.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Revenue:</span>{' '}
                    <span className="text-green-600 dark:text-green-400 font-semibold">ر.س {trip.totalSales.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{trip.isProfitable ? 'Profit' : 'Loss'}:</span>{' '}
                    <span className={`${trip.isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold`}>
                      ر.س {Math.abs(trip.profitLoss).toLocaleString()}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="inline-flex items-center justify-end gap-2">
                  {vehicle && (trip.totalPurchases > 0 || trip.totalSales > 0) && (
                    <AddToExpenseButton vehicle={vehicle} trip={trip} />
                  )}

                  <button
                    onClick={() => handleCompleteTrip(trip)}
                    disabled={completingId === trip._id}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      trip.status === 'Active'
                        ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                        : 'bg-yellow-600 dark:bg-yellow-500 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600'
                    } disabled:opacity-50`}
                    title={trip.status === 'Active' ? 'Complete trip' : 'Reactivate trip'}
                  >
                    {completingId === trip._id ? '⏳' : trip.status === 'Active' ? '✅' : '🔄'}
                  </button>

                  <button
                    onClick={() => handleDelete(trip)}
                    disabled={deletingId === trip._id}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete trip"
                  >
                    {deletingId === trip._id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}