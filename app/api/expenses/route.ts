import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'

export async function GET() {
  try {
    await dbConnect()
    const expenses = await Expense.find({}).sort({ date: -1 })
    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const expense = await Expense.create(body)
    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}