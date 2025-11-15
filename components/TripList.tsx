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
    
    if (!confirm(`Are you sure you want to delete trip "${trip.tripName}"? This will also delete all associated purchases and sales.`)) {
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
        <p className="text-gray-500 dark:text-gray-400">Click "Quick Start Trip" to begin tracking oil collection operations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div
          key={trip._id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{trip.tripName}</h3>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  trip.status === 'Active' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                }`}>
                  {trip.status}
                </span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  trip.isProfitable 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {trip.isProfitable ? 'Profitable' : 'Loss'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span>📅 Started: {new Date(trip.startDate).toLocaleDateString()}</span>
                  {trip.endDate ? (
                    <span>🏁 Ended: {new Date(trip.endDate).toLocaleDateString()}</span>
                  ) : (
                    <span>⏱️ Ongoing: {getTripDuration(trip)} day{getTripDuration(trip) !== 1 ? 's' : ''}</span>
                  )}
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                    Duration: {getTripDuration(trip)} day{getTripDuration(trip) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-4">
              <Link
                href={`/purchases/trip/${trip._id}`}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Manage</span>
              </Link>
              
              {vehicle && (trip.totalPurchases > 0 || trip.totalSales > 0) && (
                <AddToExpenseButton 
                  vehicle={vehicle}
                  trip={trip}
                />
              )}
              
              <button
                onClick={() => handleCompleteTrip(trip)}
                disabled={completingId === trip._id}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1 ${
                  trip.status === 'Active'
                    ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                    : 'bg-yellow-600 dark:bg-yellow-500 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600'
                } disabled:opacity-50`}
                title={trip.status === 'Active' ? 'Complete trip' : 'Reactivate trip'}
              >
                {completingId === trip._id ? (
                  <span>⏳</span>
                ) : (
                  <>
                    <span>{trip.status === 'Active' ? '✅' : '🔄'}</span>
                    <span>{trip.status === 'Active' ? 'Complete' : 'Reactivate'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleDelete(trip)}
                disabled={deletingId === trip._id}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 rounded disabled:opacity-50"
                title="Delete trip"
              >
                {deletingId === trip._id ? '⏳' : '🗑️'}
              </button>
            </div>
          </div>

          {/* Trip Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Investment</span>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                ر.س {trip.totalPurchases.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {trip.totalPurchaseLitres.toLocaleString()} L purchased
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</span>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                ر.س {trip.totalSales.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {trip.totalSalesLitres.toLocaleString()} L sold
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {trip.isProfitable ? 'Profit' : 'Loss'}
              </span>
              <div className={`text-lg font-bold ${trip.isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ر.س {Math.abs(trip.profitLoss).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {trip.hasReachedBreakeven ? 'Breakeven reached' : 'Below breakeven'}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Stock</span>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {(trip.totalPurchaseLitres - trip.totalSalesLitres).toLocaleString()} L
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {trip.totalPurchaseLitres - trip.totalSalesLitres > 0 ? 'Available' : 'Oversold'}
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${trip.hasReachedBreakeven ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                {trip.hasReachedBreakeven ? 'Investment recovered' : 'Recovering investment'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${trip.status === 'Active' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                {trip.status === 'Active' ? 'Trip ongoing' : 'Trip completed'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}