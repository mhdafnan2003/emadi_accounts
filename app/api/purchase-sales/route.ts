import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PurchaseSale from '@/models/PurchaseSale'
import Vehicle from '@/models/Vehicle'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'

export async function GET() {
  try {
    await dbConnect()
    const items = await PurchaseSale.find({}).sort({ date: -1, createdAt: -1 })

    // Backfill missing calculated fields for older records.
    const patched = await Promise.all(items.map(async (item) => {
      const needsBalance = (item as any).currentBalance == null
      const needsTins = (item as any).currentTins == null
      if (!needsBalance && !needsTins) return item

      const txs = await PurchaseSaleTransaction.find({ purchaseSaleId: item._id })
      let balance = item.openingBalance
      let tins = 0
      for (const tx of txs) {
        balance += tx.type === 'sale' ? tx.amount : -tx.amount
        if (tx.type === 'purchase') tins += (tx.tins ?? 0)
        if (tx.type === 'sale') tins -= (tx.tins ?? 0)
      }

      if (needsBalance) (item as any).currentBalance = Math.max(0, balance)
      if (needsTins) (item as any).currentTins = Math.max(0, tins)
      await item.save()
      return item
    }))

    return NextResponse.json({ success: true, data: patched })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase-sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    const date = body?.date ? new Date(body.date) : undefined
    const vehicleId = typeof body?.vehicleId === 'string' ? body.vehicleId.trim() : ''
    const openingBalance = typeof body?.openingBalance === 'number' ? body.openingBalance : Number(body?.openingBalance)

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Valid date is required' },
        { status: 400 }
      )
    }

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle is required' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(openingBalance)) {
      return NextResponse.json(
        { success: false, error: 'Opening balance is required' },
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

    const item = await PurchaseSale.create({
      date,
      vehicleId,
      vehicleName: vehicle.vehicleName,
      vehicleNumber: vehicle.vehicleNumber,
      branchId: vehicle.branchId,
      openingBalance,
      currentBalance: openingBalance,
      currentTins: 0,
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase-sale' },
      { status: 500 }
    )
  }
}
