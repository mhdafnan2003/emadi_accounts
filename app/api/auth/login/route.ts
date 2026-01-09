import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        const { username, password } = body

        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            )
        }

        // Find user
        const user = await User.findOne({ username: username.toLowerCase().trim() })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            )
        }

        // Simple password comparison (in production, use bcrypt)
        if (user.password !== password) {
            return NextResponse.json(
                { success: false, error: 'Invalid username or password' },
                { status: 401 }
            )
        }

        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64')

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Login failed' },
            { status: 500 }
        )
    }
}
