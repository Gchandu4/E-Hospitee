# E-Hospitee Deployment Fix Guide

## Issue Identified
The error "index.html not found. Root: /opt/render/project/src" indicates that the server cannot find the index.html file on Render.

## Fixes Applied

### 1. Enhanced server.js
- Added detailed logging to show files in directory
- Added health check endpoint at `/health`
- Improved error messages with file listing
- Added proper static file serving with extensions

### 2. Deployment Steps for Render

#### A. Render Configuration
1. Go to your Render dashboard
2. Select your web service
3. Verify these settings:
   - **Build Command**: Leave empty (no build needed)
   - **Start Command**: `node server.js`
   - **Root Directory**: Leave empty (use repository root)

#### B. Environment Variables
No environment variables needed - Supabase credentials are in the code.

#### C. Deploy
1. Push changes to your Git repository
2. Render will auto-deploy
3. Check logs for:
   ```
   Serving files from: /opt/render/project/src
   Files in directory: [list of files]
   index.html exists: true
   ```

### 3. Supabase Setup Verification

Run this SQL in Supabase SQL Editor (if not already done):

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'hospitals', 'appointments', 'records', 'medications', 'vitals', 'emergencies', 'audit_logs');

-- If tables don't exist, run the supabase-setup.sql file
```

### 4. Testing Checklist

After deployment:

1. **Health Check**
   - Visit: `https://your-app.onrender.com/health`
   - Should return JSON with status and file info

2. **Homepage**
   - Visit: `https://your-app.onrender.com/`
   - Should load the landing page

3. **Registration**
   - Try registering a patient account
   - Check Supabase dashboard for new record

4. **Login**
   - Try logging in with created account
   - Should redirect to dashboard

### 5. Common Issues & Solutions

#### Issue: "index.html not found"
**Solution**: 
- Check Render logs for "Files in directory" output
- Verify files are being deployed to Render
- Check if .gitignore is excluding HTML files

#### Issue: Supabase errors
**Solution**:
- Verify tables exist in Supabase
- Check RLS is disabled (as per setup script)
- Verify anon role has permissions

#### Issue: 404 on all pages
**Solution**:
- Check server.js is using correct PORT
- Verify Render is using port from environment

### 6. Verification Commands

Run these locally to verify before deploying:

```bash
# Test server locally
node server.js

# Visit http://localhost:3000
# Should show the landing page

# Check health endpoint
# Visit http://localhost:3000/health
```

### 7. Git Deployment

```bash
# Add all changes
git add .

# Commit
git commit -m "Fix deployment: Enhanced server.js with better logging and error handling"

# Push to trigger Render deployment
git push origin main
```

## Expected Behavior After Fix

1. Server starts successfully on Render
2. Logs show all files in directory
3. index.html is found and served
4. All routes work correctly
5. Supabase integration works

## Support

If issues persist:
1. Check Render logs for detailed error messages
2. Visit `/health` endpoint to see server status
3. Verify Supabase connection in browser console
4. Check browser console for JavaScript errors
