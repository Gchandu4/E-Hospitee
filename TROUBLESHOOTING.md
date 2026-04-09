# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Could not find the 'patientId' column"

**Symptoms**:
- Registration fails with column error
- Error message mentions "patientId"

**Cause**: The `patientId` column doesn't exist in your Supabase database

**Solution**:
1. Run `complete_database_setup.sql` in Supabase SQL Editor
2. Hard refresh browser (Ctrl+Shift+R)
3. Try registration again

**Verification**:
- Run `verify_setup.sql` in Supabase to check if column exists
- Should see "✅ PASS - patientId column exists"

---

### Issue 2: "Could not find the 'fileData' column"

**Symptoms**:
- File upload fails
- Error message mentions "fileData"

**Cause**: The `fileData` column doesn't exist in your Supabase database

**Solution**:
1. Run `complete_database_setup.sql` in Supabase SQL Editor
2. Hard refresh browser (Ctrl+Shift+R)
3. Try file upload again

**Verification**:
- Run `verify_setup.sql` in Supabase to check if column exists
- Should see "✅ PASS - fileData column exists"

---

### Issue 3: "Could not find the table 'demo_requests'"

**Symptoms**:
- Demo request form fails
- Error message mentions "demo_requests"

**Cause**: The `demo_requests` table doesn't exist in your Supabase database

**Solution**:
1. Run `complete_database_setup.sql` in Supabase SQL Editor
2. Hard refresh browser (Ctrl+Shift+R)
3. Try demo request again

**Verification**:
- Run `verify_setup.sql` in Supabase to check if table exists
- Should see "✅ PASS - demo_requests table exists"

---

### Issue 4: Registration Works But No Patient ID

**Symptoms**:
- Registration succeeds
- No patient ID shown
- Dashboard doesn't show patient ID

**Cause**: The `patientId` column doesn't exist, but registration works because it's optional

**Solution**:
1. Run `complete_database_setup.sql` in Supabase SQL Editor
2. Hard refresh browser (Ctrl+Shift+R)
3. Register a new account
4. Patient ID should now show (26001, 26002, etc.)

**Note**: Existing accounts won't have patient IDs. Only new registrations after running the SQL will get patient IDs.

---

### Issue 5: Browser Shows Old Code

**Symptoms**:
- Changes not visible
- Old errors still appearing
- Features not working

**Cause**: Browser cache is showing old code

**Solution**:

**Windows/Linux**:
1. Press `Ctrl + Shift + R` (hard refresh)
2. OR Press `Ctrl + F5`
3. OR Press `Ctrl + Shift + Delete` → Clear cache → Clear data

**Mac**:
1. Press `Cmd + Shift + R`
2. OR Press `Cmd + Option + R`

**Chrome**:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Verification**:
- Check browser console (F12) for errors
- Should see no errors related to missing columns

---

### Issue 6: Deployment Not Working

**Symptoms**:
- Code pushed to GitHub
- Website not updated
- Old version still showing

**Cause**: Render deployment may be slow or failed

**Solution**:
1. Go to Render Dashboard: https://dashboard.render.com/
2. Find your "e-hospitee-1" service
3. Check deployment status
4. If failed, click "Manual Deploy" → "Deploy latest commit"
5. Wait 2-3 minutes for deployment

**Verification**:
- Deployment status should show "Live"
- Check deployment logs for errors

---

### Issue 7: SQL Script Fails to Run

**Symptoms**:
- Error when running SQL
- "Syntax error" message
- Script doesn't complete

**Cause**: SQL syntax error or permission issue

**Solution**:
1. Make sure you copied the ENTIRE `complete_database_setup.sql` file
2. Don't modify the SQL
3. Run it in Supabase SQL Editor (not in Table Editor)
4. Check for error messages in the output

**Common SQL Errors**:
- "permission denied" → You need admin access to Supabase project
- "syntax error" → Make sure you copied the entire file
- "already exists" → This is OK! It means the column/table already exists

**Verification**:
- Run `verify_setup.sql` to check what's missing
- Should see all "✅ PASS" messages

---

### Issue 8: Console Errors in Browser

**Symptoms**:
- Red errors in browser console (F12)
- Features not working
- JavaScript errors

**Common Errors and Solutions**:

**Error**: "Supabase client not initialized"
- **Cause**: Supabase URL or key is wrong
- **Solution**: Check `index.html` for correct Supabase URL and anon key

**Error**: "Network error"
- **Cause**: Internet connection or Supabase is down
- **Solution**: Check internet connection, verify Supabase is accessible

**Error**: "Column not found"
- **Cause**: Database schema is incomplete
- **Solution**: Run `complete_database_setup.sql`

**Error**: "Permission denied"
- **Cause**: RLS is enabled or permissions not granted
- **Solution**: Run `complete_database_setup.sql` (it disables RLS)

---

### Issue 9: Patient ID Not Sequential

**Symptoms**:
- Patient IDs are random (26847, 26123, etc.)
- Not sequential (26001, 26002, etc.)

**Cause**: Error in patient ID generation, using fallback timestamp-based ID

**Solution**:
1. Check Supabase logs for errors
2. Verify `patientId` column exists
3. Run `verify_setup.sql` to check setup
4. If column exists, check browser console for errors

**Note**: This is a fallback behavior. If patient ID generation fails, it uses timestamp to ensure registration still works.

---

### Issue 10: WhatsApp Link Not Working

**Symptoms**:
- WhatsApp link doesn't open
- Wrong number showing

**Cause**: WhatsApp number format or link format issue

**Solution**:
1. Check `index.html` for WhatsApp number
2. Should be: `917032527095` (country code + number, no spaces)
3. Link format: `https://wa.me/917032527095?text=...`

**Verification**:
- Click WhatsApp icon on landing page
- Should open WhatsApp with number 7032527095

---

## Quick Diagnostic Checklist

Run through this checklist to diagnose issues:

### Database Setup
- [ ] Run `complete_database_setup.sql` in Supabase
- [ ] Run `verify_setup.sql` to check setup
- [ ] All checks show "✅ PASS"

### Browser
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear cache
- [ ] No console errors (F12)

### Deployment
- [ ] Code pushed to GitHub
- [ ] Render shows "Live" status
- [ ] Wait 2-3 minutes after push

### Testing
- [ ] Registration works
- [ ] Patient ID shows (26XXX)
- [ ] Login works
- [ ] Dashboard loads
- [ ] File upload works
- [ ] Demo request works

---

## How to Get Help

### 1. Check Browser Console
1. Press F12 to open DevTools
2. Go to "Console" tab
3. Look for red error messages
4. Copy the error message

### 2. Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for errors
4. Copy the error message

### 3. Check Render Logs
1. Go to Render Dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for errors
5. Copy the error message

### 4. Run Verification Script
1. Run `verify_setup.sql` in Supabase
2. Check which checks fail
3. Note which columns/tables are missing

### 5. Provide Information
When asking for help, provide:
- Error message from browser console
- Error message from Supabase logs
- Results from `verify_setup.sql`
- What you were trying to do
- What happened instead

---

## Prevention Tips

### Always Do This After Changes:
1. ✅ Push to GitHub
2. ✅ Wait for deployment (2-3 minutes)
3. ✅ Hard refresh browser (Ctrl+Shift+R)
4. ✅ Test the feature

### Before Making Database Changes:
1. ✅ Backup your data (export from Supabase)
2. ✅ Test SQL in a separate project first
3. ✅ Run verification script after changes

### Regular Maintenance:
1. ✅ Check Supabase logs weekly
2. ✅ Monitor Render deployment status
3. ✅ Test critical features regularly
4. ✅ Keep browser cache clear

---

## Emergency Recovery

### If Everything Breaks:

1. **Restore Database**:
   - Run `complete_database_setup.sql` again
   - It's safe to run multiple times

2. **Redeploy**:
   - Go to Render Dashboard
   - Click "Manual Deploy"
   - Wait for deployment

3. **Clear Everything**:
   - Clear browser cache completely
   - Close and reopen browser
   - Try in incognito mode

4. **Verify Setup**:
   - Run `verify_setup.sql`
   - Check all systems
   - Test registration

---

## Contact Information

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

### Render Support
- Dashboard: https://dashboard.render.com/
- Docs: https://render.com/docs

### Project Links
- Website: https://e-hospitee-1.onrender.com/
- GitHub: (your repository)
- Supabase: https://supabase.com/dashboard/project/ajscgpuozcyqsteseppp

---

**Last Updated**: Based on latest fixes  
**Version**: 1.0  
**Status**: All known issues documented
