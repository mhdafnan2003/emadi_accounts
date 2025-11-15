'use client'

import React, { useState, useEffect } from 'react'
import { IVehicleWithId } from '@/types'
import Link from 'next/link'

export default function PurchasesPage() {
  const [vehicles, setVehicles] = useState<IVehicleWithId[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Purchases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track used cooking oil collection and sales by vehicle</p>
        </div>
        
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Purchases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Select a vehicle to track cooking oil collection and sales operations
          </p>
        </div>
        <Link
          href="/purchases/sales-report"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>📊</span>
          <span>Sales Report</span>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No vehicles available</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">You need to add vehicles first before tracking oil operations.</p>
          <Link
            href="/vehicles"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Vehicles
          </Link>
        </div>
      ) : (
        <>
          
          

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
                <Link
                  key={vehicle._id}
                  href={`/purchases/${vehicle._id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{vehicle.vehicleName}</h3>
                    <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm font-medium px-3 py-1 rounded-full">
                      {vehicle.vehicleNumber}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                    <div className="flex items-center">
                      <span className="font-medium w-24 text-gray-700 dark:text-gray-300">👨‍✈️ Driver:</span>
                      <span>{vehicle.driverName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-24 text-gray-700 dark:text-gray-300">👥 Helper:</span>
                      <span>{vehicle.coPassengerName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Start Oil Operations</span>
                      <span className="text-green-600 dark:text-green-400">→</span>
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-2xl">🛢️</div>
                  </div>
                </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}