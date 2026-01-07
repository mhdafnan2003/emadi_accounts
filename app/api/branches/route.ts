import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Branch from '@/models/Branch'

function sanitizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/[\s\-()]/g, '')
}

export async function GET() {
  try {
    await dbConnect()
    const branches = await Branch.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: branches })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    if (typeof body.branchName !== 'string' || !body.branchName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Branch name is required' },
        { status: 400 }
      )
    }

    if (body.phoneNumber != null) {
      body.phoneNumber = sanitizePhone(body.phoneNumber)
    }

    const branch = await Branch.create(body)
    return NextResponse.json({ success: true, data: branch }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create branch' },
      { status: 500 }
    )
  }
}
