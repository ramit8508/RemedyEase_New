# Quick Fix - Force Render Deployment

## Steps to Force Deployment:

1. Go to https://dashboard.render.com
2. Sign in if needed
3. Click on your **Doctor Backend** service (the one running on port 5001)
4. Click the **"Manual Deploy"** button (top right area)
5. Select **"Deploy latest commit"**
6. Wait 2-3 minutes for deployment to complete
7. Status will change from "Building" → "Live"

## After Deployment:

1. Check **"Logs"** tab to verify no errors
2. Look for these startup messages:
   ```
   Server is running on port 5001
   MongoDB connected successfully
   ```

3. Test approval flow:
   - Go to admin panel
   - Click approve on a doctor
   - Check Render logs for email sending messages

## Environment Variables to Verify:

While in Render, click **"Environment"** tab and verify:

```
EMAIL_USER = ramitgoyal1987@gmail.com
EMAIL_PASSWORD = kdzr cnfb sbkx wwgh
FRONTEND_URL = https://remedy-ease-new.vercel.app
```

⚠️ **CRITICAL**: Make sure `FRONTEND_URL` is NOT `http://localhost:5173`

If `FRONTEND_URL` is wrong:
1. Click "Edit" on that variable
2. Change to: `https://remedy-ease-new.vercel.app`
3. Click "Save Changes"
4. Wait for automatic redeployment

## Expected Result:

After these steps, emails should work!
