import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'
import mongoose from 'mongoose'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const id = params?.id
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing expense id' },
        { status: 400 }
      )
    }
    
    // Mongoose normally stores `_id` as ObjectId. If legacy/imported data stored `_id` as string,
    // `findByIdAndDelete` will not match. Try both.
    let expense: any = await Expense.findByIdAndDelete(id)

    if (!expense) {
      const legacyDelete = await Expense.collection.findOneAndDelete({ _id: id as any })
      expense = legacyDelete.value
    }

    if (!expense && mongoose.Types.ObjectId.isValid(id)) {
      const oidDelete = await Expense.collection.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) })
      expense = oidDelete.value
    }
    
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