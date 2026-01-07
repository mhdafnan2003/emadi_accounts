'use client'

import React, { useState, useEffect } from 'react'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import { IExpenseWithId, IVehicleWithId, ICategoryWithId, IBranchWithId } from '@/types'
import { formatSAR } from '@/lib/utils'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpenseWithId[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<IExpenseWithId[]>([])
  const [vehicles, setVehicles] = useState<IVehicleWithId[]>([])
  const [categories, setCategories] = useState<ICategoryWithId[]>([])
  const [branches, setBranches] = useState<IBranchWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<IExpenseWithId | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data)
        applyFilters(data.data)
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

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchVehicles()
    fetchCategories()
    fetchBranches()
  }, [])

  const handleExpenseAdded = (newExpense: IExpenseWithId) => {
    // Use functional update to avoid stale state when adding multiple expenses quickly.
    setExpenses((prev) => {
      const updatedExpenses = [newExpense, ...prev]
      applyFilters(updatedExpenses)
      return updatedExpenses
    })

    // Re-sync with server to ensure table reflects persisted data.
    fetchExpenses()
    // Keep the form open so the user can add the next expense.
    // `ExpenseForm` already resets its fields after a successful create.
  }

  const handleExpenseUpdated = (updatedExpense: IExpenseWithId) => {
    setExpenses((prev) => {
      const updatedExpenses = prev.map((exp: IExpenseWithId) =>
        exp._id === updatedExpense._id ? updatedExpense : exp
      )
      applyFilters(updatedExpenses)
      return updatedExpenses
    })
    setEditingExpense(null)
    setShowForm(false)
  }

  const handleExpenseDeleted = (deletedId: string) => {
    setExpenses((prev) => {
      const updatedExpenses = prev.filter((exp: IExpenseWithId) => exp._id !== deletedId)
      applyFilters(updatedExpenses)
      return updatedExpenses
    })
  }

  const applyFilters = (expenseList: IExpenseWithId[]) => {
    let filtered = [...expenseList]

    // Date range filter (inclusive)
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      filtered = filtered.filter((expense) => new Date(expense.date) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((expense) => new Date(expense.date) <= to)
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((expense) => expense.category === selectedCategory)
    }

    // Branch filter
    if (selectedBranch) {
      if (selectedBranch === 'none') {
        filtered = filtered.filter((expense) => !expense.branchId)
      } else {
        filtered = filtered.filter((expense) => expense.branchId === selectedBranch)
      }
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter((expense) => {
        const haystack = [
          expense.title,
          expense.description,
          expense.category,
          expense.vehicleName,
          expense.tripName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    setFilteredExpenses(filtered)
  }

  useEffect(() => {
    applyFilters(expenses)
  }, [searchQuery, selectedCategory, selectedBranch, dateFrom, dateTo, expenses])

  const handleEdit = (expense: IExpenseWithId) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
    setShowForm(false)
  }

  const totalExpenses = filteredExpenses.reduce((sum: number, expense: IExpenseWithId) => sum + expense.amount, 0)
  const now = new Date()
  const todayExpenses = filteredExpenses
    .filter((expense) => {
      const d = new Date(expense.date)
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    })
    .reduce((sum: number, expense: IExpenseWithId) => sum + expense.amount, 0)
  const thisMonthExpenses = filteredExpenses
    .filter((expense) => {
      const d = new Date(expense.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum: number, expense: IExpenseWithId) => sum + expense.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
          {/* <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your vehicle expenses including trip data
          </p> */}
          {/* <div className="flex items-center space-x-4 mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Total: {formatSAR(totalExpenses)}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Trip-related: {tripExpenses.length} expenses
            </span>
          </div> */}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(totalExpenses)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Based on current filters</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
              <span className="text-gray-700 dark:text-gray-200 text-xl">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expenses Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(todayExpenses)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
              <span className="text-gray-700 dark:text-gray-200 text-xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expenses This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatSAR(thisMonthExpenses)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current month</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
              <span className="text-gray-700 dark:text-gray-200 text-xl">🗓️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={handleCancelEdit}
            className="absolute inset-0 bg-black/40"
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ExpenseForm
                vehicles={vehicles}
                categories={categories}
                branches={branches}
                expense={editingExpense}
                onExpenseAdded={handleExpenseAdded}
                onExpenseUpdated={handleExpenseUpdated}
                onCancel={handleCancelEdit}
              />
            </div>
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
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search:</label>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Title, description..."
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Category */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Branches</option>
                  <option value="none">No branch</option>
                  {[...branches]
                    .sort((a, b) => a.branchName.localeCompare(b.branchName))
                    .map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date range */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ExpenseList
            expenses={filteredExpenses}
            categories={categories}
            branches={branches}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleExpenseDeleted}
          />
        </div>
      </div>
    </div>
  )
}