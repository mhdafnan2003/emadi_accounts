import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Vehicle from '@/models/Vehicle'

export async function GET() {
  try {
    await dbConnect()
    const vehicles = await Vehicle.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: vehicles })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    
    const vehicle = await Vehicle.create(body)
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 })
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Vehicle number already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}