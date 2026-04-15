# 🔧 FIX REGISTRATION ERROR

## ❌ Error Message
```
Registration failed: Could not find the 'city' column of 'hospitals' in the schema cache
```

## 🎯 Problem
The `hospitals` table in your Supabase database is missing required columns that the registration form is trying to use.

---

## ✅ SOLUTION (2 Minutes)

### Step 1: Open Supabase SQL Editor
```
https://supabase.com/dashboard/project/ajscgpuozcyqsteseppp/sql/new
```

### Step 2: Run the Fix Script
1. Open the file: `fix_hospitals_schema.sql`
2. Copy ALL the content
3. Paste into Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Success
You should see output like:
```
✅ Hospitals table schema fixed successfully!
✓ All required columns added
✓ Indexes created
✓ RLS disabled
✓ Permissions granted
🎉 Hospital registration should now work!
```

### Step 4: Test Registration
1. Hard refresh your browser: `Ctrl + Shift + R`
2. Go to hospital registration page
3. Fill in the form
4. Click "Create Account"
5. Registration should now succeed! ✅

---

## 📋 What the Script Does

### Adds Required Columns:
- ✅ `name` - Hospital name
- ✅ `regNo` - Registration number
- ✅ `city` - City name (the missing column!)
- ✅ `pincode` - Postal code
- ✅ `contactPerson` - Contact person name
- ✅ `email` - Email address (unique)
- ✅ `phone` - Phone number
- ✅ `password` - Hashed password
- ✅ `createdAt` - Creation timestamp

### Adds Bonus Columns:
- ✅ `address` - Full address
- ✅ `specialties` - Array of specialties
- ✅ `beds_total` - Total beds
- ✅ `beds_available` - Available beds
- ✅ `emergency_services` - Has emergency services
- ✅ `active` - Account active status

### Performance & Security:
- ✅ Creates indexes for faster queries
- ✅ Disables RLS for easier access
- ✅ Grants permissions to anon role

---

## 🧪 Test Registration

### Test Data:
```
Hospital Name: Apollo Hospitals
Registration No: REG123456
City: Hyderabad
Pincode: 500001
Contact Person: Dr. Kumar
Email: test@apollo.com
Phone: 9876543210
Password: Test@1234
```

---

## 🐛 If Still Not Working

### Check 1: Verify Columns Exist
Run this in Supabase SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'hospitals';
```

You should see all the columns listed above.

### Check 2: Check Browser Console
1. Open browser console (F12)
2. Go to "Console" tab
3. Try registration again
4. Look for error messages
5. Share the error if you see one

### Check 3: Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for recent errors
4. Check what went wrong

---

## 📞 Common Issues

### Issue: "Column already exists"
**Solution**: This is fine! The script uses `IF NOT EXISTS` so it won't break if columns already exist.

### Issue: "Permission denied"
**Solution**: Make sure you're logged into Supabase with the correct account.

### Issue: "Table 'hospitals' does not exist"
**Solution**: You need to create the hospitals table first. Run `complete_database_setup.sql` first.

### Issue: Still getting city column error
**Solution**: 
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Try registration again

---

## ✅ Success Checklist

- [ ] SQL script run in Supabase
- [ ] Success message appeared
- [ ] Browser hard refreshed
- [ ] Registration form filled
- [ ] Registration succeeded
- [ ] Hospital dashboard loads
- [ ] No errors in console

---

## 🎉 After Fix

Once the fix is applied:
1. ✅ Hospital registration will work
2. ✅ All form fields will save correctly
3. ✅ Hospital can login
4. ✅ Hospital dashboard will load
5. ✅ All features will work

---

**Status**: 🔧 Fix Ready  
**Time**: 2 minutes  
**Difficulty**: Easy  
**Files**: `fix_hospitals_schema.sql`

🚀 **Run the SQL script and you're good to go!**
