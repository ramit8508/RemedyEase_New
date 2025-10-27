# 📧 Email Setup Instructions for Doctor Approval Notifications

## Quick Setup Steps

### 1. Enable 2-Factor Authentication in Gmail
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Under "Signing in to Google", click on **2-Step Verification**
4. Follow the steps to enable it (you'll need your phone)

### 2. Generate Gmail App Password
1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. In "Select app", choose **Mail**
4. In "Select device", choose **Other (Custom name)**
5. Type: **RemedyEase Backend**
6. Click **Generate**
7. You'll see a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password** (you won't see it again)

### 3. Update .env File
1. Open `d:\RemedyEase_New-main\RemedyEase_New-main\ALL_FILES\Bckend_for_Doctor\.env`
2. Find the line: `EMAIL_PASSWORD=your-gmail-app-password-here`
3. Replace `your-gmail-app-password-here` with the 16-character password
4. Example: `EMAIL_PASSWORD=abcd efgh ijkl mnop`

### 4. Verify EMAIL_USER
Make sure this line matches your Gmail:
```
EMAIL_USER=ramitgoyal1987@gmail.com
```

### 5. Restart the Backend
```bash
cd "d:\RemedyEase_New-main\RemedyEase_New-main\ALL_FILES\Bckend_for_Doctor"
npm start
```

## Testing

1. Go to Admin Panel → Pending Doctors
2. Click "Approve" on a pending doctor
3. Check the doctor's email inbox (might take 10-30 seconds)
4. Also check the **Spam folder** if you don't see it

## Troubleshooting

### "Invalid login" error
- You're using your regular Gmail password instead of the App Password
- Generate a new App Password and use that

### Email not received
- Check spam/junk folder
- Wait 30-60 seconds (email can be slow)
- Check backend console for email sending logs
- Verify EMAIL_USER and EMAIL_PASSWORD are correct

### Backend console shows error
- Make sure 2-Factor Authentication is enabled
- Generate a fresh App Password
- Remove any spaces from the app password in .env file

## Email Templates

### Approval Email
- Subject: 🎉 Your RemedyEase Account Has Been Approved!
- Contains: Login button, congratulations message
- Sent to: Doctor's registered email

### Rejection Email
- Subject: RemedyEase Account Application Update
- Contains: Rejection reason, contact support button
- Sent to: Doctor's registered email

## Security Notes

⚠️ **IMPORTANT:**
- Never share your app password with anyone
- Never commit the .env file to GitHub (it's in .gitignore)
- The app password only works for this app, not for logging into Gmail
- You can revoke the app password anytime from Google Account settings

## Current Configuration

Your current email setup in `.env`:
```
EMAIL_USER=ramitgoyal1987@gmail.com
EMAIL_PASSWORD=your-gmail-app-password-here  ← Replace this!
FRONTEND_URL=http://localhost:5173
```

## Production Deployment (Render)

When deploying to Render, add these environment variables:
1. Go to your Render dashboard
2. Select the Doctor Backend service
3. Go to Environment tab
4. Add:
   - `EMAIL_USER` = `ramitgoyal1987@gmail.com`
   - `EMAIL_PASSWORD` = `your-16-char-app-password`
   - `FRONTEND_URL` = `https://remedy-ease-new.vercel.app`
5. Save and redeploy

---

**Need Help?**
- Gmail App Password Guide: https://support.google.com/accounts/answer/185833
- Google Account Security: https://myaccount.google.com/security
