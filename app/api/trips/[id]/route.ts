import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Trip from '@/models/Trip'
import Purchase from '@/models/Purchase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    // Get all purchases for this trip
    const purchases = await Purchase.find({ tripId: params.id })
    
    // Calculate statistics
    const totalPurchases = purchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.price, 0)
    const totalSales = purchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.price, 0)
    const totalPurchaseLitres = purchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.litre, 0)
    const totalSalesLitres = purchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.litre, 0)
    const profitLoss = totalSales - totalPurchases
    const isProfitable = profitLoss >= 0
    const hasReachedBreakeven = totalSales >= totalPurchases
    
    // Update trip with calculated statistics
    const trip = await Trip.findByIdAndUpdate(
      params.id,
      {
        totalPurchases,
        totalSales,
        totalPurchaseLitres,
        totalSalesLitres,
        profitLoss,
        isProfitable,
        hasReachedBreakeven,
      },
      { new: true }
    )
    
    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: trip })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update trip statistics' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const trip = await Trip.findById(params.id)
    
    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: trip })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trip' },
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
    
    const trip = await Trip.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: trip })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update trip' },
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
    
    // First delete all purchases associated with this trip
    const Purchase = (await import('@/models/Purchase')).default
    await Purchase.deleteMany({ tripId: params.id })
    
    // Then delete the trip
    const trip = await Trip.findByIdAndDelete(params.id)
    
    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: trip })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete trip' },
      { status: 500 }
    )
  }
}