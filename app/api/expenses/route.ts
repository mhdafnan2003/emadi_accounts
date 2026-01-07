import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    // By default, show only expenses created from the Expenses section
    // (i.e., normal/manual expenses). System-generated entries like Purchase & Sale
    // opening/collection and manual revenue adjustments are stored with
    // expenseType: 'investment' or 'revenue' and should not appear here.
    const url = new URL(request.url)
    const includeAll = url.searchParams.get('includeAll') === 'true'

    const match = includeAll
      ? {}
      : {
        $or: [
          { expenseType: { $exists: false } },
          { expenseType: null },
          { expenseType: 'other' },
        ],
      }

    const expenses = await Expense.find(match).sort({ date: -1 })
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