'use client'

import React, { useState } from 'react'
import { ITrip } from '@/models/Trip'
import { IPurchase } from '@/models/Purchase'
import { IVehicle } from '@/models/Vehicle'

interface ExportButtonProps {
  vehicle: IVehicle
  trips: ITrip[]
  selectedMonth?: string
}

export default function ExportButton({ vehicle, trips, selectedMonth }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const fetchAllPurchases = async (vehicleId: string, month?: string) => {
    try {
      let url = `/api/purchases?vehicleId=${vehicleId}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        let purchases = data.data
        
        // Filter by month if specified
        if (month) {
          purchases = purchases.filter((purchase: IPurchase) => {
            const purchaseMonth = new Date(purchase.date).toISOString().slice(0, 7)
            return purchaseMonth === month
          })
        }
        
        return purchases
      }
      return []
    } catch (error) {
      console.error('Error fetching purchases:', error)
      return []
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    // Get all unique keys from the data
    const headers = Array.from(new Set(data.flatMap(Object.keys)))
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle dates, numbers, and strings
          if (value instanceof Date) {
            return `"${value.toLocaleDateString()}"`
          } else if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export')
      return
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async (type: 'trips' | 'purchases' | 'summary') => {
    setExporting(true)
    
    try {
      const monthSuffix = selectedMonth ? `_${selectedMonth}` : ''
      const dateStr = new Date().toISOString().split('T')[0]
      
      switch (type) {
        case 'trips':
          const tripsData = trips.map(trip => ({
            'Trip Name': trip.tripName,
            'Vehicle': `${trip.vehicleName} (${trip.vehicleNumber})`,
            'Start Date': new Date(trip.startDate).toLocaleDateString(),
            'End Date': trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'Ongoing',
            'Status': trip.status,
            'Duration (Days)': trip.endDate 
              ? Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
              : Math.ceil((new Date().getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)),
            'Total Investment (SAR)': trip.totalPurchases || 0,
            'Total Revenue (SAR)': trip.totalSales || 0,
            'Profit/Loss (SAR)': (trip.totalSales || 0) - (trip.totalPurchases || 0),
            'Oil Purchased (L)': trip.totalPurchaseLitres || 0,
            'Oil Sold (L)': trip.totalSalesLitres || 0,
            'Remaining Stock (L)': (trip.totalPurchaseLitres || 0) - (trip.totalSalesLitres || 0),
            'Is Profitable': trip.isProfitable ? 'Yes' : 'No',
            'Breakeven Reached': trip.hasReachedBreakeven ? 'Yes' : 'No'
          }))
          
          const tripsFilename = `${vehicle.vehicleName}_trips${monthSuffix}_${dateStr}.${exportFormat}`
          if (exportFormat === 'csv') {
            exportToCSV(tripsData, tripsFilename)
          } else {
            exportToJSON(tripsData, tripsFilename)
          }
          break

        case 'purchases':
          const purchases = await fetchAllPurchases(vehicle._id!, selectedMonth)
          const purchasesData = purchases.map((purchase: IPurchase) => ({
            'Date': new Date(purchase.date).toLocaleDateString(),
            'Trip Name': purchase.tripName,
            'Vehicle': `${purchase.vehicleName} (${purchase.vehicleNumber})`,
            'Transaction Type': purchase.type,
            'Price (SAR)': purchase.price,
            'Litres': purchase.litre,
            'Price per Litre (SAR)': (purchase.price / purchase.litre).toFixed(2),
            'Month': new Date(purchase.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          }))
          
          const purchasesFilename = `${vehicle.vehicleName}_transactions${monthSuffix}_${dateStr}.${exportFormat}`
          if (exportFormat === 'csv') {
            exportToCSV(purchasesData, purchasesFilename)
          } else {
            exportToJSON(purchasesData, purchasesFilename)
          }
          break

        case 'summary':
          const summaryData = [{
            'Vehicle Name': vehicle.vehicleName,
            'Vehicle Number': vehicle.vehicleNumber,
            'Driver': vehicle.driverName,
            'Co-Passenger': vehicle.coPassengerName,
            'Export Date': new Date().toLocaleDateString(),
            'Period': selectedMonth ? `Month: ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}` : 'All Time',
            'Total Trips': trips.length,
            'Active Trips': trips.filter(t => t.status === 'Active').length,
            'Completed Trips': trips.filter(t => t.status === 'Completed').length,
            'Profitable Trips': trips.filter(t => t.isProfitable).length,
            'Total Investment (SAR)': trips.reduce((sum, t) => sum + (t.totalPurchases || 0), 0),
            'Total Revenue (SAR)': trips.reduce((sum, t) => sum + (t.totalSales || 0), 0),
            'Total Profit/Loss (SAR)': trips.reduce((sum, t) => sum + (t.totalSales || 0), 0) - trips.reduce((sum, t) => sum + (t.totalPurchases || 0), 0),
            'Total Oil Purchased (L)': trips.reduce((sum, t) => sum + (t.totalPurchaseLitres || 0), 0),
            'Total Oil Sold (L)': trips.reduce((sum, t) => sum + (t.totalSalesLitres || 0), 0),
            'Total Remaining Stock (L)': trips.reduce((sum, t) => sum + (t.totalPurchaseLitres || 0), 0) - trips.reduce((sum, t) => sum + (t.totalSalesLitres || 0), 0),
            'Success Rate (%)': trips.length > 0 ? ((trips.filter(t => t.isProfitable).length / trips.length) * 100).toFixed(1) : '0'
          }]
          
          const summaryFilename = `${vehicle.vehicleName}_summary${monthSuffix}_${dateStr}.${exportFormat}`
          if (exportFormat === 'csv') {
            exportToCSV(summaryData, summaryFilename)
          } else {
            exportToJSON(summaryData, summaryFilename)
          }
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Format Selector */}
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>

        {/* Export Dropdown */}
        <div className="relative group">
          <button
            disabled={exporting}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <span>📊</span>
            <span>{exporting ? 'Exporting...' : 'Export Data'}</span>
            <span className="text-xs">▼</span>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="py-1">
              <button
                onClick={() => handleExport('summary')}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Vehicle Summary</span>
              </button>
              <button
                onClick={() => handleExport('trips')}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>🚛</span>
                <span>Trips Data</span>
              </button>
              <button
                onClick={() => handleExport('purchases')}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>💰</span>
                <span>All Transactions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}