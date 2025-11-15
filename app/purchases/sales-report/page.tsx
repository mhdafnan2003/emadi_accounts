'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IPurchase } from '@/models/Purchase'
import { IVehicle } from '@/models/Vehicle'

export default function SalesReportPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<IVehicle[]>([])
  const [allPurchases, setAllPurchases] = useState<IPurchase[]>([])
  const [filteredSales, setFilteredSales] = useState<IPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    vehicleId: '',
    startDate: '',
    endDate: '',
    showFilters: true
  })

  const fetchData = async () => {
    try {
      // Fetch vehicles
      const vehiclesResponse = await fetch('/api/vehicles')
      const vehiclesData = await vehiclesResponse.json()
      if (vehiclesData.success) {
        setVehicles(vehiclesData.data)
      }

      // Fetch all purchases
      const purchasesResponse = await fetch('/api/purchases')
      const purchasesData = await purchasesResponse.json()
      if (purchasesData.success) {
        const salesOnly = purchasesData.data.filter((p: IPurchase) => p.type === 'Sales')
        setAllPurchases(salesOnly)
        setFilteredSales(salesOnly)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const applyFilters = () => {
    let filtered = [...allPurchases]

    if (filters.vehicleId) {
      filtered = filtered.filter(p => p.vehicleId === filters.vehicleId)
    }

    if (filters.startDate) {
      filtered = filtered.filter(p => new Date(p.date) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      filtered = filtered.filter(p => new Date(p.date) <= new Date(filters.endDate))
    }

    setFilteredSales(filtered)
  }

  const clearFilters = () => {
    setFilters({ vehicleId: '', startDate: '', endDate: '', showFilters: true })
    setFilteredSales(allPurchases)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    applyFilters()
  }, [filters.vehicleId, filters.startDate, filters.endDate, allPurchases])

  // Calculate statistics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.price, 0)
  const totalLitres = filteredSales.reduce((sum, sale) => sum + sale.litre, 0)
  const avgPricePerLitre = totalLitres > 0 ? totalRevenue / totalLitres : 0

  // Group sales by vehicle
  const salesByVehicle = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.vehicleId]) {
      acc[sale.vehicleId] = {
        vehicleName: sale.vehicleName,
        vehicleNumber: sale.vehicleNumber,
        sales: [],
        totalRevenue: 0,
        totalLitres: 0
      }
    }
    acc[sale.vehicleId].sales.push(sale)
    acc[sale.vehicleId].totalRevenue += sale.price
    acc[sale.vehicleId].totalLitres += sale.litre
    return acc
  }, {} as any)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.push('/purchases')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Purchases
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze oil sales across all vehicles
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
          <button
            onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className="text-blue-600 hover:text-blue-800"
          >
            {filters.showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {filters.showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle
                </label>
                <select
                  value={filters.vehicleId}
                  onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleName} ({vehicle.vehicleNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={clearFilters}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setFilters(prev => ({ ...prev, startDate: today, endDate: today }))
                }}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                  setFilters(prev => ({ 
                    ...prev, 
                    startDate: weekAgo.toISOString().split('T')[0], 
                    endDate: today.toISOString().split('T')[0] 
                  }))
                }}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                  setFilters(prev => ({ 
                    ...prev, 
                    startDate: monthStart.toISOString().split('T')[0], 
                    endDate: today.toISOString().split('T')[0] 
                  }))
                }}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
              >
                This Month
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">ر.س {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Litres Sold</p>
              <p className="text-2xl font-bold text-blue-600">{totalLitres.toLocaleString()} L</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-blue-600 text-xl">🛢️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Price/Litre</p>
              <p className="text-2xl font-bold text-purple-600">ر.س {avgPricePerLitre.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-orange-600">{filteredSales.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-orange-600 text-xl">📋</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Vehicle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Vehicle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(salesByVehicle).map((vehicleData: any) => (
            <div key={vehicleData.vehicleName} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{vehicleData.vehicleName}</h4>
              <p className="text-sm text-gray-600 mb-3">{vehicleData.vehicleNumber}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium text-green-600">ر.س {vehicleData.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Litres:</span>
                  <span className="font-medium text-blue-600">{vehicleData.totalLitres.toLocaleString()} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transactions:</span>
                  <span className="font-medium">{vehicleData.sales.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Sales List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Detailed Sales List</h3>
          <p className="text-gray-600 mt-1">{filteredSales.length} sales transactions</p>
        </div>
        <div className="p-6">
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-500">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{sale.vehicleName}</h4>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {sale.vehicleNumber}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(sale.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Revenue:</span>
                          <div className="text-lg font-bold text-green-600">
                            ر.س {sale.price.toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-600">Litres:</span>
                          <div className="text-lg font-bold text-blue-600">
                            {sale.litre.toLocaleString()} L
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-gray-600">Price per Litre:</span>
                          <div className="text-lg font-bold text-gray-900">
                            ر.س {(sale.price / sale.litre).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}