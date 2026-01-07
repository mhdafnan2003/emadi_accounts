'use client'

import React, { useEffect, useState } from 'react'
import PurchaseSaleForm from '@/components/PurchaseSaleForm'
import PurchaseSaleList from '@/components/PurchaseSaleList'
import { IBranchWithId, IPurchaseSaleWithId, IVehicleWithId } from '@/types'

export default function PurchaseSalesPage() {
  const [vehicles, setVehicles] = useState<IVehicleWithId[]>([])
  const [branches, setBranches] = useState<IBranchWithId[]>([])
  const [items, setItems] = useState<IPurchaseSaleWithId[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<IPurchaseSaleWithId | null>(null)

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

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/purchase-sales')
      const data = await response.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching purchase-sales:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
    fetchBranches()
    fetchItems()
  }, [])

  const handleAdded = (newItem: IPurchaseSaleWithId) => {
    setItems((prev) => [newItem, ...prev])
    fetchItems()
    setShowForm(false)
  }

  const handleUpdated = (updatedItem: IPurchaseSaleWithId) => {
    setItems((prev) => prev.map((it) => (it._id === updatedItem._id ? updatedItem : it)))
    setEditingItem(null)
    setShowForm(false)
  }

  const handleDeleted = (deletedId: string) => {
    setItems((prev) => prev.filter((it) => it._id !== deletedId))
  }

  const handleEdit = (item: IPurchaseSaleWithId) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingItem(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Purchase &amp; Sale</h1>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>Create</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6">
          <PurchaseSaleList
            items={items}
            vehicles={vehicles}
            branches={branches}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleted}
            onUpdated={handleUpdated}
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            onClick={handleCancel}
            className="absolute inset-0 bg-black/40"
          />

          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingItem ? 'Edit Purchase & Sale' : 'Create Purchase & Sale'}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <PurchaseSaleForm
                vehicles={vehicles}
                branches={branches}
                item={editingItem}
                onAdded={handleAdded}
                onUpdated={handleUpdated}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
