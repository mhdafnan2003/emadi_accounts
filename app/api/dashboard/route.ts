import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Expense from '@/models/Expense'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'
import Vehicle from '@/models/Vehicle'
import mongoose from 'mongoose'

function parseDateOnly(value: string | null): Date | null {
  if (!value) return null
  // Expecting YYYY-MM-DD (parse as local date to avoid timezone shifts)
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

    const now = new Date()
    const todayExpenseMatch: Record<string, any> = {
      ...(branchId ? { branchId } : {}),
      date: {
        $gte: getStartOfDay(now),
        $lte: getEndOfDay(now),
      },
    }

    // Purchase & Sale transactions live in PurchaseSaleTransaction and should contribute
    // to dashboard expense totals (purchase + expense). They do NOT count as revenue;
    // revenue is handled via Expense (e.g., "Complete Collection" creates a revenue Expense).
    const purchaseSaleTxDateMatch: Record<string, any> = {}
    if (dateFrom || dateTo) {
      purchaseSaleTxDateMatch.date = {}
      if (dateFrom) purchaseSaleTxDateMatch.date.$gte = getStartOfDay(dateFrom)
      if (dateTo) purchaseSaleTxDateMatch.date.$lte = getEndOfDay(dateTo)
    }

    const todayPurchaseSaleTxDateMatch: Record<string, any> = {
      date: {
        $gte: getStartOfDay(now),
        $lte: getEndOfDay(now),
      },
    }

    const branchObjectId =
      branchId && mongoose.Types.ObjectId.isValid(branchId)
        ? new mongoose.Types.ObjectId(branchId)
        : null

    const purchaseSaleBranchMatch = branchId
      ? {
          $match: {
            $or: [
              { 'purchaseSale.branchId': branchId },
              ...(branchObjectId ? [{ 'purchaseSale.branchId': branchObjectId }] : []),
            ],
          },
        }
      : null

    const [
      totalsExpenseAgg,
      todayExpenseAgg,
      byVehicleExpenseAgg,
      totalsPurchaseSaleOutflowAgg,
      todayPurchaseSaleOutflowAgg,
      byVehiclePurchaseSaleOutflowAgg,
      vehicles,
    ] = await Promise.all([
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $ne: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      Expense.aggregate([
        { $match: todayExpenseMatch },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $ne: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            ...expenseMatch,
            vehicleId: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$vehicleId',
            vehicleName: { $first: '$vehicleName' },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
            expense: {
              $sum: {
                $cond: [{ $ne: ['$expenseType', 'revenue'] }, '$amount', 0],
              },
            },
          },
        },
      ]),
      PurchaseSaleTransaction.aggregate([
        ...(Object.keys(purchaseSaleTxDateMatch).length ? [{ $match: purchaseSaleTxDateMatch }] : []),
        {
          $lookup: {
            from: 'purchasesales',
            localField: 'purchaseSaleId',
            foreignField: '_id',
            as: 'purchaseSale',
          },
        },
        { $unwind: '$purchaseSale' },
        ...(purchaseSaleBranchMatch ? [purchaseSaleBranchMatch] : []),
        {
          $group: {
            _id: null,
            purchase: {
              $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0] },
            },
            expense: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          },
        },
      ]),
      PurchaseSaleTransaction.aggregate([
        { $match: todayPurchaseSaleTxDateMatch },
        {
          $lookup: {
            from: 'purchasesales',
            localField: 'purchaseSaleId',
            foreignField: '_id',
            as: 'purchaseSale',
          },
        },
        { $unwind: '$purchaseSale' },
        ...(purchaseSaleBranchMatch ? [purchaseSaleBranchMatch] : []),
        {
          $group: {
            _id: null,
            purchase: {
              $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0] },
            },
            expense: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          },
        },
      ]),
      PurchaseSaleTransaction.aggregate([
        ...(Object.keys(purchaseSaleTxDateMatch).length ? [{ $match: purchaseSaleTxDateMatch }] : []),
        {
          $lookup: {
            from: 'purchasesales',
            localField: 'purchaseSaleId',
            foreignField: '_id',
            as: 'purchaseSale',
          },
        },
        { $unwind: '$purchaseSale' },
        ...(purchaseSaleBranchMatch ? [purchaseSaleBranchMatch] : []),
        {
          $match: {
            'purchaseSale.vehicleId': { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$purchaseSale.vehicleId',
            outflow: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['purchase', 'expense']] },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
      ]),
      Vehicle.find(branchId ? { branchId } : {}).sort({ createdAt: -1 }),
    ])

    const expenseTotals = totalsExpenseAgg?.[0] || { revenue: 0, expense: 0 }
    const expenseToday = todayExpenseAgg?.[0] || { revenue: 0, expense: 0 }

    const psOutflowTotals = totalsPurchaseSaleOutflowAgg?.[0] || { purchase: 0, expense: 0 }
    const psOutflowToday = todayPurchaseSaleOutflowAgg?.[0] || { purchase: 0, expense: 0 }
    const psOutflowTotalAmount =
      Number(psOutflowTotals.purchase || 0) + Number(psOutflowTotals.expense || 0)
    const psOutflowTodayAmount =
      Number(psOutflowToday.purchase || 0) + Number(psOutflowToday.expense || 0)

    // Opening balance stays independent (not an Expense, not part of revenue/expense totals)
    const totals = {
      revenue: Number(expenseTotals.revenue || 0),
      expense: Number(expenseTotals.expense || 0) + psOutflowTotalAmount,
    }

    const today = {
      revenue: Number(expenseToday.revenue || 0),
      expense: Number(expenseToday.expense || 0) + psOutflowTodayAmount,
    }

    const totalsProfit = Number(totals.revenue || 0) - Number(totals.expense || 0)
    const todayProfit = Number(today.revenue || 0) - Number(today.expense || 0)

    const byVehicleExpenseMap = new Map<
      string,
      { vehicleId: string; vehicleName?: string; revenue: number; expense: number }
    >()
    for (const row of byVehicleExpenseAgg || []) {
      byVehicleExpenseMap.set(String(row._id), {
        vehicleId: String(row._id),
        vehicleName: row.vehicleName,
        revenue: Number(row.revenue || 0),
        expense: Number(row.expense || 0),
      })
    }

    const byVehiclePurchaseSaleOutflowMap = new Map<string, number>()
    for (const row of byVehiclePurchaseSaleOutflowAgg || []) {
      byVehiclePurchaseSaleOutflowMap.set(String(row._id), Number(row.outflow || 0))
    }

    const byVehicle = (vehicles || []).map((v: any) => {
      const row = byVehicleExpenseMap.get(String(v._id))
      const baseRevenue = row?.revenue || 0
      const baseExpense = row?.expense || 0
      const psOutflow = byVehiclePurchaseSaleOutflowMap.get(String(v._id)) || 0
      const revenue = Number(baseRevenue)
      const expense = Number(baseExpense) + Number(psOutflow)
      return {
        vehicleId: String(v._id),
        vehicleName: row?.vehicleName || v.vehicleName || v.vehicleNumber,
        vehicleNumber: v.vehicleNumber,
        revenue,
        expense,
        profit: Number(revenue) - Number(expense),
      }
    })

    byVehicle.sort((a, b) => (b.profit || 0) - (a.profit || 0))

    return NextResponse.json({
      success: true,
      data: {
        filters: {
          branchId: branchId || null,
          dateFrom: dateFrom ? dateFrom.toISOString().slice(0, 10) : null,
          dateTo: dateTo ? dateTo.toISOString().slice(0, 10) : null,
        },
        totals: {
          revenue: Number(totals.revenue || 0),
          expense: Number(totals.expense || 0),
          profit: Number(totalsProfit || 0),
        },
        today: {
          revenue: Number(today.revenue || 0),
          expense: Number(today.expense || 0),
          profit: Number(todayProfit || 0),
        },
        byVehicle,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
