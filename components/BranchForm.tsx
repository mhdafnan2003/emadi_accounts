'use client'

import { useEffect, useMemo, useState } from 'react'
import { IBranchWithId } from '@/types'

interface BranchFormProps {
  branch?: IBranchWithId | null
  onBranchAdded: (branch: IBranchWithId) => void
  onBranchUpdated: (branch: IBranchWithId) => void
  onCancel?: () => void
}

function sanitizePhone(value: string): string {
  return value.trim().replace(/[\s\-()]/g, '')
}

export default function BranchForm({ branch, onBranchAdded, onBranchUpdated, onCancel }: BranchFormProps) {
  const [formData, setFormData] = useState({
    branchName: '',
    phoneNumber: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName || '',
        phoneNumber: branch.phoneNumber || '',
        address: branch.address || '',
      })
    }
  }, [branch])

  const phoneHelp = useMemo(() => {
    return 'Optional'
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const nameOk = formData.branchName.trim().length > 0
    if (!nameOk) {
      setLoading(false)
      setError('Branch name is required')
      return
    }


    try {
      const url = branch ? `/api/branches/${branch._id}` : '/api/branches'
      const method = branch ? 'PUT' : 'POST'

      const payload = {
        branchName: formData.branchName.trim(),
        phoneNumber: formData.phoneNumber ? sanitizePhone(formData.phoneNumber) : undefined,
        address: formData.address.trim() || undefined,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        if (branch) {
          onBranchUpdated(data.data)
        } else {
          onBranchAdded(data.data)
        }

        if (!branch) {
          setFormData({ branchName: '', phoneNumber: '', address: '' })
        }
      } else {
        setError(data.error || 'Failed to save branch')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Branch Name
        </label>
        <input
          type="text"
          id="branchName"
          name="branchName"
          value={formData.branchName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter branch name"
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter phone number"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{phoneHelp}</p>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="Enter address"
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : branch ? 'Update Branch' : 'Add Branch'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
