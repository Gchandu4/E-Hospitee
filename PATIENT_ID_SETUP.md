# Patient ID System - Setup Guide

## ✅ What Was Added

A patient ID system that automatically generates unique IDs for each new patient registration.

### Patient ID Format
- **Pattern**: `26XXX`
- **Examples**: 
  - First patient: `26001`
  - Second patient: `26002`
  - Third patient: `26003`
  - ...and so on

### Features
- ✅ Auto-generated on registration
- ✅ Sequential numbering
- ✅ Unique constraint (no duplicates)
- ✅ Displayed in dashboard sidebar
- ✅ Shown in success message after registration
- ✅ Indexed for fast lookups

## 🚀 Setup Required (One-Time)

### Step 1: Add patientId Column to Database

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/ajscgpuozcyqsteseppp/sql/new)

2. Copy and paste this SQL:

```sql
-- Add patientId column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS "patientId" text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients("patientId");
```

3. Click **"Run"**

4. You should see: **"Success. No rows returned"**

### Step 2: Verify Column Was Added

Run this to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'patientId';
```

You should see `patientId` with type `text`.

## 📊 How It Works

### Registration Flow

1. **User fills registration form**
2. **System counts existing patients** in database
3. **Generates next ID**: `26` + (count + 1) padded to 3 digits
4. **Saves patient** with generated ID
5. **Shows success message**: "Account created! Your Patient ID: 26001"
6. **Displays ID** in dashboard sidebar

### ID Generation Logic

```javascript
// Get count of existing patients
const count = await getPatientCount(); // e.g., 5

// Generate next ID
const nextNumber = count + 1; // 6
const patientId = '26' + String(nextNumber).padStart(3, '0'); // "26006"
```

### Examples

| Patient # | Count | Generated ID |
|-----------|-------|--------------|
| 1st       | 0     | 26001        |
| 2nd       | 1     | 26002        |
| 10th      | 9     | 26010        |
| 100th     | 99    | 26100        |
| 1000th    | 999   | 261000       |

## 📱 Where Patient ID Appears

### 1. Registration Success Message
```
Account created! Your Patient ID: 26001
```

### 2. Dashboard Sidebar
```
👤 John Doe
   26001
```

### 3. Database
- Stored in `patients` table
- Column: `patientId`
- Type: text
- Unique: yes

## 🔍 View Patient IDs

### In Supabase Dashboard

1. Go to Table Editor
2. Select `patients` table
3. You'll see the `patientId` column

### SQL Query

```sql
SELECT "patientId", "firstName", "lastName", email, "createdAt"
FROM patients
ORDER BY "createdAt" DESC;
```

## 🛠️ Update Existing Patients (Optional)

If you have existing patients without IDs, run this:

```sql
-- This will assign IDs to existing patients
DO $$
DECLARE
  patient_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR patient_record IN 
    SELECT id FROM patients WHERE "patientId" IS NULL ORDER BY "createdAt"
  LOOP
    UPDATE patients 
    SET "patientId" = '26' || LPAD(counter::text, 3, '0')
    WHERE id = patient_record.id;
    counter := counter + 1;
  END LOOP;
END $$;
```

## 📈 Statistics Queries

### Count patients with IDs:
```sql
SELECT COUNT(*) as patients_with_ids
FROM patients
WHERE "patientId" IS NOT NULL;
```

### Latest patient IDs:
```sql
SELECT "patientId", "firstName", "lastName", "createdAt"
FROM patients
WHERE "patientId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Find patient by ID:
```sql
SELECT * FROM patients WHERE "patientId" = '26001';
```

## 🎯 Testing

### Test Registration

1. Go to your website
2. Click "Get Started" or "Register"
3. Select "Patient" role
4. Fill in the form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: Test1234
5. Click "Create Account"
6. You should see: "Account created! Your Patient ID: 26XXX"
7. Check dashboard sidebar - ID should be displayed

### Verify in Database

```sql
SELECT "patientId", "firstName", email 
FROM patients 
WHERE email = 'test@example.com';
```

## 🔧 Troubleshooting

### Issue: Patient ID not showing in dashboard

**Solution**: 
- Refresh the page
- Check if `patientId` column exists in database
- Verify user has a patient ID assigned

### Issue: Duplicate patient IDs

**Solution**: 
- The system has a unique constraint
- If duplicate occurs, registration will fail
- Check database for existing IDs

### Issue: Patient ID is null

**Solution**:
- Make sure you ran the SQL to add the column
- Check if registration function is updated
- Verify deployment completed

## 📝 Files Modified

1. **index.html**
   - Added `generatePatientId()` function
   - Updated registration to include patient ID
   - Patient ID displayed in dashboard

2. **supabase-setup.sql**
   - Added `patientId` column to schema

3. **add_patient_id_column.sql** (NEW)
   - Migration SQL to add column to existing database

## 🎉 Success Checklist

- [ ] SQL executed in Supabase
- [ ] `patientId` column exists
- [ ] Changes deployed to production
- [ ] Test registration works
- [ ] Patient ID shows in success message
- [ ] Patient ID displays in dashboard
- [ ] Patient ID saved in database

---

**Status**: ✅ Complete and deployed
**Commit**: f05f82e
**Next**: Run the SQL in Supabase to add the column
