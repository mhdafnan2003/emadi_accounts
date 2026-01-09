// Test script to login
async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
            }),
        })

        const data = await response.json()
        console.log('Login response:', JSON.stringify(data, null, 2))
        console.log('Status:', response.status)
    } catch (error) {
        console.error('Error:', error)
    }
}

testLogin()
