'use client'

import * as React from 'react'
import CategoryForm from '@/components/CategoryForm'
import CategoryList from '@/components/CategoryList'
import { ICategoryWithId } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<ICategoryWithId[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<ICategoryWithId | null>(null)

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

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const handleCategoryAdded = (newCategory: ICategoryWithId) => {
    setCategories([...categories, newCategory])
    setShowForm(false)
  }

  const handleCategoryUpdated = (updatedCategory: ICategoryWithId) => {
    setCategories(categories.map(cat => 
      cat._id === updatedCategory._id ? updatedCategory : cat
    ))
    setEditingCategory(null)
    setShowForm(false)
  }

  const handleCategoryDeleted = (deletedId: string) => {
    setCategories(categories.filter(cat => cat._id !== deletedId))
  }

  const handleEdit = (category: ICategoryWithId) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your expenses with custom categories
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{showForm ? 'Cancel' : 'Add Category'}</span>
          </Button>
        </div>
      </div>

      {/* Add/Edit Category Form */}
      {showForm && (
        <Card className="animate-slide-down">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{editingCategory ? 'Edit Category' : 'Add New Category'}</span>
            </CardTitle>
            <CardDescription>
              {editingCategory 
                ? 'Update the category details below' 
                : 'Create a new category to organize your expenses'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm
              category={editingCategory}
              onCategoryAdded={handleCategoryAdded}
              onCategoryUpdated={handleCategoryUpdated}
              onCancel={handleCancelEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Category List */}
      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>All Categories</span>
              </CardTitle>
              <CardDescription>
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 loading-spinner" />
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} total`
                )}
              </CardDescription>
            </div>
            {categories.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CategoryList
            categories={categories}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleCategoryDeleted}
          />
        </CardContent>
      </Card>
    </div>
  )
}