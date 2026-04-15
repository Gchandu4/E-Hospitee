// E-HOSPITEE - app.js (shared across all pages)

// HTTPS ENFORCEMENT
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https:' + location.href.substring(location.protocol.length));
}

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ajscgpuozcyqsteseppp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc2NncHVvemN5cXN0ZXNlcHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTk2NDIsImV4cCI6MjA5MDQzNTY0Mn0.NAZG-ZdcwJGHN-SLscKb2MeUIJ52GBOiNmxlBPqGeHg';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SECURE LOGGER
const SecureLogger = {
  _isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
  _queue: [], _flushing: false,
  _sanitize(data) { const { password, token, key, secret, ...safe } = data || {}; return safe; },
  async _flush() {
    if (this._flushing || this._queue.length === 0) return;
    this._flushing = true;
    const batch = this._queue.splice(0, 10);
    try { await _sb.from('audit_logs').insert(batch); } catch {}
    this._flushing = false;
    if (this._queue.length > 0) this._flush();
  },
  _log(level, event, data) {
    const entry = { level, event, data: JSON.stringify(this._sanitize(data)),
      user_id: (typeof currentUser !== 'undefined' && currentUser?.id) || null,
      user_role: (typeof currentUser !== 'undefined' && currentUser?.role) || null,
      url: location.pathname, timestamp: new Date().toISOString() };
    if (this._isDev) console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${level.toUpperCase()}] ${event}`, data);
    this._queue.push(entry); this._flush();
  },
  info(event, data = {})  { this._log('info',  event, data); },
  warn(event, data = {})  { this._log('warn',  event, data); },
  error(event, data = {}) { this._log('error', event, data); },
  anomaly(event, data = {}) { this._log('warn', `ANOMALY:${event}`, data); }
};

// SANITIZE & VALIDATE
const Sanitize = {
  html(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;');
  },
  text(str) { if (str == null) return ''; return String(str).replace(/<[^>]*>/g,'').trim().slice(0,500); },
  filename(str) { if (str == null) return 'upload'; return String(str).replace(/[^a-zA-Z0-9._\-]/g,'_').slice(0,100); }
};

const Validate = {
  name(val, label='Name') {
    if (!val||val.trim().length<1) return `${label} is required`;
    if (val.trim().length>100) return `${label} must be under 100 characters`;
    return null;
  },
  email(val) {
    if (!val||!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Invalid email format';
    return null;
  },
  mobile(val) {
    if (!val||!val.trim()) return null;
    const digits = val.replace(/[\s\-\+\(\)]/g,'');
    if (!/^\d{7,15}$/.test(digits)) return 'Invalid mobile number';
    return null;
  },
  text(val, label='Field', maxLen=500) {
    if (!val||!val.trim()) return null;
    if (val.length>maxLen) return `${label} must be under ${maxLen} characters`;
    return null;
  },
  vitals: {
    heartRate: v => !v||/^\d{1,3}\s*(bpm)?$/i.test(v.trim()) ? null : 'Invalid heart rate (e.g. 72 bpm)',
    bp:        v => !v||/^\d{2,3}\/\d{2,3}$/.test(v.trim()) ? null : 'Invalid BP (e.g. 120/80)',
    temp:      v => !v||/^\d{2,3}(\.\d)?\s*[CF]?$/i.test(v.trim()) ? null : 'Invalid temperature',
    sugar:     v => !v||/^\d{2,3}\s*(mg\/dL)?$/i.test(v.trim()) ? null : 'Invalid blood sugar',
    weight:    v => !v||/^\d{2,3}(\.\d)?\s*(kg|lbs)?$/i.test(v.trim()) ? null : 'Invalid weight',
    spo2:      v => !v||/^\d{2,3}\s*%?$/.test(v.trim()) ? null : 'Invalid SpO2',
  },
  file(file) {
    const ALLOWED = ['application/pdf','image/jpeg','image/png','image/jpg'];
    if (!file) return 'No file selected';
    if (!ALLOWED.includes(file.type)) return 'Only PDF, JPG, and PNG files are allowed';
    if (file.size > 5*1024*1024) return 'File must be under 5MB';
    return null;
  },
  chatMessage(val) {
    if (!val||!val.trim()) return 'Message cannot be empty';
    if (val.length>500) return 'Message too long (max 500 characters)';
    return null;
  }
};

// RATE LIMITING
const RateLimit = {
  _key: 'ehospitee_login_attempts', _max: 5, _windowMs: 15 * 60 * 1000,
  _getState() { const raw = localStorage.getItem(this._key); return raw ? JSON.parse(raw) : { count: 0, firstAttempt: Date.now() }; },
  check() {
    const state = this._getState(), now = Date.now();
    if (now - state.firstAttempt > this._windowMs) { localStorage.removeItem(this._key); return { allowed: true }; }
    if (state.count >= this._max) { const remaining = Math.ceil((this._windowMs-(now-state.firstAttempt))/60000); return { allowed: false, remaining }; }
    return { allowed: true };
  },
  record() {
    const state = this._getState(), now = Date.now();
    if (now - state.firstAttempt > this._windowMs) { localStorage.setItem(this._key, JSON.stringify({ count:1, firstAttempt:now })); }
    else { localStorage.setItem(this._key, JSON.stringify({ count:state.count+1, firstAttempt:state.firstAttempt })); }
  },
  reset() { localStorage.removeItem(this._key); }
};

const ActionLimit = {
  _limits: {},
  check(key, max, windowMs) {
    const now = Date.now(), state = this._limits[key] || { count:0, firstAt:now };
    if (now - state.firstAt > windowMs) { this._limits[key] = { count:1, firstAt:now }; return { allowed:true }; }
    if (state.count >= max) { const remaining = Math.ceil((windowMs-(now-state.firstAt))/1000); return { allowed:false, remaining }; }
    this._limits[key] = { count:state.count+1, firstAt:state.firstAt };
    return { allowed:true };
  }
};

// PASSWORD HASHING
const Auth = {
  async hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
    const data = new TextEncoder().encode(saltHex + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    return `${saltHex}:${hashHex}`;
  },
  async verifyPassword(password, stored) {
    if (!stored) return false;
    if (!stored.includes(':')) return stored === password; // legacy plaintext
    const [saltHex, storedHash] = stored.split(':');
    if (!saltHex || !storedHash) return false;
    const data = new TextEncoder().encode(saltHex + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    return hashHex === storedHash;
  },
  isLegacyPassword(stored) { return stored && !stored.includes(':'); },
  validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return null;
  }
};

// DATABASE (Supabase)
const DB = {
  _prefix: 'ehospitee_',
  _sessionTTL: 8 * 60 * 60 * 1000,
  _patientTables: new Set(['appointments','records','medications','vitals','emergencies']),

  async init() { await this._loadSession(); },

  async _loadSession() {
    const raw = localStorage.getItem(this._prefix + 'session');
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) { this.clearSession(); return; }
      currentUser = session.user;
    } catch { this.clearSession(); }
  },

  async add(table, data) {
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      if (data.patientId !== currentUser.id) throw new Error('Access denied');
    }
    const { data: row, error } = await _sb.from(table).insert(data).select().single();
    if (error) throw error;
    return row;
  },
  async get(table, id) {
    const { data, error } = await _sb.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async getAll(table) {
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      const { data, error } = await _sb.from(table).select('*').eq('patientId', currentUser.id);
      if (error) throw error;
      return data || [];
    }
    const { data, error } = await _sb.from(table).select('*');
    if (error) throw error;
    return data || [];
  },
  async put(table, data) {
    let query = _sb.from(table).update(data).eq('id', data.id);
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      query = query.eq('patientId', currentUser.id);
    }
    const { data: row, error } = await query.select().single();
    if (error) throw error;
    return row;
  },
  async delete(table, id) {
    let query = _sb.from(table).delete().eq('id', id);
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      query = query.eq('patientId', currentUser.id);
    }
    const { error } = await query;
    if (error) throw error;
  },
  async count(table) {
    const { count, error } = await _sb.from(table).select('*', { count:'exact', head:true });
    if (error) throw error;
    return count || 0;
  },
  async getByIndex(table, col, val) {
    const { data, error } = await _sb.from(table).select('*').eq(col, val);
    if (error) throw error;
    return data || [];
  },
  async findByEmail(table, email) {
    const { data, error } = await _sb.from(table).select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async findByMobile(table, mobile) {
    const { data, error } = await _sb.from(table).select('*').eq('mobile', mobile).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  setSession(user, role) {
    const { password: _omit, ...safeUser } = user;
    currentUser = { ...safeUser, role };
    localStorage.setItem(this._prefix + 'session', JSON.stringify({ user: currentUser, expiresAt: Date.now() + this._sessionTTL }));
  },
  clearSession() { currentUser = null; localStorage.removeItem(this._prefix + 'session'); }
};

let currentUser = null;

// PAGE INIT
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init().catch(e => console.error('DB init failed:', e));
  const pageId = document.body.id;

  if (pageId === 'page-patient' || pageId === 'page-hospital') {
    const raw = localStorage.getItem('ehospitee_session');
    if (!raw) { window.location.href = 'ehospitee-login.html'; return; }
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) { DB.clearSession(); window.location.href = 'ehospitee-login.html'; return; }
      currentUser = session.user;
    } catch { DB.clearSession(); window.location.href = 'ehospitee-login.html'; return; }
  }

  // If already logged in and visiting login/register, redirect to dashboard
  if ((pageId === 'page-login' || pageId === 'page-register') && currentUser) {
    window.location.href = 'ehospitee-patient.html';
    return;
  }

  switch (pageId) {
    case 'page-landing': initRevealObserver(); initHeroTilt(); initHIWAutoPlay(); initParallax(); buildEmojiGrid(); navScrollHandler(); break;
    case 'page-patient':
      if (!currentUser) { window.location.href = 'ehospitee-login.html'; return; }
      _setHTML('patient-name', currentUser.firstName || currentUser.name || 'User');
      _setHTML('sidebar-patient-name', (currentUser.firstName || currentUser.name || 'User') + ' ' + (currentUser.lastName || ''));
      await loadPatientDash(currentUser);
      buildEmojiGrid(); navScrollHandler(); break;
    case 'page-hospital':
      if (!currentUser) { window.location.href = 'ehospitee-login.html'; return; }
      buildBedGrid(); buildEmojiGrid(); navScrollHandler(); break;
  }
});

// REGISTRATION
let selectedRole = 'patient';

function selectRole(r) {
  selectedRole = r;
  document.getElementById('role-patient').classList.toggle('selected', r === 'patient');
  document.getElementById('role-hospital').classList.toggle('selected', r === 'hospital');
  document.getElementById('reg-patient-form').style.display  = r === 'patient'  ? 'block' : 'none';
  document.getElementById('reg-hospital-form').style.display = r === 'hospital' ? 'block' : 'none';
}

async function handleRegister() {
  const btn = document.getElementById('reg-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  try {
    if (selectedRole === 'patient') {
      const firstName  = document.getElementById('reg-fname')?.value.trim() || '';
      const lastName   = document.getElementById('reg-lname')?.value.trim() || '';
      const mobile     = document.getElementById('reg-mobile')?.value.trim() || '';
      const email      = document.getElementById('reg-email')?.value.trim() || '';
      const dob        = document.getElementById('reg-dob')?.value.trim() || '';
      const bloodGroup = document.getElementById('reg-blood')?.value.trim() || '';
      const password   = document.getElementById('reg-password')?.value.trim() || '';
      const confirmPw  = document.getElementById('reg-confirm')?.value.trim() || '';

      if (!firstName || !email || !password) { showToast('Please fill all required fields'); btn.textContent='Create Account'; btn.disabled=false; return; }
      if (password !== confirmPw) { showToast('Passwords do not match'); btn.textContent='Create Account'; btn.disabled=false; return; }
      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast(pwError); btn.textContent='Create Account'; btn.disabled=false; return; }
      const existing = await DB.findByEmail('patients', email);
      if (existing) { showToast('Email already registered'); btn.textContent='Create Account'; btn.disabled=false; return; }

      const hashedPassword = await Auth.hashPassword(password);
      const user = await DB.add('patients', {
        firstName: Sanitize.text(firstName), lastName: Sanitize.text(lastName),
        mobile: Sanitize.text(mobile), email: email.toLowerCase(),
        dob, bloodGroup, password: hashedPassword,
        allergies: '', emergencyContact: '', createdAt: new Date().toISOString()
      });
      DB.setSession(user, 'patient');
      SecureLogger.info('register_success', { type: 'patient' });
      showToast('Account created! Redirecting...');
      setTimeout(() => window.location.href = 'ehospitee-patient.html', 900);

    } else {
      const name          = document.getElementById('reg-hosp-name')?.value.trim() || null;
      const regNo         = document.getElementById('reg-hosp-regno')?.value.trim() || null;
     // const city          = document.getElementById('reg-hosp-city')?.value.trim() || null;
      const pincode       = document.getElementById('reg-hosp-pin')?.value.trim() || null;
      const contactPerson = document.getElementById('reg-hosp-contact')?.value.trim() || null;
      const email         = document.getElementById('reg-hosp-email')?.value.trim() || null;
      const phone         = document.getElementById('reg-hosp-phone')?.value.trim() || null;
      const password      = document.getElementById('reg-hosp-password')?.value || null;

      if (!name || !email || !password) { showToast('Please fill all required fields'); btn.textContent='Create Account'; btn.disabled=false; return; }
      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast(pwError); btn.textContent='Create Account'; btn.disabled=false; return; }
      const existing = await DB.findByEmail('hospitals', email);
      if (existing) { showToast('Email already registered'); btn.textContent='Create Account'; btn.disabled=false; return; }

      const hashedPassword = await Auth.hashPassword(password);
      const hosp = await DB.add('hospitals', {
        name: Sanitize.text(name), regNo: Sanitize.text(regNo),
       // city: Sanitize.text(city),
        pincode: Sanitize.text(pincode),
        contactPerson: Sanitize.text(contactPerson), email: email.toLowerCase(),
        phone: Sanitize.text(phone), password: hashedPassword,
        createdAt: new Date().toISOString()
      });
      DB.setSession(hosp, 'hospital');
      SecureLogger.info('register_success', { type: 'hospital' });
      showToast('Hospital account created! Redirecting...');
      setTimeout(() => window.location.href = 'ehospitee-patient.html', 900);
    }
  } catch(e) {
    SecureLogger.error('register_error', { message: e.message });
    // Show the actual Supabase error so we can debug
    showToast('Registration failed: ' + (e.message || 'Please try again'));
    console.error('Register error:', e);
  }
  btn.textContent = 'Create Account'; btn.disabled = false;
}

// LOGIN
function switchLoginTab(type, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-patient').style.display  = type === 'patient'  ? 'block' : 'none';
  document.getElementById('login-hospital').style.display = type === 'hospital' ? 'block' : 'none';
}

async function handleLogin(type) {
  if (type === 'demo-patient') {
    try {
      const user = await DB.findByEmail('patients', 'rajesh@demo.com');
      if (user) { DB.setSession(user, 'patient'); window.location.href = 'ehospitee-patient.html'; }
      else showToast('Demo account not found. Please register first.');
    } catch(e) { showToast('Login error: ' + e.message); }
    return;
  }
  if (type === 'demo-hospital') {
    try {
      const hosp = await DB.findByEmail('hospitals', 'admin@apollo.com');
      if (hosp) { DB.setSession(hosp, 'hospital'); window.location.href = 'ehospitee-patient.html'; }
      else showToast('Demo account not found. Please register first.');
    } catch(e) { showToast('Login error: ' + e.message); }
    return;
  }

  const limit = RateLimit.check();
  if (!limit.allowed) { showToast(`Too many attempts. Try again in ${limit.remaining} min.`); return; }

  if (type === 'patient') {
    const id = document.getElementById('login-id')?.value.trim() || '';
    const pw = document.getElementById('login-pw')?.value.trim() || '';
    if (!id || !pw) { showToast('Please enter your credentials'); return; }
    try {
      const user = await DB.findByEmail('patients', id) || await DB.findByMobile('patients', id);
      if (!user || !(await Auth.verifyPassword(pw, user.password))) {
        RateLimit.record();
        showToast('Invalid credentials — check your email and password');
        return;
      }
      if (Auth.isLegacyPassword(user.password)) {
        const hashed = await Auth.hashPassword(pw);
        await _sb.from('patients').update({ password: hashed }).eq('id', user.id);
      }
      RateLimit.reset();
      DB.setSession(user, 'patient');
      window.location.href = 'ehospitee-patient.html';
    } catch(e) {
      showToast('Login error: ' + e.message);
      console.error('Login error:', e);
    }
    return;
  }

  if (type === 'hospital') {
    const id = document.getElementById('hosp-login-id')?.value.trim() || '';
    const pw = document.getElementById('hosp-login-pw')?.value.trim() || '';
    if (!id || !pw) { showToast('Please enter your credentials'); return; }
    try {
      const hosp = await DB.findByEmail('hospitals', id);
      if (!hosp || !(await Auth.verifyPassword(pw, hosp.password))) {
        RateLimit.record();
        showToast('Invalid credentials — check your email and password');
        return;
      }
      if (Auth.isLegacyPassword(hosp.password)) {
        const hashed = await Auth.hashPassword(pw);
        await _sb.from('hospitals').update({ password: hashed }).eq('id', hosp.id);
      }
      RateLimit.reset();
      DB.setSession(hosp, 'hospital');
      window.location.href = 'ehospitee-patient.html';
    } catch(e) {
      showToast('Login error: ' + e.message);
      console.error('Login error:', e);
    }
  }
}

function signOut() { SecureLogger.info('logout', {}); DB.clearSession(); window.location.href = 'index.html'; }

// PATIENT DASHBOARD
async function loadPatientDash(user) {
  populateProfileForm(user);
  renderAppointments(await DB.getByIndex('appointments', 'patientId', user.id));
  renderRecords(await DB.getByIndex('records', 'patientId', user.id));
  renderMedications(await DB.getByIndex('medications', 'patientId', user.id));
  const vitals = await DB.getAll('vitals');
  const v = vitals.find(v => v.patientId === user.id);
  if (v) renderVitals(v);
}

function renderAppointments(appts) {
  const upcoming = appts.filter(a => a.status === 'upcoming');
  const past     = appts.filter(a => a.status !== 'upcoming');
  const row = a => `<div class="appt-row"><div class="appt-avatar2">&#x1F9BA;</div><div class="appt-info"><div class="appt-doc">${Sanitize.html(a.doctor)} - ${Sanitize.html(a.specialty)}</div><div class="appt-spec">${Sanitize.html(a.hospital)} - ${Sanitize.html(a.date)} - ${Sanitize.html(a.time)}</div></div><span class="status-badge status-${Sanitize.html(a.status)}">${Sanitize.html(a.status.charAt(0).toUpperCase()+a.status.slice(1))}</span></div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No appointments found</div>';
  _setHTML('overview-upcoming', upcoming.length ? upcoming.slice(0,2).map(row).join('') : empty);
  _setHTML('appt-upcoming',     upcoming.length ? upcoming.map(row).join('') : empty);
  _setHTML('appt-past',         past.length     ? past.map(row).join('')     : empty);
  _setHTML('stat-upcoming',     upcoming.length);
}

function renderRecords(recs) {
  const icons = { lab:'&#x1F9EA;', prescription:'&#x1FA7A;', report:'&#x1F4C4;', summary:'&#x1F4CB;', upload:'&#x1F4C1;' };
  const item  = r => `<div class="record-item"><div class="record-icon">${icons[r.type]||'&#x1F4C4;'}</div><div><div class="record-name">${Sanitize.html(r.name)}</div><div class="record-date">${Sanitize.html(r.hospital)} - ${Sanitize.html(r.date)}</div></div><button class="record-btn" onclick="showToast('Opening record...')">View</button></div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No records found</div>';
  _setHTML('records-list',     recs.length ? recs.map(item).join('') : empty);
  _setHTML('overview-records', recs.slice(0,2).map(item).join(''));
  _setHTML('stat-records',     recs.length);
}

function renderMedications(meds) {
  const active = meds.filter(m => m.active);
  const item   = m => `<div class="med-item"><div class="med-icon">&#x1F48A;</div><div><div class="med-name">${Sanitize.html(m.name)}</div><div class="med-dose">${Sanitize.html(m.dose)} - ${Sanitize.html(m.frequency)} - ${Sanitize.html(m.prescribedBy)}</div></div><div class="med-time">${Sanitize.html(m.time)}</div></div>`;
  const empty  = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No active medications</div>';
  _setHTML('medications-list', active.length ? active.map(item).join('') : empty);
  _setHTML('overview-meds',    active.length ? active.map(item).join('') : empty);
  _setHTML('stat-meds',        active.length);
}

function renderVitals(v) {
  const map = { 'stat-heartrate':v.heartRate,'stat-bp':v.bp,'stat-temp':v.temp,'stat-sugar':v.sugar,'stat-weight':v.weight,'stat-spo2':v.spo2 };
  Object.entries(map).forEach(([id,val]) => _setHTML(id, Sanitize.html(val)));
}

function populateProfileForm(user) {
  _val('prof-fname',     user.firstName||'');
  _val('prof-lname',     user.lastName||'');
  _val('prof-dob',       user.dob||'');
  _val('prof-mobile',    user.mobile||'');
  _val('prof-email',     user.email||'');
  _val('prof-allergies', user.allergies||'');
  _val('prof-emergency', user.emergencyContact||'');
  const bg = document.getElementById('prof-blood');
  if (bg) { [...bg.options].forEach(o => { if (o.value === user.bloodGroup) o.selected = true; }); }
}

function showPanel(id, btn) {
  document.querySelectorAll('#page-patient .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) { document.querySelectorAll('#page-patient .sidebar-item').forEach(s => s.classList.remove('active')); btn.classList.add('active'); }
}

async function saveProfile() {
  if (!currentUser || currentUser.role !== 'patient') return;
  const firstName = _gval('prof-fname'), lastName = _gval('prof-lname'), email = _gval('prof-email'), mobile = _gval('prof-mobile');
  const emailErr = Validate.email(email);
  if (emailErr) { showToast(emailErr); return; }
  const updated = { ...currentUser, id:currentUser.id, firstName:Sanitize.text(firstName), lastName:Sanitize.text(lastName),
    dob:_gval('prof-dob'), bloodGroup:document.getElementById('prof-blood')?.value||'',
    mobile:Sanitize.text(mobile), email:email.toLowerCase(),
    allergies:Sanitize.text(_gval('prof-allergies')), emergencyContact:Sanitize.text(_gval('prof-emergency')) };
  await DB.put('patients', updated);
  DB.setSession(updated, 'patient');
  _setHTML('patient-name', Sanitize.html(updated.firstName));
  _setHTML('sidebar-patient-name', Sanitize.html(updated.firstName) + ' ' + Sanitize.html(updated.lastName));
  showToast('Profile saved!');
}

async function bookAppointment(doctor, specialty, hospital, fee) {
  if (!currentUser) { window.location.href = 'ehospitee-login.html'; return; }
  const limit = ActionLimit.check('book_appointment', 5, 60*60*1000);
  if (!limit.allowed) { showToast(`Too many bookings. Wait ${limit.remaining}s.`); return; }
  const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  await DB.add('appointments', { patientId:currentUser.id, doctor:Sanitize.text(doctor), specialty:Sanitize.text(specialty), hospital:Sanitize.text(hospital), date, time:'10:30 AM', status:'upcoming', fee, createdAt:new Date().toISOString() });
  renderAppointments(await DB.getByIndex('appointments', 'patientId', currentUser.id));
  showToast('Appointment booked with ' + Sanitize.html(doctor) + '!');
}

async function addMedication() {
  if (!currentUser) return;
  const name=_gval('new-med-name'), dose=_gval('new-med-dose'), freq=_gval('new-med-freq'), time=_gval('new-med-time');
  if (!name) { showToast('Enter medication name'); return; }
  await DB.add('medications', { patientId:currentUser.id, name:Sanitize.text(name), dose:Sanitize.text(dose), frequency:Sanitize.text(freq), time:Sanitize.text(time), prescribedBy:'Self', active:true, createdAt:new Date().toISOString() });
  ['new-med-name','new-med-dose','new-med-freq','new-med-time'].forEach(id => _val(id,''));
  renderMedications(await DB.getByIndex('medications','patientId',currentUser.id));
  showToast('Medication saved!');
}

async function uploadRecord(input) {
  if (!currentUser || !input.files[0]) return;
  const file = input.files[0];
  const fileError = Validate.file(file);
  if (fileError) { showToast(fileError); input.value=''; return; }
  const safeName = Sanitize.filename(file.name);
  const reader = new FileReader();
  reader.onerror = () => showToast('Failed to read file. Please try again.');
  reader.onload = async e => {
    try {
      await DB.add('records', { patientId:currentUser.id, name:safeName, type:'upload', hospital:'Self Upload', date:new Date().toISOString().split('T')[0], fileData:e.target.result, createdAt:new Date().toISOString() });
      renderRecords(await DB.getByIndex('records','patientId',currentUser.id));
      showToast('Record uploaded!');
    } catch(err) { showToast('Upload failed: ' + err.message); }
  };
  reader.readAsDataURL(file);
}

async function saveVitals() {
  if (!currentUser) return;
  const fields = { heartRate:_gval('v-hr'), bp:_gval('v-bp'), temp:_gval('v-temp'), sugar:_gval('v-sugar'), weight:_gval('v-weight'), spo2:_gval('v-spo2') };
  const hasValue = Object.values(fields).some(v => v);
  if (!hasValue) { showToast('Enter at least one vital sign'); return; }
  const v = { patientId:currentUser.id, heartRate:Sanitize.text(fields.heartRate)||document.getElementById('stat-heartrate')?.textContent, bp:Sanitize.text(fields.bp)||document.getElementById('stat-bp')?.textContent, temp:Sanitize.text(fields.temp)||document.getElementById('stat-temp')?.textContent, sugar:Sanitize.text(fields.sugar)||document.getElementById('stat-sugar')?.textContent, weight:Sanitize.text(fields.weight)||document.getElementById('stat-weight')?.textContent, spo2:Sanitize.text(fields.spo2)||document.getElementById('stat-spo2')?.textContent, recordedAt:new Date().toISOString() };
  await DB.add('vitals', v);
  renderVitals(v);
  ['v-hr','v-bp','v-temp','v-sugar','v-weight','v-spo2'].forEach(id => _val(id,''));
  showToast('Vitals saved!');
}

async function triggerSOS() {
  if (!currentUser) return;
  let location = 'Location unavailable';
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
    location = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
  } catch {}
  await DB.add('emergencies', { patientId:currentUser.id, type:'SOS', location, status:'dispatched', triggeredAt:new Date().toISOString() });
  const logEl = document.getElementById('sos-log');
  if (logEl) {
    logEl.innerHTML = `<div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:12px;padding:14px;margin-bottom:10px"><div style="font-weight:700;color:#DC2626;font-size:.88rem">SOS Triggered - ${new Date().toLocaleTimeString()}</div><div style="font-size:.78rem;color:var(--ink-light);margin-top:6px">Family notified - 3 Hospitals alerted - Ambulance dispatched<br>Location: ${Sanitize.html(location)}</div></div>` + logEl.innerHTML;
  }
  showToast('SOS sent! Ambulance dispatched. Family notified.');
}

// HOSPITAL DASHBOARD
function showHPanel(id, btn) {
  document.querySelectorAll('#page-hospital .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) { document.querySelectorAll('#page-hospital .sidebar-item').forEach(s => s.classList.remove('active')); btn.classList.add('active'); }
}

function buildBedGrid() {
  const g = document.getElementById('bed-grid');
  if (!g || g.children.length) return;
  const states = ['free','occupied','occupied','free','reserved','occupied','free','occupied','occupied','free','occupied','occupied','reserved','free','occupied','free'];
  states.forEach((s, i) => {
    const b = document.createElement('div');
    b.className = `bed-cell bed-${s}`;
    b.textContent = 'B' + (i + 1);
    b.title = `Bed ${i + 1} - ${s}`;
    b.onclick = () => showToast(`Bed ${i + 1}: ${s}`);
    g.appendChild(b);
  });
}

// WHATSAPP CHAT
const WA_NUMBER = '919876543210';
let waOpen = false;

function toggleChat() {
  waOpen = !waOpen;
  const chat = document.getElementById('waChat');
  const dot  = document.getElementById('waDot');
  if (waOpen) { chat.classList.add('open'); dot.style.display = 'none'; setTimeout(() => document.getElementById('waInput')?.focus(), 400); }
  else { chat.classList.remove('open'); }
}

function switchWaTab(tab, btn) {
  document.querySelectorAll('.wa-chat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wa-tab-content').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('wa-tab-' + tab).classList.add('active');
  closeEmojiPicker();
}

const waReplies = {
  'book an appointment': "I can help you book an appointment!\nTell me:\n1. Which specialty?\n2. Preferred date & time?\n3. Your city?",
  'emergency sos help': "For emergencies:\n- Press the SOS button in your dashboard\n- Or call 108 immediately",
  'view my health records': "Your health records are securely stored in your dashboard.",
  'contact a doctor': "To contact a doctor:\n1. Log in to your dashboard\n2. Go to Appointments\n3. Select your doctor",
  'medication reminders': "Your current schedule is in the Medications section of your dashboard.",
  'default': "Thanks for reaching out! I'm the E-Hospitee assistant.\nI can help with:\nAppointments, Records, Medications, Emergencies, Doctor consultation."
};

function getReply(msg) {
  const key = Object.keys(waReplies).find(k => msg.toLowerCase().includes(k));
  return waReplies[key] || waReplies['default'];
}

function addMessage(text, type) {
  const container = document.getElementById('waMessages');
  const now = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  const div = document.createElement('div');
  div.className = 'wa-msg wa-msg-' + type;
  const safeText = type === 'out' ? Sanitize.html(text).replace(/\n/g, '<br>') : text.replace(/\n/g, '<br>');
  div.innerHTML = safeText + `<div class="wa-msg-time">${time}${type === 'out' ? ' <span class="wa-tick">done</span>' : ''}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('waMessages');
  const t = document.createElement('div');
  t.className = 'wa-typing'; t.id = 'waTyping';
  t.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(t);
  container.scrollTop = container.scrollHeight;
}
function removeTyping() { const t = document.getElementById('waTyping'); if (t) t.remove(); }

function sendWaMessage() {
  const input = document.getElementById('waInput');
  const text = input.value.trim();
  const msgError = Validate.chatMessage(text);
  if (msgError) { showToast(msgError); return; }
  const limit = ActionLimit.check('chat_message', 30, 60 * 1000);
  if (!limit.allowed) { showToast(`Slow down! Wait ${limit.remaining}s.`); return; }
  addMessage(text, 'out');
  input.value = ''; input.style.height = 'auto';
  closeEmojiPicker();
  showTyping();
  setTimeout(() => { removeTyping(); addMessage(getReply(text), 'in'); }, 900 + Math.random() * 600);
}

function sendQuickReply(text) {
  if (!waOpen) toggleChat();
  switchWaTab('chat', document.querySelector('.wa-chat-tab'));
  setTimeout(() => { addMessage(text, 'out'); showTyping(); setTimeout(() => { removeTyping(); addMessage(getReply(text), 'in'); }, 1000); }, waOpen ? 0 : 400);
}

function handleWaKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWaMessage(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }

const EMOJIS = ['&#x1F60A;','&#x1F637;','&#x1F48A;','&#x1F3E5;','&#x2764;','&#x1F9BA;','&#x1FA78;','&#x1F691;','&#x1F629;','&#x1F912;','&#x1F489;','&#x1F9EC;','&#x1F3C3;','&#x1F4AA;','&#x1F9D8;','&#x1F60C;','&#x1F64F;','&#x2705;','&#x26A0;','&#x1F4CB;','&#x1F4C5;','&#x1F514;','&#x1F4DE;','&#x1F4AC;','&#x1F44B;','&#x1F91D;'];

function buildEmojiGrid() {
  const g = document.getElementById('waEmojiGrid');
  if (!g) return;
  EMOJIS.forEach(e => {
    const s = document.createElement('span');
    s.innerHTML = e;
    s.onclick = () => { document.getElementById('waInput').value += s.textContent; closeEmojiPicker(); document.getElementById('waInput').focus(); };
    g.appendChild(s);
  });
}

function toggleEmojiPicker(e) { e.stopPropagation(); document.getElementById('waEmojiPicker').classList.toggle('open'); }
function closeEmojiPicker() { document.getElementById('waEmojiPicker')?.classList.remove('open'); }
document.addEventListener('click', closeEmojiPicker);

function openWhatsApp() { window.open(`https://wa.me/${WA_NUMBER}?text=Hi+E-Hospitee!+I+need+help.`, '_blank'); }

// LANDING PAGE
function handleCTA(btn) {
  const inputs = btn.parentElement.querySelectorAll('input');
  let ok = true;
  inputs.forEach(inp => { if (!inp.value.trim()) { inp.style.borderColor = '#F87171'; setTimeout(() => inp.style.borderColor = '', 2000); ok = false; } });
  if (ok) { btn.textContent = 'Sent'; btn.style.background = '#16A34A'; document.getElementById('cta-success').style.display = 'block'; inputs.forEach(i => i.value = ''); }
}

let currentStep = 0;
function setStep(idx, el) {
  document.querySelectorAll('#page-landing .hiw-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-landing .hiw-screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('screen-' + idx).classList.add('active');
  currentStep = idx;
}

function switchTab(type, btn) {
  document.querySelectorAll('.fw-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.fw-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fw-' + type).classList.add('active');
}

// UTILITIES
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function _setHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }
function _val(id, val)     { const el = document.getElementById(id); if (el) el.value = val; }
function _gval(id)         { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

function navScrollHandler() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', scrollY > 20);
  });
}

function initRevealObserver() {
  setTimeout(() => {
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }, 200);
}

function initHeroTilt() {
  const tilt = document.getElementById('tiltCard');
  if (!tilt) return;
  const parent = tilt.closest('.hero-visual');
  if (!parent) return;
  parent.addEventListener('mousemove', e => {
    const r = tilt.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width/2) / (r.width/2);
    const dy = (e.clientY - r.top - r.height/2) / (r.height/2);
    tilt.style.transform = `perspective(800px) rotateY(${dx*14}deg) rotateX(${-dy*10}deg) scale(1.02)`;
  });
  parent.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
}

function initParallax() {
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.orb').forEach((o, i) => { o.style.transform = `translateY(${scrollY*(0.08+i*0.04)}px)`; });
  });
}

function initHIWAutoPlay() {
  setInterval(() => {
    const steps = document.querySelectorAll('#page-landing .hiw-step');
    if (!steps.length) return;
    const next = (currentStep + 1) % steps.length;
    setStep(next, steps[next]);
  }, 3500);
}
