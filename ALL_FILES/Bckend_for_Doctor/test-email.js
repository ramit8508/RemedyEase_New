import pkg from 'nodemailer';
const { createTransport } = pkg;
import 'dotenv/config';

console.log('=== Email Configuration Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ ERROR: EMAIL_USER or EMAIL_PASSWORD not set in .env file');
  process.exit(1);
}

// Create transporter
console.log('Creating email transporter...');
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Enable debug output
  logger: true // Log information
});

// Verify transporter configuration
console.log('Verifying transporter configuration...');
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Transporter verification failed:', error);
    console.error('\nPossible issues:');
    console.error('1. Gmail App Password is incorrect');
    console.error('2. Gmail 2FA is not enabled');
    console.error('3. Internet connection issues');
    console.error('4. Gmail is blocking the connection');
  } else {
    console.log('✓ Transporter verified successfully!');
    console.log('Server is ready to send emails\n');
    
    // Send test email
    sendTestEmail();
  }
});

async function sendTestEmail() {
  try {
    console.log('Sending test email...');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 RemedyEase Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #388e3c; margin: 0;">RemedyEase</h1>
            </div>
            
            <h2 style="color: #388e3c;">Email Test Successful! ✓</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              This is a test email from your RemedyEase application.
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              If you're receiving this email, your email configuration is working correctly!
            </p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #388e3c; margin: 20px 0;">
              <p style="margin: 0; color: #1b5e20;"><strong>Configuration Details:</strong></p>
              <p style="margin: 5px 0 0 0; color: #2e7d32;">
                Email User: ${process.env.EMAIL_USER}<br>
                Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://remedy-ease-new.vercel.app'}/doctor/login" 
                 style="background-color: #388e3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Test Button Link
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is a test email from RemedyEase
            </p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('\n✓ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n📧 Check your inbox at:', process.env.EMAIL_USER);
    console.log('   (Also check spam folder if you don\'t see it)\n');
  } catch (error) {
    console.error('\n❌ Error sending test email:', error);
    console.error('\nError details:');
    console.error('Message:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.command) console.error('Command:', error.command);
  }
}
