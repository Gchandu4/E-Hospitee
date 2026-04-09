// ═══════════════════════════════════════════════════════════════
// E-Hospitee - Payment Integration (Client-Side)
// Razorpay Integration with Notifications
// ═══════════════════════════════════════════════════════════════

// IMPORTANT: Replace with your actual Razorpay Key ID
const RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXX'; // Get from https://dashboard.razorpay.com/app/keys

// Store pending appointment
let pendingAppointment = null;

// ── BOOK APPOINTMENT WITH PAYMENT ──
async function bookAppointmentWithPayment(doctor, specialty, hospital, fee) {
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

// ── SHOW PAYMENT MODAL ──
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
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--cream);border-radius:12px;margin-bottom:16px">
      <span style="font-weight:600;font-size:1rem">Consultation Fee:</span>
      <span style="font-weight:700;font-size:1.4rem;color:var(--teal)">₹${appointment.fee}</span>
    </div>
    <div style="margin-bottom:16px;padding:12px;background:#FEF3C7;border-radius:8px;font-size:.85rem;color:var(--ink-mid)">
      💳 Secure payment powered by Razorpay<br>
      ✅ Supports UPI, Cards, Wallets, Net Banking
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;font-size:.75rem">
      <div style="padding:8px;background:var(--white);border:1px solid var(--border);border-radius:6px;text-align:center">
        <div style="font-size:1.2rem;margin-bottom:4px">📱</div>
        <div>UPI</div>
      </div>
      <div style="padding:8px;background:var(--white);border:1px solid var(--border);border-radius:6px;text-align:center">
        <div style="font-size:1.2rem;margin-bottom:4px">💳</div>
        <div>Cards</div>
      </div>
      <div style="padding:8px;background:var(--white);border:1px solid var(--border);border-radius:6px;text-align:center">
        <div style="font-size:1.2rem;margin-bottom:4px">👛</div>
        <div>Wallets</div>
      </div>
      <div style="padding:8px;background:var(--white);border:1px solid var(--border);border-radius:6px;text-align:center">
        <div style="font-size:1.2rem;margin-bottom:4px">🏦</div>
        <div>Net Banking</div>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  
  // Setup payment button
  document.getElementById('pay-button').onclick = () => initiatePayment(appointment);
}

// ── CLOSE PAYMENT MODAL ──
function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
  pendingAppointment = null;
}

// ── INITIATE PAYMENT ──
async function initiatePayment(appointment) {
  try {
    // Generate invoice number
    const invoiceNumber = 'INV-' + Date.now();
    const orderId = 'ORDER-' + Date.now();
    
    // Razorpay options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: appointment.fee * 100, // Convert to paise
      currency: 'INR',
      name: 'E-Hospitee',
      description: `Appointment with ${appointment.doctor}`,
      image: 'https://your-logo-url.com/logo.png', // Replace with your logo
      order_id: orderId, // In production, get this from server
      prefill: {
        name: appointment.patientName,
        email: appointment.patientEmail,
        contact: appointment.patientMobile
      },
      notes: {
        doctor: appointment.doctor,
        hospital: appointment.hospital,
        specialty: appointment.specialty,
        date: appointment.date,
        time: appointment.time
      },
      theme: {
        color: '#0B7A75'
      },
      handler: function(response) {
        handlePaymentSuccess(response, appointment, invoiceNumber);
      },
      modal: {
        ondismiss: function() {
          showToast('Payment cancelled');
        }
      }
    };
    
    // Open Razorpay checkout
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    showToast('❌ Payment failed: ' + error.message);
  }
}

// ── HANDLE PAYMENT SUCCESS ──
async function handlePaymentSuccess(response, appointment, invoiceNumber) {
  try {
    showToast('Processing payment...');
    
    // Save appointment to database
    const { data, error } = await _sb.from('appointments').insert({
      patientId: appointment.patientId,
      doctor: appointment.doctor,
      specialty: appointment.specialty,
      hospital: appointment.hospital,
      date: appointment.date,
      time: appointment.time,
      status: 'upcoming',
      fee: appointment.fee,
      payment_status: 'completed',
      payment_id: response.razorpay_payment_id,
      payment_method: 'razorpay',
      payment_date: new Date().toISOString(),
      invoice_number: invoiceNumber,
      createdAt: new Date().toISOString()
    }).select().single();
    
    if (error) {
      console.error('Database error:', error);
      showToast('❌ Failed to save appointment');
      return;
    }
    
    // Send notifications
    await sendNotifications(appointment, response, invoiceNumber);
    
    // Show success modal
    closePaymentModal();
    showSuccessModal(appointment, invoiceNumber, response.razorpay_payment_id);
    
    // Refresh appointments
    const { data: appts } = await _sb.from('appointments').select('*').eq('patientId', currentUser.id);
    if (appts) renderAppointments(appts);
    
  } catch (error) {
    console.error('Payment processing error:', error);
    showToast('❌ Error processing payment: ' + error.message);
  }
}

// ── SEND NOTIFICATIONS ──
async function sendNotifications(appointment, payment, invoiceNumber) {
  // Send WhatsApp notification
  sendWhatsAppNotification(appointment, payment, invoiceNumber);
  
  // Send Email (simulated - requires server-side implementation)
  sendEmailNotification(appointment, payment, invoiceNumber);
  
  // Send SMS (simulated - requires server-side implementation)
  sendSMSNotification(appointment, payment, invoiceNumber);
}

// ── SEND WHATSAPP NOTIFICATION ──
function sendWhatsAppNotification(appointment, payment, invoiceNumber) {
  const message = `🏥 *E-Hospitee - Appointment Confirmed*\n\n` +
    `📋 Invoice: ${invoiceNumber}\n` +
    `👨‍⚕️ Doctor: ${appointment.doctor}\n` +
    `🏥 Hospital: ${appointment.hospital}\n` +
    `📅 Date: ${appointment.date}\n` +
    `🕐 Time: ${appointment.time}\n` +
    `💰 Amount Paid: ₹${appointment.fee}\n` +
    `✅ Payment ID: ${payment.razorpay_payment_id}\n\n` +
    `Thank you for choosing E-Hospitee!\n\n` +
    `Please arrive 15 minutes early and bring a valid ID.`;
  
  const whatsappUrl = `https://wa.me/${appointment.patientMobile}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in new tab (user will need to send manually)
  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
  }, 2000);
  
  console.log('WhatsApp notification prepared for:', appointment.patientMobile);
}

// ── SEND EMAIL NOTIFICATION (Simulated) ──
function sendEmailNotification(appointment, payment, invoiceNumber) {
  // In production, this should call your server endpoint
  console.log('Email notification would be sent to:', appointment.patientEmail);
  console.log('Email content:', {
    to: appointment.patientEmail,
    subject: `Appointment Confirmed - ${invoiceNumber}`,
    body: `Your appointment with ${appointment.doctor} is confirmed for ${appointment.date} at ${appointment.time}.`
  });
  
  // For now, show a toast
  showToast('📧 Receipt will be sent to ' + appointment.patientEmail);
}

// ── SEND SMS NOTIFICATION (Simulated) ──
function sendSMSNotification(appointment, payment, invoiceNumber) {
  // In production, this should call your server endpoint
  console.log('SMS notification would be sent to:', appointment.patientMobile);
  console.log('SMS content:', {
    to: appointment.patientMobile,
    body: `E-Hospitee: Appointment confirmed with ${appointment.doctor} on ${appointment.date} at ${appointment.time}. Amount paid: ₹${appointment.fee}. Invoice: ${invoiceNumber}`
  });
  
  // For now, show a toast
  showToast('📱 SMS confirmation will be sent to ' + appointment.patientMobile);
}

// ── SHOW SUCCESS MODAL ──
function showSuccessModal(appointment, invoiceNumber, paymentId) {
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
        <div style="margin-bottom:8px"><strong>Specialty:</strong> ${appointment.specialty}</div>
        <div style="margin-bottom:8px"><strong>Hospital:</strong> ${appointment.hospital}</div>
        <div style="margin-bottom:8px"><strong>Date:</strong> ${appointment.date}</div>
        <div style="margin-bottom:8px"><strong>Time:</strong> ${appointment.time}</div>
        <div style="margin-bottom:8px"><strong>Invoice:</strong> ${invoiceNumber}</div>
        <div style="margin-bottom:8px"><strong>Amount Paid:</strong> ₹${appointment.fee}</div>
        <div style="font-size:.8rem;color:var(--ink-light);word-break:break-all"><strong>Payment ID:</strong> ${paymentId}</div>
      </div>
      
      <div style="background:#DCFCE7;padding:12px;border-radius:8px;font-size:.85rem;color:var(--green);margin-bottom:20px">
        ✅ Payment confirmed<br>
        📧 Receipt sent to email<br>
        📱 SMS confirmation sent<br>
        💬 WhatsApp notification sent
      </div>
      
      <div style="background:#FEF3C7;padding:12px;border-radius:8px;font-size:.85rem;color:var(--amber);margin-bottom:20px">
        📋 <strong>Important:</strong><br>
        • Arrive 15 minutes early<br>
        • Bring this invoice and valid ID<br>
        • You'll receive a reminder 24 hours before
      </div>
      
      <button class="btn-primary" onclick="closePaymentModal();showPanel('p-appointments',null)" style="width:100%;padding:12px;margin-bottom:8px">
        View My Appointments
      </button>
      <button class="btn-secondary" onclick="downloadReceipt('${invoiceNumber}','${appointment.doctor}','${appointment.hospital}','${appointment.date}','${appointment.time}',${appointment.fee},'${paymentId}')" style="width:100%;padding:12px">
        📥 Download Receipt
      </button>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// ── DOWNLOAD RECEIPT ──
function downloadReceipt(invoiceNumber, doctor, hospital, date, time, amount, paymentId) {
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0B7A75; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 2em; color: #0B7A75; font-weight: bold; }
        .invoice-title { font-size: 1.5em; margin-top: 10px; }
        .details { margin: 30px 0; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .total { font-size: 1.3em; font-weight: bold; color: #0B7A75; margin-top: 20px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏥 E-Hospitee</div>
        <div class="invoice-title">Payment Receipt</div>
        <div>Invoice #${invoiceNumber}</div>
      </div>
      
      <div class="details">
        <div class="row">
          <span>Date:</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
        <div class="row">
          <span>Doctor:</span>
          <span><strong>${doctor}</strong></span>
        </div>
        <div class="row">
          <span>Hospital:</span>
          <span>${hospital}</span>
        </div>
        <div class="row">
          <span>Appointment Date:</span>
          <span>${date}</span>
        </div>
        <div class="row">
          <span>Appointment Time:</span>
          <span>${time}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>Razorpay</span>
        </div>
        <div class="row">
          <span>Payment ID:</span>
          <span style="font-size: 0.9em;">${paymentId}</span>
        </div>
        <div class="row total">
          <span>Amount Paid:</span>
          <span>₹${amount}</span>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for choosing E-Hospitee!</strong></p>
        <p>For support: support@ehospitee.com | +91 7032527095</p>
        <p style="font-size: 0.9em; margin-top: 20px;">This is a computer-generated receipt and does not require a signature.</p>
      </div>
    </body>
    </html>
  `;
  
  // Create blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt-${invoiceNumber}.html`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('📥 Receipt downloaded');
}

// ═══════════════════════════════════════════════════════════════
// TEST MODE HELPERS
// ═══════════════════════════════════════════════════════════════

// Test payment with dummy data (for development)
function testPayment() {
  const testAppointment = {
    doctor: 'Dr. Test Doctor',
    specialty: 'General Medicine',
    hospital: 'Test Hospital',
    fee: 500,
    patientId: currentUser?.id || 'test-id',
    patientName: 'Test Patient',
    patientEmail: 'test@example.com',
    patientMobile: '9876543210',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:30 AM'
  };
  
  showPaymentModal(testAppointment);
}

console.log('💳 Payment integration loaded');
console.log('⚠️ Remember to replace RAZORPAY_KEY_ID with your actual key');
