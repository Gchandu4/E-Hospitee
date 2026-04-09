# 💳 Payment Setup Instructions

## ✅ Code Already Added!

All payment integration code has been added to `index.html`. You just need to:

### 1. Run SQL in Supabase (2 minutes)

1. Open: https://supabase.com/dashboard/project/ajscgpuozcyqsteseppp/sql/new
2. Copy ALL SQL from: `add_payment_columns.sql`
3. Paste and click **"RUN"**
4. Wait for success messages

### 2. Get Razorpay Keys (10 minutes)

1. **Sign up**: https://dashboard.razorpay.com/signup
2. **Get Test Keys**: https://dashboard.razorpay.com/app/keys
3. Copy your **Key ID** (looks like: `rzp_test_XXXXXXXXXXXX`)

### 3. Add Your Razorpay Key (1 minute)

Open `index.html` and find this line (around line 2600):

```javascript
const RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXX'; // ← ADD YOUR KEY HERE
```

Replace `rzp_test_XXXXXXXXXXXX` with your actual Razorpay Key ID.

### 4. Push to GitHub (1 minute)

```bash
git add index.html add_payment_columns.sql
git commit -m "Add payment integration with Razorpay"
git push origin main
```

### 5. Test (5 minutes)

1. Wait 2-3 minutes for Render deployment
2. Go to: https://e-hospitee-1.onrender.com/
3. Login as patient
4. Go to "Book Appointment"
5. Click "Book Now" on any doctor
6. Payment modal should open
7. Click "Proceed to Pay"
8. Razorpay checkout opens

**Test Card**:
- Card Number: 4111 1111 1111 1111
- CVV: 123
- Expiry: 12/25
- Name: Test User

---

## 🎉 What's Included

### Payment Features:
- ✅ Razorpay integration
- ✅ Multiple payment methods (UPI, Cards, Wallets, Net Banking)
- ✅ Payment modal with appointment details
- ✅ Success confirmation
- ✅ Invoice generation
- ✅ Receipt download (HTML format)

### Notifications:
- ✅ WhatsApp (opens automatically with pre-filled message)
- ✅ Email (simulated - shows toast)
- ✅ SMS (simulated - shows toast)

### Database:
- ✅ Payment tracking
- ✅ Invoice numbers
- ✅ Payment status
- ✅ Payment method
- ✅ Payment date

---

## 📱 Payment Methods Supported

### UPI:
- Google Pay
- PhonePe
- Paytm
- BHIM
- Amazon Pay

### Cards:
- Credit Cards (Visa, Mastercard, Rupay, Amex)
- Debit Cards (All banks)

### Wallets:
- Paytm Wallet
- PhonePe Wallet
- Mobikwik
- Freecharge
- Airtel Money

### Net Banking:
- All major banks

---

## 🧪 Test Mode

### Test Cards:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002

### Test UPI:
- **Success**: success@razorpay
- **Failure**: failure@razorpay

### CVV & Expiry:
- **CVV**: Any 3 digits
- **Expiry**: Any future date

---

## 💰 Pricing

### Razorpay Fees:
- Domestic Cards: 2% + GST
- UPI: FREE (first ₹1 crore/month)
- Wallets: 2% + GST
- Net Banking: 2% + GST

### No Setup Fees:
- ✅ Free account
- ✅ Free test mode
- ✅ No monthly fees
- ✅ Pay only for successful transactions

---

## 🔒 Security

### What's Secure:
- ✅ PCI DSS compliant payment gateway
- ✅ No card details stored on your server
- ✅ Encrypted transactions
- ✅ Signature verification

### What to Keep Secret:
- 🔐 Razorpay Key Secret (NEVER expose in client code)
- 🔐 Database credentials
- 🔐 API keys

---

## 📊 User Flow

1. Patient clicks "Book Now" on doctor
2. Payment modal opens with appointment details
3. Shows consultation fee
4. Patient clicks "Proceed to Pay"
5. Razorpay checkout opens
6. Patient selects payment method
7. Completes payment
8. Success modal shows with invoice
9. Notifications sent (WhatsApp/Email/SMS)
10. Appointment saved to database
11. Receipt available for download

---

## 🐛 Troubleshooting

### Issue: "Razorpay is not defined"
**Solution**: Make sure you added the Razorpay script in the `<head>` section

### Issue: Payment modal doesn't open
**Solution**: 
1. Check browser console for errors (F12)
2. Verify you're logged in as patient
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Payment succeeds but appointment not saved
**Solution**:
1. Check if SQL was run in Supabase
2. Verify payment columns exist in appointments table
3. Check browser console for errors

### Issue: "Invalid Key ID"
**Solution**: 
1. Verify you copied the correct Key ID from Razorpay dashboard
2. Make sure it starts with `rzp_test_` or `rzp_live_`
3. No extra spaces or quotes

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

- [ ] SQL run in Supabase
- [ ] Razorpay account created
- [ ] Test keys obtained
- [ ] Key ID added to index.html
- [ ] Code pushed to GitHub
- [ ] Deployment completed
- [ ] Tested with test card
- [ ] Payment modal opens
- [ ] Payment succeeds
- [ ] Appointment saved
- [ ] Notifications sent
- [ ] Receipt downloads

---

## 🎉 You're Done!

Your payment integration is complete! Patients can now:

1. ✅ Browse doctors
2. ✅ Click "Book Now"
3. ✅ See payment modal
4. ✅ Pay with UPI/Card/Wallet
5. ✅ Get confirmation
6. ✅ Receive notifications
7. ✅ Download receipt
8. ✅ View in appointments

**Total Setup Time**: 15 minutes  
**Difficulty**: Easy  
**Cost**: 2% + GST per transaction

🚀 **Start accepting payments now!**
