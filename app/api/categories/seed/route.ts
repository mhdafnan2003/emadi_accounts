import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'

const defaultCategories = [
  { name: 'Fuel', description: 'Petrol, diesel, and other fuel costs' },
  { name: 'Maintenance', description: 'Regular vehicle maintenance' },
  { name: 'Insurance', description: 'Vehicle insurance premiums' },
  { name: 'Registration', description: 'Vehicle registration and licensing' },
  { name: 'Repairs', description: 'Vehicle repairs and fixes' },
  { name: 'Tolls', description: 'Highway and bridge tolls' },
  { name: 'Parking', description: 'Parking fees and charges' },
  { name: 'Other', description: 'Miscellaneous expenses' },
]

export async function POST() {
  try {
    await dbConnect()
    
    // Check if categories already exist
    const existingCount = await Category.countDocuments()
    if (existingCount > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Categories already exist',
        count: existingCount 
      })
    }
    
    // Create default categories
    const categories = await Category.insertMany(defaultCategories)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Default categories created successfully',
      data: categories 
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed categories' },
      { status: 500 }
    )
  }
}