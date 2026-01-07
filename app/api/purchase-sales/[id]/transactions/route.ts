import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PurchaseSale from '@/models/PurchaseSale'
import PurchaseSaleTransaction from '@/models/PurchaseSaleTransaction'

type TxType = 'purchase' | 'sale' | 'expense'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const items = await PurchaseSaleTransaction.find({ purchaseSaleId: purchaseSale._id })
      .sort({ date: -1, createdAt: -1 })

    return NextResponse.json({ success: true, data: items })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const body = await request.json()

    const type = body?.type as TxType
    if (!type || !['purchase', 'sale', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid transaction type is required' },
        { status: 400 }
      )
    }

    const date = body?.date ? new Date(body.date) : undefined
    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Valid date is required' },
        { status: 400 }
      )
    }

    const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount)
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const tinsRaw = body?.tins
    const tins = tinsRaw == null ? undefined : (typeof tinsRaw === 'number' ? tinsRaw : Number(tinsRaw))
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

    const description = typeof body?.description === 'string' ? body.description.trim() : undefined
    const category = typeof body?.category === 'string' ? body.category.trim() : undefined

    if (type === 'expense' && !category) {
      return NextResponse.json(
        { success: false, error: 'Category is required for expense' },
        { status: 400 }
      )
    }

    const purchaseSale = await PurchaseSale.findById(params.id)
    if (!purchaseSale) {
      return NextResponse.json(
        { success: false, error: 'Purchase-sale not found' },
        { status: 404 }
      )
    }

    const currentBalance = (purchaseSale as any).currentBalance ?? purchaseSale.openingBalance
    const delta = type === 'sale' ? amount : -amount
    const nextBalance = currentBalance + delta

    if (nextBalance < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const currentTins = (purchaseSale as any).currentTins ?? 0
    const tinsDelta = type === 'purchase' ? (tins ?? 0) : type === 'sale' ? -(tins ?? 0) : 0
    const nextTins = currentTins + tinsDelta

    if (nextTins < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient tins' },
        { status: 400 }
      )
    }

    const tx = await PurchaseSaleTransaction.create({
      purchaseSaleId: purchaseSale._id,
      type,
      date,
      amount,
      tins,
      category: type === 'expense' ? category : undefined,
      description,
    })

    await PurchaseSale.findByIdAndUpdate(
      purchaseSale._id,
      { currentBalance: nextBalance, currentTins: nextTins },
      { runValidators: true }
    )

    return NextResponse.json({ success: true, data: tx }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
