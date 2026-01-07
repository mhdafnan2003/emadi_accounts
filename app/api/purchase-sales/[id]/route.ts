import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PurchaseSale from '@/models/PurchaseSale'
import Vehicle from '@/models/Vehicle'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'
import Expense from '@/models/Expense'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const item = await PurchaseSale.findById(params.id)
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    // Backfill calculated fields for older records created before they existed.
    if ((item as any).currentBalance == null || (item as any).currentTins == null) {
      const txs = await PurchaseSaleTransaction.find({ purchaseSaleId: item._id })
      let balance = item.openingBalance
      let tins = 0
      for (const tx of txs) {
        balance += tx.type === 'sale' ? tx.amount : -tx.amount
        if (tx.type === 'purchase') tins += (tx.tins ?? 0)
        if (tx.type === 'sale') tins -= (tx.tins ?? 0)
      }
      ;(item as any).currentBalance = Math.max(0, balance)
      ;(item as any).currentTins = Math.max(0, tins)
      await item.save()
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase-sale' },
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

    // Undo Complete Collection: revert completed flag and remove the generated revenue expense
    if (body?.undoCompleteCollection === true) {
      const existing = await PurchaseSale.findById(params.id)
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Purchase-sale not found' },
          { status: 404 }
        )
      }

      if (!(existing as any).completed) {
        return NextResponse.json({ success: true, data: existing })
      }

      const collectionExpenseId = (existing as any).collectionExpenseId
      if (collectionExpenseId) {
        await Expense.findByIdAndDelete(collectionExpenseId)
      }

      ;(existing as any).completed = false
      ;(existing as any).completedAt = undefined
      ;(existing as any).collectionExpenseId = undefined
      await existing.save()

      return NextResponse.json({ success: true, data: existing })
    }

    // Complete Collection: mark purchase-sale completed and add currentBalance as revenue
    if (body?.completeCollection === true) {
      const existing = await PurchaseSale.findById(params.id)
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Purchase-sale not found' },
          { status: 404 }
        )
      }

      if ((existing as any).completed) {
        return NextResponse.json({ success: true, data: existing })
      }

      const collectedAt = new Date()
      const currentBalance = (existing as any).currentBalance ?? existing.openingBalance
      const revenueExpense = await Expense.create({
        title: `Purchase & Sale Collection - ${existing.vehicleName || existing.vehicleNumber || 'Vehicle'}`,
        amount: Number(currentBalance || 0),
        category: 'Purchase & Sale',
        description: 'Collection completed for Purchase & Sale',
        date: collectedAt,
        branchId: (existing as any).branchId,
        vehicleId: existing.vehicleId,
        vehicleName: existing.vehicleName,
        expenseType: 'revenue',
      })

      ;(existing as any).completed = true
      ;(existing as any).completedAt = collectedAt
      ;(existing as any).collectionExpenseId = revenueExpense._id
      await existing.save()

      return NextResponse.json({ success: true, data: existing })
    }

    const update: any = {}

    if (body?.date != null) {
      const date = new Date(body.date)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Valid date is required' },
          { status: 400 }
        )
      }
      update.date = date
    }

    if (body?.openingBalance != null) {
      const openingBalance = typeof body.openingBalance === 'number' ? body.openingBalance : Number(body.openingBalance)
      if (!Number.isFinite(openingBalance)) {
        return NextResponse.json(
          { success: false, error: 'Opening balance must be a number' },
          { status: 400 }
        )
      }
      update.openingBalance = openingBalance
    }

    if (body?.vehicleId != null) {
      const vehicleId = typeof body.vehicleId === 'string' ? body.vehicleId.trim() : ''
      if (!vehicleId) {
        return NextResponse.json(
          { success: false, error: 'Vehicle is required' },
          { status: 400 }
        )
      }

      const vehicle = await Vehicle.findById(vehicleId)
      if (!vehicle) {
        return NextResponse.json(
          { success: false, error: 'Vehicle not found' },
          { status: 404 }
        )
      }

      update.vehicleId = vehicleId
      update.vehicleName = vehicle.vehicleName
      update.vehicleNumber = vehicle.vehicleNumber
      update.branchId = vehicle.branchId
    }

    const item = await PurchaseSale.findByIdAndUpdate(
      params.id,
      update,
      { new: true, runValidators: true }
    )

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update purchase-sale' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const item = await PurchaseSale.findByIdAndDelete(params.id)

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    // Clean up linked records
    const openingExpenseId = (item as any).openingExpenseId
    const collectionExpenseId = (item as any).collectionExpenseId
    await Promise.all([
      // Legacy cleanup: older records may have an openingExpenseId.
      openingExpenseId ? Expense.findByIdAndDelete(openingExpenseId) : Promise.resolve(null),
      collectionExpenseId ? Expense.findByIdAndDelete(collectionExpenseId) : Promise.resolve(null),
      PurchaseSaleTransaction.deleteMany({ purchaseSaleId: item._id }),
    ])

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete purchase-sale' },
      { status: 500 }
    )
  }
}
