import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Trip from '@/models/Trip'

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