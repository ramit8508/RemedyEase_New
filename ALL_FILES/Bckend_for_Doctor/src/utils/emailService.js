import pkg from 'nodemailer';
const { createTransport } = pkg;

// Create email transporter
const createTransporter = () => {
  // Using Gmail as an example. You'll need to configure this with your email service
  return createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send approval email
export const sendApprovalEmail = async (doctorEmail, doctorName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@remedyease.com',
      to: doctorEmail,
      subject: '🎉 Your RemedyEase Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #388e3c; margin: 0;">RemedyEase</h1>
            </div>
            
            <h2 style="color: #388e3c;">Congratulations, Dr. ${doctorName}!</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We're excited to inform you that your account has been <strong>approved</strong> by our admin team!
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              You can now log in to your RemedyEase account and start connecting with patients.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://remedy-ease-new.vercel.app'}/doctor/login" 
                 style="background-color: #388e3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from RemedyEase. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending approval email:', error);
    return false;
  }
};

// Send rejection email
export const sendRejectionEmail = async (doctorEmail, doctorName, reason) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@remedyease.com',
      to: doctorEmail,
      subject: 'RemedyEase Account Application Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #388e3c; margin: 0;">RemedyEase</h1>
            </div>
            
            <h2 style="color: #d32f2f;">Account Application Update</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Dear Dr. ${doctorName},
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for your interest in joining RemedyEase. After careful review, we regret to inform you that we are unable to approve your account at this time.
            </p>
            
            ${reason ? `
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>Reason:</strong> ${reason}</p>
              </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              If you believe this decision was made in error or you have additional information to provide, please contact our support team.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://remedy-ease-new.vercel.app'}/contact" 
                 style="background-color: #388e3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Contact Support
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message from RemedyEase. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent to ${doctorEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};
