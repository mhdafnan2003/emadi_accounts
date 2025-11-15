'use client'

import React from 'react'
import { formatSAR } from '@/lib/utils'

interface VehicleProfitData {
  vehicleId: string
  vehicleName: string
  driverName: string
  plateNumber: string
  investments: number
  revenues: number
  profit: number
  isProfitable: boolean
  transactionCount: number
}

interface VehicleProfitCardProps {
  vehicleProfit: VehicleProfitData
}

export default function VehicleProfitCard({ vehicleProfit }: VehicleProfitCardProps) {
  const profitPercentage = vehicleProfit.revenues > 0 
    ? ((vehicleProfit.profit / vehicleProfit.revenues) * 100) 
    : 0

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vehicleProfit.vehicleName}
            </h3>
            <p className="text-sm text-gray-600">
              {vehicleProfit.driverName} • {vehicleProfit.plateNumber}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            vehicleProfit.isProfitable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {vehicleProfit.isProfitable ? '📈 Profitable' : '📉 Loss'}
          </div>
        </div>

        {/* Profit Amount */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Net Profit</div>
          <div className={`text-2xl font-bold ${
            vehicleProfit.isProfitable ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatSAR(Math.abs(vehicleProfit.profit))}
          </div>
          {vehicleProfit.revenues > 0 && (
            <div className="text-sm text-gray-500">
              {profitPercentage.toFixed(1)}% margin
            </div>
          )}
        </div>

        {/* Investment vs Revenue */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Investment</div>
            <div className="text-sm font-semibold text-red-600">
              {formatSAR(vehicleProfit.investments)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Revenue</div>
            <div className="text-sm font-semibold text-green-600">
              {formatSAR(vehicleProfit.revenues)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {vehicleProfit.revenues > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>ROI Progress</span>
              <span>{((vehicleProfit.revenues / Math.max(vehicleProfit.investments, 1)) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  vehicleProfit.isProfitable ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (vehicleProfit.revenues / Math.max(vehicleProfit.investments, 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Transaction Count */}
        <div className="text-xs text-gray-500">
          {vehicleProfit.transactionCount} transaction{vehicleProfit.transactionCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}