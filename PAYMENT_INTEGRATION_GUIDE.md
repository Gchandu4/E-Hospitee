# 💳 Payment Integration Guide - Razorpay

## 🎯 Overview

This guide explains how to integrate Razorpay payment gateway for appointment bookings with:
- Multiple payment methods (UPI, Cards, Wallets, Net Banking)
- Receipt generation
- WhatsApp notifications
- Email notifications
- SMS notifications

---

## 📋 Prerequisites

### 1. Razorpay Account Setup

1. **Sign up for Razorpay**:
   - Go to: https://dashboard.razorpay.com/signup
   - Complete KYC verification
   - Get your API keys

2. **Get API Keys**:
   - Go to: https://dashboard.razorpay.com/app/keys
   - Copy **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - Copy **Key Secret** (keep this secret!)

3. **Enable Payment Methods**:
   - Go to Settings → Payment Methods
   - Enable: UPI, Cards, Wallets, Net Banking
   - Enable: Paytm, PhonePe, Google Pay

### 2. Environment Variables

Add to your `.env` file (DO NOT commit this file):

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (for Email)
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_FROM_EMAIL=noreply@ehospitee.com

# WhatsApp Business API
WHATSAPP_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WHATSAPP_PHONE_NUMBER=917032527095
```

### 3. Add to Render Environment Variables

1. Go to: https://dashboard.render.com/
2. Select your service: `e-hospitee-1`
3. Go to "Environment" tab
4. Add all the above variables

---

## 🔧 Implementation Steps

### Step 1: Add Razorpay Script to HTML

Add this in the `<head>` section of `index.html`:

```html
<!-- Razorpay Checkout -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 2: Update Database Schema

Run this SQL in Supabase to add payment tracking:

```sql
-- Add payment columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee integer DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_date timestamptz;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS invoice_number text;

-- Create payments table for detailed tracking
CREATE TABLE IF NOT EXISTS payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  patient_id uuid references patients(id),
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  amount integer not null,
  currency text default 'INR',
  status text default 'pending',
  method text,
  email text,
  contact text,
  description text,
  receipt_url text,
  invoice_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);

-- Disable RLS
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON payments TO anon;
```

### Step 3: Create Server-Side Payment Handler

Create `server-payment.js` (this should run on your server):

```javascript
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(express.json());

// Initialize services
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency: currency || 'INR',
      receipt: receipt,
      notes: notes
    };
    
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointment_data
    } = req.body;
    
    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');
    
    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    // Fetch payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Generate invoice number
    const invoiceNumber = 'INV-' + Date.now();
    
    // Save to database
    const { data: appointmentData, error: apptError } = await supabase
      .from('appointments')
      .insert({
        ...appointment_data,
        payment_status: 'completed',
        payment_id: razorpay_payment_id,
        payment_method: payment.method,
        payment_date: new Date().toISOString(),
        invoice_number: invoiceNumber
      })
      .select()
      .single();
    
    if (apptError) throw apptError;
    
    // Save payment record
    await supabase.from('payments').insert({
      appointment_id: appointmentData.id,
      patient_id: appointment_data.patientId,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      razorpay_signature: razorpay_signature,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: 'completed',
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      invoice_number: invoiceNumber
    });
    
    // Send notifications
    await sendNotifications(appointmentData, payment, invoiceNumber);
    
    res.json({
      success: true,
      appointment: appointmentData,
      payment: payment,
      invoice_number: invoiceNumber
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send Notifications
async function sendNotifications(appointment, payment, invoiceNumber) {
  const receiptData = {
    invoiceNumber,
    patientName: appointment.patientName || 'Patient',
    doctor: appointment.doctor,
    specialty: appointment.specialty,
    hospital: appointment.hospital,
    date: appointment.date,
    time: appointment.time,
    amount: payment.amount / 100,
    paymentMethod: payment.method,
    paymentId: payment.id
  };
  
  // Send Email
  await sendEmail(payment.email, receiptData);
  
  // Send SMS
  await sendSMS(payment.contact, receiptData);
  
  // Send WhatsApp
  await sendWhatsApp(payment.contact, receiptData);
}

// Send Email
async function sendEmail(email, data) {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Appointment Confirmed - ${data.invoiceNumber}`,
    html: generateEmailHTML(data)
  };
  
  try {
    await sgMail.send(msg);
    console.log('Email sent to:', email);
  } catch (error) {
    console.error('Email error:', error);
  }
}

// Send SMS
async function sendSMS(phone, data) {
  const message = `E-Hospitee: Appointment confirmed with ${data.doctor} on ${data.date} at ${data.time}. Amount paid: ₹${data.amount}. Invoice: ${data.invoiceNumber}`;
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log('SMS sent to:', phone);
  } catch (error) {
    console.error('SMS error:', error);
  }
}

// Send WhatsApp
async function sendWhatsApp(phone, data) {
  const message = `🏥 *E-Hospitee - Appointment Confirmed*\n\n` +
    `📋 Invoice: ${data.invoiceNumber}\n` +
    `👨‍⚕️ Doctor: ${data.doctor}\n` +
    `🏥 Hospital: ${data.hospital}\n` +
    `📅 Date: ${data.date}\n` +
    `🕐 Time: ${data.time}\n` +
    `💰 Amount Paid: ₹${data.amount}\n` +
    `💳 Payment Method: ${data.paymentMethod}\n` +
    `✅ Payment ID: ${data.paymentId}\n\n` +
    `Thank you for choosing E-Hospitee!`;
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: 'whatsapp:' + process.env.TWILIO_PHONE_NUMBER,
      to: 'whatsapp:' + phone
    });
    console.log('WhatsApp sent to:', phone);
  } catch (error) {
    console.error('WhatsApp error:', error);
  }
}

// Generate Email HTML
function generateEmailHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0B7A75; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 1.2em; font-weight: bold; color: #0B7A75; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 E-Hospitee</h1>
          <p>Appointment Confirmation</p>
        </div>
        <div class="content">
          <h2>Dear ${data.patientName},</h2>
          <p>Your appointment has been successfully booked and payment confirmed!</p>
          
          <div class="invoice-box">
            <h3>Invoice #${data.invoiceNumber}</h3>
            <div class="row">
              <span>Doctor:</span>
              <span><strong>${data.doctor}</strong></span>
            </div>
            <div class="row">
              <span>Specialty:</span>
              <span>${data.specialty}</span>
            </div>
            <div class="row">
              <span>Hospital:</span>
              <span>${data.hospital}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${data.date}</span>
            </div>
            <div class="row">
              <span>Time:</span>
              <span>${data.time}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${data.paymentMethod}</span>
            </div>
            <div class="row total">
              <span>Amount Paid:</span>
              <span>₹${data.amount}</span>
            </div>
            <div class="row">
              <span>Payment ID:</span>
              <span style="font-size: 0.9em;">${data.paymentId}</span>
            </div>
          </div>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>You will receive a reminder 24 hours before your appointment</li>
            <li>Please arrive 15 minutes early</li>
            <li>Bring this invoice and a valid ID</li>
          </ul>
          
          <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing E-Hospitee!</p>
          <p>For support, contact: support@ehospitee.com | +91 7032527095</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
});
```

---

## 📱 Client-Side Implementation

### Update `index.html` - Add Payment Modal

Add this before the closing `</body>` tag:

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

### Update `bookAppointment` Function

Replace the existing function with this:

```javascript
// Store appointment data temporarily
let pendingAppointment = null;

async function bookAppointment(doctor, specialty, hospital, fee) {
  if (!currentUser) {
    showToast('Please sign in first');
    goPage('page-login');
    return;
  }
  
  // Store appointment data
  pendingAppointment = {
    doctor,
    specialty,
    hospital,
    fee,
    patientId: currentUser.id,
    patientName: currentUser.firstName + ' ' + (currentUser.lastName || ''),
    patientEmail: currentUser.email,
    patientMobile: currentUser.mobile,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:30 AM'
  };
  
  // Show payment modal
  showPaymentModal(pendingAppointment);
}

function showPaymentModal(appointment) {
  const modal = document.getElementById('payment-modal');
  const details = document.getElementById('payment-details');
  
  details.innerHTML = `
    <div style="background:var(--teal-pale);padding:16px;border-radius:12px;margin-bottom:20px">
      <div style="font-size:.85rem;color:var(--ink-light);margin-bottom:8px">Appointment Details</div>
      <div style="font-weight:600;font-size:1rem;color:var(--ink);margin-bottom:4px">${appointment.doctor}</div>
      <div style="font-size:.88rem;color:var(--ink-mid)">${appointment.specialty} • ${appointment.hospital}</div>
      <div style="font-size:.85rem;color:var(--ink-mid);margin-top:8px">📅 ${appointment.date} • 🕐 ${appointment.time}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--cream);border-radius:12px">
      <span style="font-weight:600;font-size:1rem">Consultation Fee:</span>
      <span style="font-weight:700;font-size:1.4rem;color:var(--teal)">₹${appointment.fee}</span>
    </div>
    <div style="margin-top:16px;padding:12px;background:#FEF3C7;border-radius:8px;font-size:.85rem;color:var(--ink-mid)">
      💳 Secure payment powered by Razorpay<br>
      ✅ Supports UPI, Cards, Wallets, Net Banking
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Setup payment button
  document.getElementById('pay-button').onclick = () => initiatePayment(appointment);
}

function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
  pendingAppointment = null;
}

async function initiatePayment(appointment) {
  try {
    // Create order on server
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: appointment.fee,
        currency: 'INR',
        receipt: 'APPT_' + Date.now(),
        notes: {
          doctor: appointment.doctor,
          hospital: appointment.hospital,
          patientId: appointment.patientId
        }
      })
    });
    
    const { success, order } = await response.json();
    if (!success) throw new Error('Failed to create order');
    
    // Initialize Razorpay
    const options = {
      key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your key
      amount: order.amount,
      currency: order.currency,
      name: 'E-Hospitee',
      description: `Appointment with ${appointment.doctor}`,
      image: 'https://your-logo-url.com/logo.png',
      order_id: order.id,
      prefill: {
        name: appointment.patientName,
        email: appointment.patientEmail,
        contact: appointment.patientMobile
      },
      theme: {
        color: '#0B7A75'
      },
      handler: function(response) {
        verifyPayment(response, appointment);
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled');
        }
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    showToast('❌ Payment failed: ' + error.message);
  }
}

async function verifyPayment(response, appointment) {
  try {
    showToast('Verifying payment...');
    
    const verifyResponse = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        appointment_data: appointment
      })
    });
    
    const result = await verifyResponse.json();
    
    if (result.success) {
      closePaymentModal();
      showToast('✅ Payment successful! Appointment booked.');
      showSuccessModal(result.appointment, result.invoice_number);
      
      // Refresh appointments
      const { data: appts } = await _sb.from('appointments').select('*').eq('patientId', currentUser.id);
      if (appts) renderAppointments(appts);
    } else {
      throw new Error(result.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    showToast('❌ Payment verification failed: ' + error.message);
  }
}

function showSuccessModal(appointment, invoiceNumber) {
  const modal = document.getElementById('payment-modal');
  const details = document.getElementById('payment-details');
  
  details.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:4rem;margin-bottom:16px">✅</div>
      <h2 style="color:var(--teal);margin-bottom:8px">Payment Successful!</h2>
      <p style="color:var(--ink-mid);margin-bottom:24px">Your appointment has been confirmed</p>
      
      <div style="background:var(--teal-pale);padding:20px;border-radius:12px;text-align:left;margin-bottom:20px">
        <div style="font-size:.85rem;color:var(--ink-light);margin-bottom:12px">Appointment Details</div>
        <div style="margin-bottom:8px"><strong>Doctor:</strong> ${appointment.doctor}</div>
        <div style="margin-bottom:8px"><strong>Hospital:</strong> ${appointment.hospital}</div>
        <div style="margin-bottom:8px"><strong>Date:</strong> ${appointment.date}</div>
        <div style="margin-bottom:8px"><strong>Time:</strong> ${appointment.time}</div>
        <div style="margin-bottom:8px"><strong>Invoice:</strong> ${invoiceNumber}</div>
        <div><strong>Amount Paid:</strong> ₹${appointment.fee}</div>
      </div>
      
      <div style="background:#DCFCE7;padding:12px;border-radius:8px;font-size:.85rem;color:var(--green);margin-bottom:20px">
        📧 Receipt sent to your email<br>
        📱 SMS confirmation sent<br>
        💬 WhatsApp notification sent
      </div>
      
      <button class="btn-primary" onclick="closePaymentModal();showPanel('p-appointments',null)" style="width:100%;padding:12px">
        View My Appointments
      </button>
    </div>
  `;
  
  modal.style.display = 'flex';
}
```

---

## 🧪 Testing

### Test Mode (Razorpay)

Use these test cards:

**Success**:
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure**:
- Card: 4000 0000 0000 0002

**UPI**:
- UPI ID: success@razorpay
- UPI ID: failure@razorpay

---

## 📊 Database Queries

### Check Payments
```sql
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
```

### Check Appointments with Payment
```sql
SELECT 
  a.*,
  p.razorpay_payment_id,
  p.method,
  p.status
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id
WHERE a.payment_status = 'completed'
ORDER BY a.created_at DESC;
```

---

## 🔒 Security Best Practices

1. **Never expose Key Secret** in client-side code
2. **Always verify signature** on server-side
3. **Use HTTPS** for all payment requests
4. **Store sensitive data** in environment variables
5. **Log all transactions** for audit trail
6. **Implement rate limiting** on payment endpoints
7. **Validate all inputs** before processing

---

## 📞 Support

### Razorpay Support
- Dashboard: https://dashboard.razorpay.com/
- Docs: https://razorpay.com/docs/
- Support: support@razorpay.com

### Integration Issues
- Check browser console for errors
- Verify API keys are correct
- Check server logs
- Test in Razorpay test mode first

---

**Status**: ⚠️ Implementation Required  
**Priority**: HIGH  
**Time**: 4-6 hours for complete setup  
**Testing**: Required in test mode before going live

🎉 **Complete payment integration with notifications!**
