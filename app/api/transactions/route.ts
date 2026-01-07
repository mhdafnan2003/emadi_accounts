import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const d = new Date(year, month - 1, day)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

type UnifiedTransaction = {
  id: string
  source: 'expense' | 'purchase-sale'
  type: string
  date: string
  amount: number
  direction: 'income' | 'expense'
  branchId?: string
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string
  category?: string
  description?: string
  purchaseSaleId?: string
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const url = new URL(request.url)
    const branchIdRaw = url.searchParams.get('branchId')
    const branchId = branchIdRaw && branchIdRaw !== 'all' ? branchIdRaw : undefined

    const dateFrom = parseDateOnly(url.searchParams.get('dateFrom'))
    const dateTo = parseDateOnly(url.searchParams.get('dateTo'))

    const expenseMatch: Record<string, any> = {}
    if (branchId) expenseMatch.branchId = branchId
    if (dateFrom || dateTo) {
      expenseMatch.date = {}
      if (dateFrom) expenseMatch.date.$gte = getStartOfDay(dateFrom)
      if (dateTo) expenseMatch.date.$lte = getEndOfDay(dateTo)
    }

    // Expenses (includes: opening balance expense, completed fund income, branch expenses, etc.)
    const expensesPromise = Expense.find(expenseMatch).sort({ date: -1, createdAt: -1 })

    // Purchase/Sale transactions (purchase, sale, expense) joined with PurchaseSale to get vehicle/branch
    const txDateMatch: Record<string, any> = {}
    if (dateFrom || dateTo) {
      txDateMatch.date = {}
      if (dateFrom) txDateMatch.date.$gte = getStartOfDay(dateFrom)
      if (dateTo) txDateMatch.date.$lte = getEndOfDay(dateTo)
    }

    const purchaseSaleTxPromise = PurchaseSaleTransaction.aggregate([
      ...(Object.keys(txDateMatch).length ? [{ $match: txDateMatch }] : []),
      {
        $lookup: {
          from: 'purchasesales',
          localField: 'purchaseSaleId',
          foreignField: '_id',
          as: 'ps',
        },
      },
      { $unwind: '$ps' },
      ...(branchId ? [{ $match: { 'ps.branchId': branchId } }] : []),
      {
        $project: {
          _id: 1,
          type: 1,
          date: 1,
          amount: 1,
          tins: 1,
          category: 1,
          description: 1,
          purchaseSaleId: 1,
          vehicleId: '$ps.vehicleId',
          vehicleName: '$ps.vehicleName',
          vehicleNumber: '$ps.vehicleNumber',
          branchId: '$ps.branchId',
        },
      },
      { $sort: { date: -1, createdAt: -1 } },
    ])

    const [expenses, purchaseSaleTx] = await Promise.all([expensesPromise, purchaseSaleTxPromise])

    const unified: UnifiedTransaction[] = []

    for (const exp of expenses as any[]) {
      const expenseType = exp.expenseType || 'other'
      const isIncome = expenseType === 'revenue'

      let typeLabel = isIncome ? 'Income' : 'Expense'
      const title: string = exp.title || ''
      if (title.startsWith('Purchase & Sale Opening')) typeLabel = 'Opening Balance (Expense)'
      if (title.startsWith('Purchase & Sale Collection')) typeLabel = 'Completed Fund (Income)'

      unified.push({
        id: String(exp._id),
        source: 'expense',
        type: typeLabel,
        date: new Date(exp.date).toISOString(),
        amount: Number(exp.amount || 0),
        direction: isIncome ? 'income' : 'expense',
        branchId: exp.branchId ? String(exp.branchId) : undefined,
        vehicleId: exp.vehicleId ? String(exp.vehicleId) : undefined,
        vehicleName: exp.vehicleName,
        category: exp.category,
        description: exp.description,
      })
    }

    for (const tx of purchaseSaleTx as any[]) {
      const direction: UnifiedTransaction['direction'] = tx.type === 'sale' ? 'income' : 'expense'
      const typeLabel = tx.type === 'purchase' ? 'Purchase' : tx.type === 'sale' ? 'Sale' : 'Vehicle Expense'

      unified.push({
        id: String(tx._id),
        source: 'purchase-sale',
        type: typeLabel,
        date: new Date(tx.date).toISOString(),
        amount: Number(tx.amount || 0),
        direction,
        branchId: tx.branchId ? String(tx.branchId) : undefined,
        vehicleId: tx.vehicleId ? String(tx.vehicleId) : undefined,
        vehicleName: tx.vehicleName,
        vehicleNumber: tx.vehicleNumber,
        category: tx.category,
        description: tx.description,
        purchaseSaleId: tx.purchaseSaleId ? String(tx.purchaseSaleId) : undefined,
      })
    }

    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Summary: purchase/sale/expense totals per vehicle (from PurchaseSaleTransaction)
    const vehicleSummary = new Map<string, { vehicleId: string; vehicleName?: string; vehicleNumber?: string; purchase: number; sale: number; expense: number }>()
    for (const tx of purchaseSaleTx as any[]) {
      const vehicleId = tx.vehicleId ? String(tx.vehicleId) : ''
      if (!vehicleId) continue
      if (!vehicleSummary.has(vehicleId)) {
        vehicleSummary.set(vehicleId, {
          vehicleId,
          vehicleName: tx.vehicleName,
          vehicleNumber: tx.vehicleNumber,
          purchase: 0,
          sale: 0,
          expense: 0,
        })
      }
      const row = vehicleSummary.get(vehicleId)!
      if (tx.type === 'purchase') row.purchase += Number(tx.amount || 0)
      else if (tx.type === 'sale') row.sale += Number(tx.amount || 0)
      else row.expense += Number(tx.amount || 0)
    }

    const vehicleSummaryList = Array.from(vehicleSummary.values()).sort((a, b) => (b.sale - b.purchase) - (a.sale - a.purchase))

    // Summary: expense totals per branch (from Expense; non-revenue)
    const branchExpenseAgg = await Expense.aggregate([
      { $match: expenseMatch },
      { $match: { expenseType: { $ne: 'revenue' } } },
      { $group: { _id: '$branchId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ])

    const branchExpenses = (branchExpenseAgg || []).map((r: any) => ({
      branchId: r._id ? String(r._id) : null,
      total: Number(r.total || 0),
    }))

    return NextResponse.json({
      success: true,
      data: {
        filters: {
          branchId: branchId || null,
          dateFrom: dateFrom ? dateFrom.toISOString().slice(0, 10) : null,
          dateTo: dateTo ? dateTo.toISOString().slice(0, 10) : null,
        },
        transactions: unified,
        summaries: {
          byVehicle: vehicleSummaryList,
          branchExpenses,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
