# How to View Demo Requests

## 🎯 Setup (One-time)

### Step 1: Create the Demo Requests Table

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

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

6. Click "Run"
7. You should see "Success. No rows returned"

## 📱 How Notifications Work

When someone requests a demo:

1. **Saved to Database**: Request is saved to Supabase `demo_requests` table
2. **WhatsApp Message**: A formatted message is prepared with hospital name and mobile
3. **Your Phone**: You'll receive the notification on WhatsApp at **7032527095**

### WhatsApp Message Format:
```
🏥 NEW DEMO REQUEST

Hospital: Apollo Hospitals
Mobile: 9876543210
Time: 08/04/2026, 5:30:00 PM

Please contact within 24 hours.
```

## 📊 View All Demo Requests

### Method 1: Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard
2. Click "Table Editor" in left sidebar
3. Select "demo_requests" table
4. You'll see all requests with:
   - Hospital name
   - Mobile number
   - Status (pending/contacted/completed)
   - Request time
   - Notes

### Method 2: SQL Query

Run this in Supabase SQL Editor:

```sql
-- View all demo requests (newest first)
SELECT 
  hospital_name,
  mobile,
  status,
  requested_at,
  contacted_at,
  notes
FROM demo_requests
ORDER BY requested_at DESC;
```

### Method 3: View Only Pending Requests

```sql
-- View only pending requests
SELECT 
  hospital_name,
  mobile,
  requested_at,
  EXTRACT(HOUR FROM (NOW() - requested_at)) as hours_ago
FROM demo_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;
```

## 📝 Update Request Status

After contacting a hospital, update the status:

```sql
-- Mark as contacted
UPDATE demo_requests
SET 
  status = 'contacted',
  contacted_at = NOW(),
  notes = 'Called and scheduled demo for tomorrow'
WHERE mobile = '9876543210';
```

```sql
-- Mark as completed
UPDATE demo_requests
SET 
  status = 'completed',
  notes = 'Demo completed, hospital signed up'
WHERE mobile = '9876543210';
```

## 📈 Analytics Queries

### Count requests by status:
```sql
SELECT status, COUNT(*) as count
FROM demo_requests
GROUP BY status;
```

### Requests in last 24 hours:
```sql
SELECT COUNT(*) as requests_today
FROM demo_requests
WHERE requested_at > NOW() - INTERVAL '24 hours';
```

### Average response time:
```sql
SELECT 
  AVG(EXTRACT(HOUR FROM (contacted_at - requested_at))) as avg_hours_to_contact
FROM demo_requests
WHERE contacted_at IS NOT NULL;
```

## 🔔 Set Up Email Notifications (Optional)

You can also set up email notifications using Supabase Database Webhooks:

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Configure:
   - **Table**: demo_requests
   - **Events**: INSERT
   - **Type**: HTTP Request
   - **URL**: Your webhook endpoint (e.g., Zapier, Make.com, or custom API)

This will send a POST request whenever a new demo is requested.

## 📱 WhatsApp Integration Details

The current setup:
- **Your WhatsApp**: 7032527095
- **Notification**: Automatic message prepared (you need to click to send)
- **Format**: Includes hospital name, mobile, and timestamp

### To Auto-Send WhatsApp (Advanced):

You would need to integrate with WhatsApp Business API:
1. Sign up for WhatsApp Business API
2. Get API credentials
3. Create a webhook endpoint
4. Use Supabase Edge Functions to send messages

For now, the system prepares the message and you can manually send it.

## 🎯 Quick Reference

### View new requests:
```sql
SELECT * FROM demo_requests WHERE status = 'pending' ORDER BY requested_at DESC;
```

### Mark as contacted:
```sql
UPDATE demo_requests SET status = 'contacted', contacted_at = NOW() WHERE id = 'uuid-here';
```

### Delete spam/test requests:
```sql
DELETE FROM demo_requests WHERE hospital_name = 'Test Hospital';
```

## 📞 Contact Flow

1. **Request comes in** → Saved to database
2. **You receive notification** → Check Supabase or WhatsApp
3. **Call the hospital** → Use mobile number from request
4. **Update status** → Mark as contacted in Supabase
5. **Schedule demo** → Add notes about demo date/time
6. **Complete demo** → Mark as completed

## 🔍 Troubleshooting

### Not receiving requests?
1. Check if table was created: `SELECT * FROM demo_requests;`
2. Check browser console for errors
3. Verify Supabase permissions are set

### Can't update status?
1. Make sure RLS is disabled
2. Check you're using the correct UUID
3. Verify anon role has permissions

## 📚 Additional Resources

- Supabase Table Editor: Dashboard → Table Editor
- SQL Editor: Dashboard → SQL Editor
- API Docs: Dashboard → API Docs → demo_requests
