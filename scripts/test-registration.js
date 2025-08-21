// Test the registration API
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// Generate a random email to avoid conflicts
const randomSuffix = Math.floor(Math.random() * 10000);
const testUser = {
  name: 'Test User',
  email: `test.user.${randomSuffix}@example.com`,
  password: 'testpassword123',
  department: 'Test Department',
  role: 'faculty'
};

console.log(`Testing registration API at ${BASE_URL}`);
console.log(`Test user email: ${testUser.email}`);

// Test the registration API
async function testRegistration() {
  try {
    console.log('Attempting to register a new user...');
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Registration successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('Registration failed with status:', response.status);
      console.error('Error details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error during registration test:', error);
  }
}

testRegistration(); 