'use client'

import React, { useState, useEffect } from 'react'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import { IExpenseWithId, IVehicleWithId, ICategoryWithId } from '@/types'
import { formatSAR, formatNumber } from '@/lib/utils'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpenseWithId[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<IExpenseWithId[]>([])
  const [vehicles, setVehicles] = useState<IVehicleWithId[]>([])
  const [categories, setCategories] = useState<ICategoryWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<IExpenseWithId | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'investment' | 'revenue' | 'other'>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data)
        setFilteredExpenses(data.data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      if (data.success) {
        setVehicles(data.data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchVehicles()
    fetchCategories()
  }, [])

  const handleExpenseAdded = (newExpense: IExpenseWithId) => {
    const updatedExpenses = [newExpense, ...expenses]
    setExpenses(updatedExpenses)
    applyFilters(updatedExpenses)
    setShowForm(false)
  }

  const handleExpenseUpdated = (updatedExpense: IExpenseWithId) => {
    const updatedExpenses = expenses.map((exp: IExpenseWithId) => 
      exp._id === updatedExpense._id ? updatedExpense : exp
    )
    setExpenses(updatedExpenses)
    applyFilters(updatedExpenses)
    setEditingExpense(null)
    setShowForm(false)
  }

  const handleExpenseDeleted = (deletedId: string) => {
    const updatedExpenses = expenses.filter((exp: IExpenseWithId) => exp._id !== deletedId)
    setExpenses(updatedExpenses)
    applyFilters(updatedExpenses)
  }

  const applyFilters = (expenseList: IExpenseWithId[]) => {
    let filtered = [...expenseList]

    // Filter by expense type
    if (filterType !== 'all') {
      filtered = filtered.filter(expense => expense.expenseType === filterType)
    }

    // Filter by vehicle
    if (selectedVehicle) {
      filtered = filtered.filter(expense => expense.vehicleId === selectedVehicle)
    }

    setFilteredExpenses(filtered)
  }

  const handleFilterChange = (type: 'all' | 'investment' | 'revenue' | 'other') => {
    setFilterType(type)
    applyFilters(expenses)
  }

  const handleVehicleFilter = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    applyFilters(expenses)
  }

  useEffect(() => {
    applyFilters(expenses)
  }, [filterType, selectedVehicle, expenses])

  const handleEdit = (expense: IExpenseWithId) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
    setShowForm(false)
  }

  const totalExpenses = filteredExpenses.reduce((sum: number, expense: IExpenseWithId) => sum + expense.amount, 0)
  const tripExpenses = filteredExpenses.filter(exp => exp.tripId)
  const investmentTotal = filteredExpenses.filter(exp => exp.expenseType === 'investment').reduce((sum: number, exp: IExpenseWithId) => sum + exp.amount, 0)
  const revenueTotal = filteredExpenses.filter(exp => exp.expenseType === 'revenue').reduce((sum: number, exp: IExpenseWithId) => sum + exp.amount, 0)
  const otherTotal = filteredExpenses.filter(exp => exp.expenseType === 'other' || !exp.expenseType).reduce((sum: number, exp: IExpenseWithId) => sum + exp.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your vehicle expenses including trip data
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Total: {formatSAR(totalExpenses)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Trip-related: {tripExpenses.length} expenses
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>{showForm ? 'Cancel' : 'Add Expense'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Investment</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatSAR(investmentTotal)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Oil purchases</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <span className="text-red-600 dark:text-red-400 text-xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatSAR(revenueTotal)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Oil sales</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
              <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Other Expenses</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatSAR(otherTotal)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">General expenses</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
              <span className="text-blue-600 dark:text-blue-400 text-xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Net Profit</p>
              <p className={`text-2xl font-bold ${revenueTotal - investmentTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatSAR(Math.abs(revenueTotal - investmentTotal))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue - Investment</p>
            </div>
            <div className={`${revenueTotal - investmentTotal >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} p-3 rounded-full`}>
              <span className={`${revenueTotal - investmentTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-xl`}>
                {revenueTotal - investmentTotal >= 0 ? '📈' : '📉'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Form */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <ExpenseForm
              vehicles={vehicles}
              categories={categories}
              expense={editingExpense}
              onExpenseAdded={handleExpenseAdded}
              onExpenseUpdated={handleExpenseUpdated}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expense List</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {loading ? 'Loading...' : `${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''} shown`}
                {expenses.length !== filteredExpenses.length && (
                  <span className="text-sm text-gray-500 dark:text-gray-400"> (of {expenses.length} total)</span>
                )}
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Expense Type Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value as 'all' | 'investment' | 'revenue' | 'other')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Types</option>
                  <option value="investment">Investment</option>
                  <option value="revenue">Revenue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Vehicle Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle:</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => handleVehicleFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleName} ({vehicle.vehicleNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ExpenseList
            expenses={filteredExpenses}
            categories={categories}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleExpenseDeleted}
          />
        </div>
      </div>
    </div>
  )
}