// Test script to check users in database
async function checkUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/debug')
        const data = await response.json()
        console.log('Users in database:', JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

checkUsers()
