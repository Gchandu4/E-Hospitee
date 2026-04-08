# Demo Requests Setup - Complete Guide

## ✅ Changes Made

### 1. WhatsApp Number Updated
- **Old**: 919876543210
- **New**: 917032527095 (Your number)
- **Location**: index.html line ~2134

### 2. Demo Request Functionality Added
- Form on landing page now saves to database
- Automatic WhatsApp notification prepared
- Mobile number validation (10 digits)
- Success/error handling

### 3. Database Table Created
- New table: `demo_requests`
- Stores: hospital name, mobile, status, timestamp, notes
- Indexed for fast queries

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Database Table

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard)
2. Copy and paste this SQL:

```sql
create table if not exists demo_requests (
  id             uuid primary key default gen_random_uuid(),
  hospital_name  text not null,
  mobile         text not null,
  status         text default 'pending',
  requested_at   timestamptz default now(),
  contacted_at   timestamptz,
  notes          text,
  source         text default 'website'
);

alter table demo_requests disable row level security;
grant all privileges on table demo_requests to anon;
```

3. Click "Run"

### Step 2: Deploy Changes

```bash
git add .
git commit -m "Add demo requests with WhatsApp notifications"
git push origin main
```

### Step 3: Access Admin Dashboard

Open `admin_demo_requests.html` in your browser to view all demo requests.

Or upload it to your server and access at:
`https://your-domain.com/admin_demo_requests.html`

## 📱 How It Works

### When Someone Requests a Demo:

1. **User fills form** on landing page:
   - Hospital name
   - Mobile number

2. **System validates**:
   - Both fields required
   - Mobile must be 10 digits

3. **Saves to database**:
   - Stored in `demo_requests` table
   - Status: "pending"
   - Timestamp recorded

4. **WhatsApp notification**:
   - Message prepared with details
   - Format:
     ```
     🏥 NEW DEMO REQUEST
     
     Hospital: Apollo Hospitals
     Mobile: 9876543210
     Time: 08/04/2026, 5:30:00 PM
     
     Please contact within 24 hours.
     ```

5. **User sees confirmation**:
   - "Demo request sent! We'll call you within 24 hours."
   - Form clears

## 📊 View Demo Requests

### Option 1: Admin Dashboard (Recommended)

Open `admin_demo_requests.html` in browser:

**Features**:
- ✅ View all requests in table
- ✅ Filter by status (pending/contacted/completed)
- ✅ Statistics dashboard
- ✅ One-click call/WhatsApp
- ✅ Update status with notes
- ✅ Export to CSV
- ✅ Auto-refresh every 30 seconds

### Option 2: Supabase Dashboard

1. Go to Supabase → Table Editor
2. Select `demo_requests` table
3. View/edit directly

### Option 3: SQL Query

```sql
SELECT * FROM demo_requests 
WHERE status = 'pending' 
ORDER BY requested_at DESC;
```

## 🔔 Notification Methods

### Current Setup (Manual)
- Request saved to database
- WhatsApp message prepared
- You check admin dashboard or Supabase

### Future Enhancement (Automatic)
To get instant notifications, you can:

1. **Email Notifications**:
   - Use Supabase Database Webhooks
   - Send to your email when new request

2. **WhatsApp Business API**:
   - Auto-send WhatsApp messages
   - Requires WhatsApp Business API account

3. **SMS Notifications**:
   - Use Twilio or similar service
   - Get SMS when new request

4. **Telegram Bot**:
   - Create Telegram bot
   - Get instant notifications

## 📝 Update Request Status

### In Admin Dashboard:
1. Click "Update" button
2. Status cycles: pending → contacted → completed
3. Add notes (optional)

### In Supabase:
```sql
UPDATE demo_requests
SET 
  status = 'contacted',
  contacted_at = NOW(),
  notes = 'Scheduled demo for tomorrow 3 PM'
WHERE id = 'uuid-here';
```

## 📈 Analytics Queries

### Today's requests:
```sql
SELECT COUNT(*) FROM demo_requests
WHERE requested_at > CURRENT_DATE;
```

### Pending requests older than 24 hours:
```sql
SELECT hospital_name, mobile, requested_at
FROM demo_requests
WHERE status = 'pending'
AND requested_at < NOW() - INTERVAL '24 hours'
ORDER BY requested_at;
```

### Conversion rate:
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM demo_requests
GROUP BY status;
```

## 🔧 Files Created/Modified

### Modified:
1. **index.html**
   - Updated WhatsApp number to 7032527095
   - Enhanced handleCTA() function
   - Added demo request validation
   - Added Supabase integration

2. **supabase-setup.sql**
   - Added demo_requests table
   - Added RLS disable for demo_requests

### Created:
1. **add_demo_requests_table.sql**
   - Standalone SQL to add table
   - Run this in Supabase

2. **admin_demo_requests.html**
   - Admin dashboard to view requests
   - Filter, update, export features

3. **VIEW_DEMO_REQUESTS.md**
   - Complete guide for viewing requests
   - SQL queries and examples

4. **DEMO_REQUESTS_SETUP.md**
   - This file

## 🎯 Testing

### Test the Form:
1. Go to your website landing page
2. Scroll to "Ready to transform..." section
3. Fill in:
   - Hospital name: "Test Hospital"
   - Mobile: "9876543210"
4. Click "Request Demo"
5. Should see success message

### Verify in Database:
```sql
SELECT * FROM demo_requests ORDER BY requested_at DESC LIMIT 1;
```

### Check Admin Dashboard:
1. Open `admin_demo_requests.html`
2. Should see the test request
3. Try updating status
4. Try calling/WhatsApp buttons

## 🚨 Troubleshooting

### Form not submitting?
- Check browser console for errors
- Verify Supabase table exists
- Check RLS is disabled

### Not seeing requests in dashboard?
- Verify table name is correct
- Check Supabase credentials
- Look for JavaScript errors

### WhatsApp not opening?
- Check number format (917032527095)
- Verify WhatsApp is installed
- Try on mobile device

## 📞 Contact Flow

1. **Request received** → Check admin dashboard
2. **Call hospital** → Click "Call" button
3. **Send WhatsApp** → Click "WhatsApp" button
4. **Update status** → Click "Update" button
5. **Add notes** → Enter demo details
6. **Mark completed** → Update status again

## 🎉 Success Checklist

- [ ] Database table created
- [ ] Changes pushed to GitHub
- [ ] Website deployed
- [ ] Test form submission works
- [ ] Request appears in database
- [ ] Admin dashboard accessible
- [ ] Can update request status
- [ ] WhatsApp number correct (7032527095)

## 📚 Next Steps

1. **Deploy changes** to production
2. **Test the form** with real data
3. **Bookmark admin dashboard** for easy access
4. **Set up email notifications** (optional)
5. **Train team** on using admin dashboard

---

**Your WhatsApp**: 7032527095
**Admin Dashboard**: admin_demo_requests.html
**Database Table**: demo_requests
