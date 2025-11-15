import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Purchase from '@/models/Purchase'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const tripId = searchParams.get('tripId')
    
    let query = {}
    if (vehicleId) {
      query = { vehicleId }
    }
    if (tripId) {
      query = { ...query, tripId }
    }
    
    const purchases = await Purchase.find(query).sort({ date: -1 })
    return NextResponse.json({ success: true, data: purchases })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const purchase = await Purchase.create(body)
    
    // Update trip statistics after adding purchase
    if (body.tripId) {
      try {
        // Import and call the trip update function directly
        const Trip = (await import('@/models/Trip')).default
        const Purchase = (await import('@/models/Purchase')).default
        
        // Get all purchases for this trip
        const purchases = await Purchase.find({ tripId: body.tripId })
        
        // Calculate statistics
        const totalPurchases = purchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.price, 0)
        const totalSales = purchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.price, 0)
        const totalPurchaseLitres = purchases.filter(p => p.type === 'Purchase').reduce((sum, p) => sum + p.litre, 0)
        const totalSalesLitres = purchases.filter(p => p.type === 'Sales').reduce((sum, p) => sum + p.litre, 0)
        const profitLoss = totalSales - totalPurchases
        const isProfitable = profitLoss >= 0
        const hasReachedBreakeven = totalSales >= totalPurchases
        
        // Update trip with calculated statistics
        await Trip.findByIdAndUpdate(
          body.tripId,
          {
            totalPurchases,
            totalSales,
            totalPurchaseLitres,
            totalSalesLitres,
            profitLoss,
            isProfitable,
            hasReachedBreakeven,
          }
        )
      } catch (error) {
        console.error('Failed to update trip statistics:', error)
      }
    }
    
    return NextResponse.json({ success: true, data: purchase }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase' },
      { status: 500 }
    )
  }
}