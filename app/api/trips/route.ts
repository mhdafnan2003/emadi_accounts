import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Trip from '@/models/Trip'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    
    let query = {}
    if (vehicleId) {
      query = { vehicleId }
    }
    
    const trips = await Trip.find(query).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: trips })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const trip = await Trip.create(body)
    return NextResponse.json({ success: true, data: trip }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create trip' },
      { status: 500 }
    )
  }
}