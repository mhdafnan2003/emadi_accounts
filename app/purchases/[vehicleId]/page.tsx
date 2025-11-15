'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QuickTripForm from '@/components/QuickTripForm'
import TripList from '@/components/TripList'
import ExportButton from '@/components/ExportButton'
import { ITripWithId, IVehicleWithId } from '@/types'
import { formatSAR, formatNumber } from '@/lib/utils'

export default function VehiclePurchasePage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.vehicleId as string

  const [vehicle, setVehicle] = useState<IVehicleWithId | null>(null)
  const [allTrips, setAllTrips] = useState<ITripWithId[]>([])
  const [filteredTrips, setFilteredTrips] = useState<ITripWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'revenue'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchVehicle = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      if (data.success) {
        const foundVehicle = data.data.find((v: IVehicleWithId) => v._id === vehicleId)
        if (foundVehicle) {
          setVehicle(foundVehicle)
        } else {
          router.push('/purchases')
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      router.push('/purchases')
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch(`/api/trips?vehicleId=${vehicleId}`)
      const data = await response.json()
      if (data.success) {
        setAllTrips(data.data)
        setFilteredTrips(data.data)
        
        // Set default month to current month if no selection
        if (!selectedMonth && data.data.length > 0) {
          const currentMonth = new Date().toISOString().slice(0, 7)
          setSelectedMonth(currentMonth)
        }
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle()
      fetchTrips()
    }
  }, [vehicleId])

  const handleTripCreated = (newTrip: ITripWithId) => {
    const updatedTrips = [newTrip, ...allTrips]
    setAllTrips(updatedTrips)
    applyFiltersAndSort(updatedTrips, selectedMonth, sortBy, sortOrder)
    setShowQuickForm(false)
  }

  const handleTripDeleted = (deletedId: string) => {
    const updatedTrips = allTrips.filter((t: ITripWithId) => t._id !== deletedId)
    setAllTrips(updatedTrips)
    applyFiltersAndSort(updatedTrips, selectedMonth, sortBy, sortOrder)
  }

  const handleTripUpdated = (updatedTrip: ITripWithId) => {
    const updatedTrips = allTrips.map((t: ITripWithId) => 
      t._id === updatedTrip._id ? updatedTrip : t
    )
    setAllTrips(updatedTrips)
    applyFiltersAndSort(updatedTrips, selectedMonth, sortBy, sortOrder)
  }

  // Filter and sort trips
  const applyFiltersAndSort = (trips: ITripWithId[], month: string, sortField: string, order: string) => {
    let filtered = [...trips]

    // Filter by month
    if (month) {
      filtered = filtered.filter(trip => {
        const tripMonth = new Date(trip.startDate).toISOString().slice(0, 7)
        return tripMonth === month
      })
    }

    // Sort trips
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortField) {
        case 'profit':
          aValue = a.profitLoss || 0
          bValue = b.profitLoss || 0
          break
        case 'revenue':
          aValue = a.totalSales || 0
          bValue = b.totalSales || 0
          break
        case 'date':
        default:
          aValue = new Date(a.startDate).getTime()
          bValue = new Date(b.startDate).getTime()
          break
      }

      if (order === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    setFilteredTrips(filtered)
  }

  // Handle filter changes
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    applyFiltersAndSort(allTrips, month, sortBy, sortOrder)
  }

  const handleSortChange = (field: 'date' | 'profit' | 'revenue') => {
    const newOrder = field === sortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newOrder)
    applyFiltersAndSort(allTrips, selectedMonth, field, newOrder)
  }

  // Get available months from trips
  const getAvailableMonths = () => {
    const months = new Set<string>()
    allTrips.forEach(trip => {
      const month = new Date(trip.startDate).toISOString().slice(0, 7)
      months.add(month)
    })
    return Array.from(months).sort().reverse()
  }

  // Apply filters when dependencies change
  useEffect(() => {
    if (allTrips.length > 0) {
      applyFiltersAndSort(allTrips, selectedMonth, sortBy, sortOrder)
    }
  }, [selectedMonth, sortBy, sortOrder, allTrips])

  const handleCancelQuickForm = () => {
    setShowQuickForm(false)
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading vehicle information...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics from filtered trips
  const totalTrips = filteredTrips.length
  const activeTrips = filteredTrips.filter((t: ITripWithId) => t.status === 'Active').length
  const completedTrips = filteredTrips.filter((t: ITripWithId) => t.status === 'Completed').length
  const profitableTrips = filteredTrips.filter((t: ITripWithId) => t.isProfitable).length
  const totalInvestment = filteredTrips.reduce((sum: number, t: ITripWithId) => sum + (t.totalPurchases || 0), 0)
  const totalRevenue = filteredTrips.reduce((sum: number, t: ITripWithId) => sum + (t.totalSales || 0), 0)
  const overallProfitLoss = totalRevenue - totalInvestment
  const overallProfitable = overallProfitLoss >= 0

  // Get month name for display
  const getMonthName = (monthString: string) => {
    if (!monthString) return 'All Time'
    const date = new Date(monthString + '-01')
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.push('/purchases')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              ← Back to Vehicles
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{vehicle.vehicleName}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {vehicle.vehicleNumber} • Driver: {vehicle.driverName}
          </p>
        </div>
        <div className="flex space-x-3">
          <ExportButton 
            vehicle={vehicle}
            trips={filteredTrips}
            selectedMonth={selectedMonth}
          />
          <button
            onClick={() => setShowQuickForm(!showQuickForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <span className="text-lg">+</span>
            <span>{showQuickForm ? 'Cancel' : 'Quick Start Trip'}</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Header */}
      {selectedMonth && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                📊 {getMonthName(selectedMonth)} Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Performance overview for the selected month
              </p>
            </div>
            <button
              onClick={() => handleMonthChange('')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              View All Time
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {selectedMonth ? 'Monthly' : 'Total'} Trips
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTrips}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeTrips} active, {completedTrips} completed</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
              <span className="text-blue-600 dark:text-blue-400 text-xl">🚛</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {selectedMonth ? 'Monthly' : 'Total'} Investment
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatSAR(totalInvestment)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMonth ? `In ${getMonthName(selectedMonth)}` : 'Across all trips'}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <span className="text-red-600 dark:text-red-400 text-xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {selectedMonth ? 'Monthly' : 'Total'} Revenue
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatSAR(totalRevenue)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMonth ? `In ${getMonthName(selectedMonth)}` : 'From all sales'}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
              <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {selectedMonth ? 'Monthly' : 'Overall'} {overallProfitable ? 'Profit' : 'Loss'}
              </p>
              <p className={`text-2xl font-bold ${overallProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatSAR(Math.abs(overallProfitLoss))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profitableTrips}/{totalTrips} profitable trips
              </p>
            </div>
            <div className={`${overallProfitable ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} p-3 rounded-full`}>
              <span className={`${overallProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-xl`}>
                {overallProfitable ? '📈' : '📉'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Performance Overview */}
      {/* <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Success Rate</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Profitable Trips:</span>
                <span className="font-medium text-green-600">{profitableTrips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loss-making Trips:</span>
                <span className="font-medium text-red-600">{totalTrips - profitableTrips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-medium">
                  {totalTrips > 0 ? ((profitableTrips / totalTrips) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Trip Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Active Trips: {activeTrips}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Completed Trips: {completedTrips}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${overallProfitable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {overallProfitable ? 'Overall profitable' : 'Overall loss'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Average Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Investment/Trip:</span>
                <span className="font-medium">
                  {totalTrips > 0 ? formatSAR(totalInvestment / totalTrips) : formatSAR(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Revenue/Trip:</span>
                <span className="font-medium">
                  {totalTrips > 0 ? formatSAR(totalRevenue / totalTrips) : formatSAR(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Profit/Trip:</span>
                <span className={`font-medium ${overallProfitable ? 'text-green-600' : 'text-red-600'}`}>
                  {totalTrips > 0 ? formatSAR(overallProfitLoss / totalTrips) : formatSAR(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Trip Creation Form */}
      {showQuickForm && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Quick Start New Trip
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a new trip and add your first transactions all in one step. Perfect for starting a new collection route!
            </p>
            <QuickTripForm
              vehicle={vehicle}
              onTripCreated={handleTripCreated}
              onCancel={handleCancelQuickForm}
            />
          </div>
        </div>
      )}

      {/* Trip List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trip History</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {loading ? 'Loading...' : (
                  <>
                    {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} 
                    {selectedMonth ? ` in ${getMonthName(selectedMonth)}` : ' total'}
                    {allTrips.length !== filteredTrips.length && (
                      <span className="text-sm text-gray-500 dark:text-gray-400"> (of {allTrips.length} total)</span>
                    )}
                  </>
                )}
              </p>
            </div>
            
            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Month Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Months</option>
                  {getAvailableMonths().map(month => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleSortChange('date')}
                    className={`px-3 py-1 text-sm rounded ${
                      sortBy === 'date' 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSortChange('profit')}
                    className={`px-3 py-1 text-sm rounded ${
                      sortBy === 'profit' 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Profit {sortBy === 'profit' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSortChange('revenue')}
                    className={`px-3 py-1 text-sm rounded ${
                      sortBy === 'revenue' 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Revenue {sortBy === 'revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <TripList
            trips={filteredTrips}
            loading={loading}
            onDelete={handleTripDeleted}
            onTripUpdated={handleTripUpdated}
            vehicle={vehicle}
          />
        </div>
      </div>
    </div>
  )
}