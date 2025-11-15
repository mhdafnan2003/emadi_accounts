import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Purchase from '@/models/Purchase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const purchase = await Purchase.findByIdAndDelete(params.id)
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Update trip statistics after deleting purchase
    if (purchase.tripId) {
      try {
        const Trip = (await import('@/models/Trip')).default
        const Purchase = (await import('@/models/Purchase')).default
        
        // Get all remaining purchases for this trip
        const purchases = await Purchase.find({ tripId: purchase.tripId })
        
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
          purchase.tripId,
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
    
    return NextResponse.json({ success: true, data: purchase })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete purchase' },
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
    
    const purchase = await Purchase.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Update trip statistics after updating purchase
    if (purchase.tripId) {
      try {
        const Trip = (await import('@/models/Trip')).default
        const Purchase = (await import('@/models/Purchase')).default
        
        // Get all purchases for this trip
        const purchases = await Purchase.find({ tripId: purchase.tripId })
        
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
          purchase.tripId,
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
    
    return NextResponse.json({ success: true, data: purchase })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update purchase' },
      { status: 500 }
    )
  }
}