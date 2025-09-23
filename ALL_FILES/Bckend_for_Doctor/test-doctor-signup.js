// Test script for doctor signup
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testDoctorSignup() {
    try {
        console.log('🧪 Testing Doctor Signup API...');

        // Create a test form data
        const formData = new FormData();
        
        // Add required fields
        formData.append('fullname', 'Dr. Test Doctor');
        formData.append('email', 'test.doctor@example.com');
        formData.append('registrationNumber', 'REG123456');
        formData.append('password', 'testpassword123');
        formData.append('confirmPassword', 'testpassword123');
        formData.append('degree', 'MBBS');
        formData.append('specialization', 'General Medicine');
        formData.append('bio', 'Test doctor for signup testing');
        formData.append('experience', '5 years');

        // Note: For a real test, you'd need to add an actual image file
        // formData.append('avatar', fs.createReadStream('path/to/test/image.jpg'));

        const response = await fetch('http://localhost:5001/api/v1/doctors/register', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.text();
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response:', result);

        if (!response.ok) {
            console.error('❌ Signup failed');
        } else {
            console.log('✅ Signup successful');
        }

    } catch (error) {
        console.error('💥 Test error:', error.message);
    }
}

// Run the test
testDoctorSignup();