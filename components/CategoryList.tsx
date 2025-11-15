'use client'

import { useState } from 'react'
import { ICategoryWithId } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingCard } from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

interface CategoryListProps {
  categories: ICategoryWithId[]
  loading: boolean
  onEdit: (category: ICategoryWithId) => void
  onDelete: (categoryId: string) => void
}

export default function CategoryList({ categories, loading, onEdit, onDelete }: CategoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (category: ICategoryWithId) => {
    if (!category._id) return
    
    if (!confirm(`Are you sure you want to delete "${category.name}" category?`)) {
      return
    }

    setDeletingId(category._id)
    
    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onDelete(category._id)
      } else {
        alert('Failed to delete category')
      }
    } catch (error) {
      alert('Error deleting category')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid-responsive">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No categories yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first category to start organizing expenses
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Categories help you track and analyze different types of expenses
        </div>
      </div>
    )
  }

  return (
    <div className="grid-responsive">
      {categories.map((category, index) => (
        <Card 
          key={category._id} 
          className="group hover:shadow-medium transition-all duration-200 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {category.name}
                  </h3>
                  <Badge variant="info" className="flex-shrink-0">
                    Active
                  </Badge>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6 4h6" />
                    </svg>
                    <span>Created {formatDate(category.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ready to use</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(category)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(category)}
                  loading={deletingId === category._id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}