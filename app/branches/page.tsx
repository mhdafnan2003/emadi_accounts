'use client'

import { useEffect, useState } from 'react'
import BranchForm from '@/components/BranchForm'
import BranchList from '@/components/BranchList'
import { IBranchWithId } from '@/types'

export default function BranchesPage() {
  const [branches, setBranches] = useState<IBranchWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<IBranchWithId | null>(null)

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleBranchAdded = (newBranch: IBranchWithId) => {
    setBranches((prev) => [newBranch, ...prev])
  }

  const handleBranchUpdated = (updatedBranch: IBranchWithId) => {
    setBranches(branches.map((b) => (b._id === updatedBranch._id ? updatedBranch : b)))
    setEditingBranch(null)
    setShowForm(false)
  }

  const handleBranchDeleted = (deletedId: string) => {
    setBranches(branches.filter((b) => b._id !== deletedId))
  }

  const handleEdit = (branch: IBranchWithId) => {
    setEditingBranch(branch)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingBranch(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Branches</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your branches</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>{showForm ? 'Cancel' : 'Add Branch'}</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={handleCancelEdit} className="absolute inset-0 bg-black/40" />

          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
              <BranchForm
                branch={editingBranch}
                onBranchAdded={handleBranchAdded}
                onBranchUpdated={handleBranchUpdated}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Branch List</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {loading ? 'Loading...' : `${branches.length} branch${branches.length !== 1 ? 'es' : ''} total`}
          </p>
        </div>
        <div className="p-6">
          <BranchList branches={branches} loading={loading} onEdit={handleEdit} onDelete={handleBranchDeleted} />
        </div>
      </div>
    </div>
  )
}
