// Test script to register admin user via API
async function registerAdmin() {
    try {
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
        console.log('Response:', JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

registerAdmin()
