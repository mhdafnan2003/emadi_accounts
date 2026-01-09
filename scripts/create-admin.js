// Script to create a default admin user via API
// Run with: node scripts/create-admin.js

async function createAdminUser() {
    try {
        console.log('Creating admin user...')

        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                name: 'Administrator',
                role: 'admin',
            }),
        })

        const data = await response.json()

        if (data.success) {
            console.log('✅ Admin user created successfully!')
            console.log('Username: admin')
            console.log('Password: admin123')
            console.log('\n⚠️  IMPORTANT: Change this password after first login!')
        } else {
            if (data.error && data.error.includes('already exists')) {
                console.log('ℹ️  Admin user already exists!')
                console.log('Username: admin')
                console.log('Password: admin123')
            } else {
                console.error('❌ Error creating admin user:', data.error)
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message)
        console.log('\n⚠️  Make sure the dev server is running (npm run dev)')
    }
}

createAdminUser()
