import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PurchaseSale from '@/models/PurchaseSale'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'

type TxType = 'purchase' | 'sale' | 'expense'

function parseDate(value: any): Date | null {
  if (value == null) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function parseNumber(value: any): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return n
}

function getEffects(type: TxType, amount: number, tins?: number | null) {
  const balanceEffect = type === 'sale' ? amount : -amount
  const tinsEffect = type === 'purchase' ? (tins ?? 0) : type === 'sale' ? -(tins ?? 0) : 0
  return { balanceEffect, tinsEffect }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; transactionId: string } }
) {
  try {
    await dbConnect()

    const purchaseSale = await PurchaseSale.findById(params.id)
    if (!purchaseSale) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    const tx = await PurchaseSaleTransaction.findOne({
      _id: params.transactionId,
      purchaseSaleId: purchaseSale._id,
    })

    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: tx })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; transactionId: string } }
) {
  try {
    await dbConnect()
    const body = await request.json()

    const purchaseSale = await PurchaseSale.findById(params.id)
    if (!purchaseSale) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    const tx = await PurchaseSaleTransaction.findOne({
      _id: params.transactionId,
      purchaseSaleId: purchaseSale._id,
    })

    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const type = (body?.type ?? tx.type) as TxType
    if (!type || !['purchase', 'sale', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid transaction type is required' },
        { status: 400 }
      )
    }

    const date = parseDate(body?.date) ?? tx.date
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Valid date is required' },
        { status: 400 }
      )
    }

    const amount = parseNumber(body?.amount) ?? tx.amount
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const tinsRaw = body?.tins
    const tinsParsed = tinsRaw === undefined ? undefined : parseNumber(tinsRaw)
    if (tinsRaw !== undefined && tinsParsed == null) {
      return NextResponse.json(
        { success: false, error: 'No of tins must be a valid number' },
        { status: 400 }
      )
    }

    const tins = tinsRaw === undefined ? (tx.tins ?? undefined) : tinsParsed

    if ((type === 'purchase' || type === 'sale') && tins == null) {
      return NextResponse.json(
        { success: false, error: 'No of tins is required' },
        { status: 400 }
      )
    }

    if (tins != null && (!Number.isFinite(tins) || tins < 0)) {
      return NextResponse.json(
        { success: false, error: 'No of tins must be a valid number' },
        { status: 400 }
      )
    }

    const description = typeof body?.description === 'string' ? body.description.trim() : (tx.description ?? undefined)
    const category = typeof body?.category === 'string' ? body.category.trim() : (tx.category ?? undefined)

    if (type === 'expense' && !category) {
      return NextResponse.json(
        { success: false, error: 'Category is required for expense' },
        { status: 400 }
      )
    }

    const currentBalance = (purchaseSale as any).currentBalance ?? purchaseSale.openingBalance
    const currentTins = (purchaseSale as any).currentTins ?? 0

    const oldEffects = getEffects(tx.type as TxType, tx.amount, tx.tins ?? 0)
    const newEffects = getEffects(type, amount, tins ?? 0)

    const balanceDelta = newEffects.balanceEffect - oldEffects.balanceEffect
    const tinsDelta = newEffects.tinsEffect - oldEffects.tinsEffect

    const nextBalance = currentBalance + balanceDelta
    const nextTins = currentTins + tinsDelta

    if (nextBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    if (nextTins < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient tins' },
        { status: 400 }
      )
    }

    tx.type = type
    tx.date = date
    tx.amount = amount
    tx.tins = (type === 'purchase' || type === 'sale') ? (tins ?? 0) : undefined
    tx.category = type === 'expense' ? category : undefined
    tx.description = description || undefined

    await tx.save()

    await PurchaseSale.findByIdAndUpdate(
      purchaseSale._id,
      { currentBalance: nextBalance, currentTins: nextTins },
      { runValidators: true }
    )

    return NextResponse.json({ success: true, data: tx })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; transactionId: string } }
) {
  try {
    await dbConnect()

    const purchaseSale = await PurchaseSale.findById(params.id)
    if (!purchaseSale) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    const tx = await PurchaseSaleTransaction.findOne({
      _id: params.transactionId,
      purchaseSaleId: purchaseSale._id,
    })

    if (!tx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const currentBalance = (purchaseSale as any).currentBalance ?? purchaseSale.openingBalance
    const currentTins = (purchaseSale as any).currentTins ?? 0

    const oldEffects = getEffects(tx.type as TxType, tx.amount, tx.tins ?? 0)
    const balanceDelta = -oldEffects.balanceEffect
    const tinsDelta = -oldEffects.tinsEffect

    const nextBalance = currentBalance + balanceDelta
    const nextTins = currentTins + tinsDelta

    if (nextBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    if (nextTins < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient tins' },
        { status: 400 }
      )
    }

    await PurchaseSale.findByIdAndUpdate(
      purchaseSale._id,
      { currentBalance: nextBalance, currentTins: nextTins },
      { runValidators: true }
    )

    await PurchaseSaleTransaction.findByIdAndDelete(tx._id)

    return NextResponse.json({ success: true, data: tx })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
