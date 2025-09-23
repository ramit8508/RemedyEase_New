// Test script to verify signup endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const testSignup = async () => {
  try {
    console.log('🧪 Testing signup endpoint...');
    
    const formData = new FormData();
    formData.append('fullname', 'Test User');
    formData.append('email', 'test@example.com');
    formData.append('password', 'test123');
    formData.append('confirmPassword', 'test123');
    
    // Create a dummy image file for testing
    const buffer = Buffer.from('test image data');
    formData.append('avatar', buffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });

    const response = await fetch('http://localhost:8000/api/v1/users/register', {
      method: 'POST',
      body: formData
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response Body:', text);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testSignup();