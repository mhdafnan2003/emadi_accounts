import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        const { username, password, name, role } = body

        if (!username || !password || !name) {
            return NextResponse.json(
                { success: false, error: 'Username, password, and name are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: username.toLowerCase().trim() })
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            )
        }

        // Create new user (in production, hash the password with bcrypt)
        const user = await User.create({
            username: username.toLowerCase().trim(),
            password, // In production, hash this!
            name: name.trim(),
            role: role || 'user',
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Registration failed' },
            { status: 500 }
        )
    }
}
