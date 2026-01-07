import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Branch from '@/models/Branch'

function sanitizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/[\s\-()]/g, '')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    const body = await request.json()

    if (body.branchName != null) {
      if (typeof body.branchName !== 'string' || !body.branchName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Branch name is required' },
          { status: 400 }
        )
      }
    }

    if (body.phoneNumber != null) {
      body.phoneNumber = sanitizePhone(body.phoneNumber)
    }

    const branch = await Branch.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: branch })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update branch' },
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

    const branch = await Branch.findByIdAndDelete(params.id)

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
