'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PurchaseForm from '@/components/PurchaseForm'
import PurchaseList from '@/components/PurchaseList'
import { IPurchaseWithId, ITripWithId, IVehicleWithId } from '@/types'
import { IPurchase } from '@/models/Purchase'
import { ITrip } from '@/models/Trip'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<ITripWithId | null>(null)
  const [purchases, setPurchases] = useState<IPurchaseWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<IPurchaseWithId | null>(null)

  const fetchTrip = async () => {
    try {
      const response = await fetch('/api/trips')
      const data = await response.json()
      if (data.success) {
        const foundTrip = data.data.find((t: ITripWithId) => t._id === tripId)
        if (foundTrip) {
          setTrip(foundTrip)
        } else {
          router.push('/purchases')
        }
      }
    } catch (error) {
      console.error('Error fetching trip:', error)
      router.push('/purchases')
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`/api/purchases?tripId=${tripId}`)
      const data = await response.json()
      if (data.success) {
        setPurchases(data.data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTripStats = (currentPurchases: IPurchaseWithId[]) => {
    console.log('Calculating stats for purchases:', currentPurchases)
    
    const totalPurchases = currentPurchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.price, 0)
    const totalSales = currentPurchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.price, 0)
    const totalPurchaseLitres = currentPurchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.litre, 0)
    const totalSalesLitres = currentPurchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.litre, 0)
    const profitLoss = totalSales - totalPurchases
    const isProfitable = profitLoss >= 0
    const hasReachedBreakeven = totalSales >= totalPurchases

    const stats = {
      totalPurchases,
      totalSales,
      totalPurchaseLitres,
      totalSalesLitres,
      profitLoss,
      isProfitable,
      hasReachedBreakeven,
    }
    
    console.log('Calculated stats:', stats)
    return stats
  }

  const updateTripStats = async () => {
    try {
      // First, calculate stats locally for immediate UI update
      const stats = calculateTripStats(purchases)
      if (trip) {
        setTrip({
          ...trip,
          ...stats
        })
      }

      // Then update the database
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update with server response if different
          setTrip(data.data)
        }
      }
    } catch (error) {
      console.error('Error updating trip stats:', error)
      // Fallback to local calculation if API fails
      const stats = calculateTripStats(purchases)
      if (trip) {
        setTrip({
          ...trip,
          ...stats
        })
      }
    }
  }

  useEffect(() => {
    if (tripId) {
      fetchTrip()
      fetchPurchases()
    }
  }, [tripId])

  // Update trip stats when purchases change
  useEffect(() => {
    if (trip && purchases.length > 0) {
      const stats = calculateTripStats(purchases)
      setTrip((prevTrip: ITripWithId | null) => prevTrip ? {
        ...prevTrip,
        ...stats
      } : null)
    }
  }, [purchases, trip?._id]) // Only depend on trip ID to avoid infinite loops

  const handlePurchaseAdded = (newPurchase: IPurchaseWithId) => {
    const updatedPurchases = [newPurchase, ...purchases]
    setPurchases(updatedPurchases)
    setShowForm(false)
    
    // Calculate and update stats immediately
    const stats = calculateTripStats(updatedPurchases)
    if (trip) {
      setTrip({
        ...trip,
        ...stats
      })
    }
    
    // Also update the database
    updateTripStats()
  }

  const handlePurchaseUpdated = (updatedPurchase: IPurchaseWithId) => {
    const updatedPurchases = purchases.map((p: IPurchaseWithId) => 
      p._id === updatedPurchase._id ? updatedPurchase : p
    )
    setPurchases(updatedPurchases)
    setEditingPurchase(null)
    setShowForm(false)
    
    // Calculate and update stats immediately
    const stats = calculateTripStats(updatedPurchases)
    if (trip) {
      setTrip({
        ...trip,
        ...stats
      })
    }
    
    // Also update the database
    updateTripStats()
  }

  const handlePurchaseDeleted = (deletedId: string) => {
    const updatedPurchases = purchases.filter((p: IPurchaseWithId) => p._id !== deletedId)
    setPurchases(updatedPurchases)
    
    // Calculate and update stats immediately
    const stats = calculateTripStats(updatedPurchases)
    if (trip) {
      setTrip({
        ...trip,
        ...stats
      })
    }
    
    // Also update the database
    updateTripStats()
  }

  const handleEdit = (purchase: IPurchaseWithId) => {
    setEditingPurchase(purchase)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingPurchase(null)
    setShowForm(false)
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading trip information...</p>
        </div>
      </div>
    )
  }

  // Create a mock vehicle object for the form
  const vehicle: IVehicleWithId = {
    _id: trip.vehicleId,
    vehicleName: trip.vehicleName,
    vehicleNumber: trip.vehicleNumber,
    driverName: '',
    coPassengerName: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // Calculate current statistics directly from purchases for display
  const currentStats = calculateTripStats(purchases)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.push(`/purchases/${trip.vehicleId}`)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to {trip.vehicleName}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{trip.tripName}</h1>
          <p className="text-gray-600 mt-1">
            {trip.vehicleName} ({trip.vehicleNumber}) • Started: {new Date(trip.startDate).toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-3 mt-2">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              trip.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {trip.status}
            </span>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              currentStats.isProfitable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentStats.isProfitable ? 'Profitable' : 'Loss'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>{showForm ? 'Cancel' : 'Add Transaction'}</span>
        </button>
      </div>

      {/* Trip Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Investment</p>
              <p className="text-2xl font-bold text-red-600">ر.س {currentStats.totalPurchases.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{currentStats.totalPurchaseLitres.toLocaleString()} L purchased</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <span className="text-red-600 text-xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-green-600">ر.س {currentStats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{currentStats.totalSalesLitres.toLocaleString()} L sold</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {currentStats.isProfitable ? 'Profit' : 'Loss'}
              </p>
              <p className={`text-2xl font-bold ${currentStats.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                ر.س {Math.abs(currentStats.profitLoss).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {currentStats.hasReachedBreakeven ? 'Breakeven reached' : 'Below breakeven'}
              </p>
            </div>
            <div className={`${currentStats.isProfitable ? 'bg-green-100' : 'bg-red-100'} p-3 rounded-full`}>
              <span className={`${currentStats.isProfitable ? 'text-green-600' : 'text-red-600'} text-xl`}>
                {currentStats.isProfitable ? '�}' : '📉'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Remaining Stock</p>
              <p className="text-2xl font-bold text-blue-600">
                {(currentStats.totalPurchaseLitres - currentStats.totalSalesLitres).toLocaleString()} L
              </p>
              <p className="text-xs text-gray-500">
                {currentStats.totalPurchaseLitres - currentStats.totalSalesLitres > 0 ? 'Available to sell' : 'Oversold'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-blue-600 text-xl">🛢️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Progress */}   
      {/* <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Financial Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${trip.hasReachedBreakeven ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {trip.hasReachedBreakeven ? 'Investment recovered' : 'Still recovering investment'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${trip.isProfitable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {trip.isProfitable ? 'Trip is profitable' : 'Trip showing loss'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${trip.status === 'Active' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <span className="text-gray-600">
                  Trip is {trip.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Purchase Price:</span>
                <span className="font-medium">
                  ر.س {trip.totalPurchaseLitres > 0 ? (trip.totalPurchases / trip.totalPurchaseLitres).toFixed(2) : 0}/L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Sale Price:</span>
                <span className="font-medium">
                  ر.س {trip.totalSalesLitres > 0 ? (trip.totalSales / trip.totalSalesLitres).toFixed(2) : 0}/L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin:</span>
                <span className={`font-medium ${trip.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {trip.totalSales > 0 ? ((trip.profitLoss / trip.totalSales) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Add Transaction */}
      {!showForm && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Add Transaction</h3>
                <p className="text-gray-600">Add oil collection or sales transactions to this trip</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>🛒</span>
                  <span>Add Purchase</span>
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <span>💰</span>
                  <span>Add Sale</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Form */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPurchase ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <PurchaseForm
              vehicle={vehicle}
              trip={trip}
              purchase={editingPurchase}
              onPurchaseAdded={handlePurchaseAdded}
              onPurchaseUpdated={handlePurchaseUpdated}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading...' : `${purchases.length} transaction${purchases.length !== 1 ? 's' : ''} for this trip`}
          </p>
        </div>
        <div className="p-6">
          <PurchaseList
            purchases={purchases}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handlePurchaseDeleted}
          />
        </div>
      </div>
    </div>
  )
}