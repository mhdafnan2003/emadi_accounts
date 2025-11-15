import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const expense = await Expense.findByIdAndDelete(params.id)
    
    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: expense })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete expense' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const expense = await Expense.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: expense })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update expense' },
      { status: 500 }
    )
  }
}