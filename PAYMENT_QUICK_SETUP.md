# 💳 Payment Integration - Quick Setup Guide

## 🚀 Quick Start (30 Minutes)

### Step 1: Run SQL in Supabase (2 minutes)

1. Open: https://supabase.com/dashboard/project/ajscgpuozcyqsteseppp/sql/new
2. Copy all SQL from: `add_payment_columns.sql`
3. Paste and click "RUN"
4. Wait for success messages

### Step 2: Get Razorpay Account (10 minutes)

1. **Sign up**: https://dashboard.razorpay.com/signup
2. **Complete KYC**: Upload documents (for live mode)
3. **Get Test Keys**: https://dashboard.razorpay.com/app/keys
   - Copy **Key ID**: `rzp_test_XXXXXXXXXXXX`
   - Copy **Key Secret**: Keep this secret!

### Step 3: Add to index.html (5 minutes)

#### 3.1 Add Razorpay Script in `<head>`:

```html
<!-- Add this before closing </head> tag -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

#### 3.2 Add Payment Modal before closing `</body>`:

```html
<!-- Payment Modal -->
<div id="payment-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:20px">
  <div style="background:var(--white);border-radius:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3)">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)">
      <div style="font-weight:700;font-size:1.1rem;color:var(--ink)">💳 Payment</div>
      <button onclick="closePaymentModal()" style="background:none;border:none;font-size:1.6rem;cursor:pointer;color:var(--ink-light);line-height:1">×</button>
    </div>
    <div style="padding:24px">
      <div id="payment-details"></div>
      <button id="pay-button" class="btn-primary" style="width:100%;padding:14px;margin-top:20px;font-size:1rem">
        Proceed to Pay
      </button>
    </div>
  </div>
</div>
```

#### 3.3 Include Payment Script before closing `</body>`:

```html
<!-- Payment Integration -->
<script src="payment-integration.js"></script>
```

### Step 4: Update Razorpay Key (2 minutes)

Open `payment-integration.js` and replace:

```javascript
// Line 8: Replace with your actual key
const RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXX'; // Your key here
```

### Step 5: Update Book Appointment Buttons (5 minutes)

In `index.html`, find all `bookAppointment` calls and replace with `bookAppointmentWithPayment`:

**Before**:
```html
<button onclick="bookAppointment('Dr. S. Rao','Cardiology','Apollo Hospitals',600)">Book Now</button>
```

**After**:
```html
<button onclick="bookAppointmentWithPayment('Dr. S. Rao','Cardiology','Apollo Hospitals',600)">Book Now</button>
```

### Step 6: Test (5 minutes)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add payment integration with Razorpay"
git push origin main
```

2. **Wait for deployment** (2-3 minutes)

3. **Test on website**:
   - Go to: https://e-hospitee-1.onrender.com/
   - Login as patient
   - Go to "Book Appointment"
   - Click "Book Now" on any doctor
   - Payment modal should open
   - Click "Proceed to Pay"
   - Razorpay checkout should open

4. **Test Payment** (use test cards):
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name

---

## 🧪 Test Cards

### Success Cards:
- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **Rupay**: 6073 8499 9999 9999

### Failure Card:
- **Decline**: 4000 0000 0000 0002

### UPI:
- **Success**: success@razorpay
- **Failure**: failure@razorpay

### CVV & Expiry:
- **CVV**: Any 3 digits (e.g., 123)
- **Expiry**: Any future date (e.g., 12/25)

---

## 📱 Payment Methods Supported

### UPI Apps:
- ✅ Google Pay
- ✅ PhonePe
- ✅ Paytm
- ✅ BHIM
- ✅ Amazon Pay

### Cards:
- ✅ Credit Cards (Visa, Mastercard, Rupay, Amex)
- ✅ Debit Cards (All banks)

### Wallets:
- ✅ Paytm Wallet
- ✅ PhonePe Wallet
- ✅ Mobikwik
- ✅ Freecharge
- ✅ Airtel Money

### Net Banking:
- ✅ All major banks
- ✅ HDFC, ICICI, SBI, Axis, etc.

---

## 📧 Notifications

### What Gets Sent:

1. **WhatsApp** (Opens automatically):
   - Appointment details
   - Invoice number
   - Payment confirmation
   - Doctor & hospital info

2. **Email** (Requires server setup):
   - Professional receipt
   - Appointment details
   - Payment information
   - Invoice PDF

3. **SMS** (Requires server setup):
   - Quick confirmation
   - Appointment date & time
   - Invoice number

### Current Implementation:

- ✅ WhatsApp: Opens automatically (user sends manually)
- ⚠️ Email: Simulated (shows toast message)
- ⚠️ SMS: Simulated (shows toast message)

### For Full Implementation:

See `PAYMENT_INTEGRATION_GUIDE.md` for server-side setup with:
- Twilio (SMS)
- SendGrid (Email)
- WhatsApp Business API

---

## 🔒 Security

### What's Secure:
- ✅ Payment processed by Razorpay (PCI DSS compliant)
- ✅ No card details stored on your server
- ✅ Encrypted payment gateway
- ✅ Signature verification

### What to Keep Secret:
- 🔐 Razorpay Key Secret (NEVER expose in client code)
- 🔐 API keys for SMS/Email services
- 🔐 Database credentials

### Best Practices:
1. Use test mode for development
2. Switch to live mode only after KYC
3. Never commit API keys to Git
4. Use environment variables for secrets
5. Implement server-side verification

---

## 📊 Database Structure

### Appointments Table (Updated):
```
- fee (integer)
- payment_status (text: 'pending', 'completed', 'failed')
- payment_id (text: Razorpay payment ID)
- payment_method (text: 'upi', 'card', 'wallet', etc.)
- payment_date (timestamptz)
- invoice_number (text: 'INV-1234567890')
```

### Payments Table (New):
```
- id (uuid)
- appointment_id (uuid)
- patient_id (uuid)
- razorpay_payment_id (text)
- razorpay_order_id (text)
- amount (integer)
- status (text)
- method (text)
- created_at (timestamptz)
```

---

## 🐛 Troubleshooting

### Issue: "Razorpay is not defined"
**Solution**: Make sure Razorpay script is loaded before payment-integration.js

### Issue: Payment modal doesn't open
**Solution**: 
1. Check browser console for errors
2. Verify modal HTML is added
3. Check if `showPaymentModal` function exists

### Issue: Payment succeeds but appointment not saved
**Solution**:
1. Check Supabase connection
2. Verify SQL was run (payment columns exist)
3. Check browser console for errors

### Issue: Notifications not sent
**Solution**:
- WhatsApp: Opens automatically, user needs to send manually
- Email/SMS: Requires server-side setup (see full guide)

---

## 💰 Pricing

### Razorpay Fees:
- **Domestic Cards**: 2% + GST
- **International Cards**: 3% + GST
- **UPI**: 0% (free for first ₹1 crore/month)
- **Wallets**: 2% + GST
- **Net Banking**: 2% + GST

### No Setup Fees:
- ✅ Free account creation
- ✅ Free test mode
- ✅ No monthly fees
- ✅ Pay only for successful transactions

---

## 📞 Support

### Razorpay Support:
- Dashboard: https://dashboard.razorpay.com/
- Docs: https://razorpay.com/docs/
- Support: support@razorpay.com
- Phone: 1800-120-020-020

### Test Mode:
- Use test keys for development
- No real money charged
- All features available
- Switch to live mode when ready

---

## ✅ Checklist

Before going live:

- [ ] SQL run in Supabase
- [ ] Razorpay account created
- [ ] KYC completed (for live mode)
- [ ] Test keys working
- [ ] Payment modal added
- [ ] Script included
- [ ] Buttons updated
- [ ] Tested with test cards
- [ ] Tested all payment methods
- [ ] Notifications working
- [ ] Receipt download working
- [ ] Database saving correctly
- [ ] Error handling tested
- [ ] Ready to switch to live keys

---

## 🎉 You're Ready!

Your payment integration is now set up! Patients can:

1. ✅ Browse doctors
2. ✅ Click "Book Now"
3. ✅ See payment modal
4. ✅ Choose payment method (UPI/Card/Wallet)
5. ✅ Complete payment
6. ✅ Get confirmation
7. ✅ Receive notifications
8. ✅ Download receipt
9. ✅ View in appointments

**Time to setup**: 30 minutes  
**Difficulty**: Easy  
**Cost**: Pay per transaction (2% + GST)

🚀 **Start accepting payments now!**
