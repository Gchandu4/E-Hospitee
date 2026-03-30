// ══════════════════════════════════════
// E-HOSPITEE — app.js (shared across all pages)
// ══════════════════════════════════════

// ── HTTPS ENFORCEMENT ──
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https:' + location.href.substring(location.protocol.length));
}

// ── SUPABASE CONFIG ──
// The anon key is safe to expose in frontend — security is enforced via Supabase Row Level Security (RLS)
const SUPABASE_URL = 'https://ajscgpuozcyqsteseppp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc2NncHVvemN5cXN0ZXNlcHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTk2NDIsImV4cCI6MjA5MDQzNTY0Mn0.NAZG-ZdcwJGHN-SLscKb2MeUIJ52GBOiNmxlBPqGeHg';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SECURE LOGGER ──
const SecureLogger = {
  _isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
  _queue: [],
  _flushing: false,

  _sanitize(data) {
    const { password, token, key, secret, ...safe } = data || {};
    return safe;
  },

  async _flush() {
    if (this._flushing || this._queue.length === 0) return;
    this._flushing = true;
    const batch = this._queue.splice(0, 10);
    try {
      await _sb.from('audit_logs').insert(batch);
    } catch { /* logging must never break the app */ }
    this._flushing = false;
    if (this._queue.length > 0) this._flush();
  },

  _log(level, event, data) {
    const entry = {
      level,
      event,
      data: JSON.stringify(this._sanitize(data)),
      user_id: (typeof currentUser !== 'undefined' && currentUser?.id) || null,
      user_role: (typeof currentUser !== 'undefined' && currentUser?.role) || null,
      url: location.pathname,
      timestamp: new Date().toISOString()
    };
    if (this._isDev) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${level.toUpperCase()}] ${event}`, data);
    }
    this._queue.push(entry);
    this._flush();
  },

  info(event, data = {})  { this._log('info',  event, data); },
  warn(event, data = {})  { this._log('warn',  event, data); },
  error(event, data = {}) { this._log('error', event, data); },
  anomaly(event, data = {}) { this._log('warn', `ANOMALY:${event}`, data); }
};

// ── INPUT VALIDATION & SANITIZATION ──
const Sanitize = {
  html(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;');
  },
  text(str) {
    if (str == null) return '';
    return String(str).replace(/<[^>]*>/g,'').trim().slice(0,500);
  },
  filename(str) {
    if (str == null) return 'upload';
    return String(str).replace(/[^a-zA-Z0-9._\-]/g,'_').slice(0,100);
  }
};

const Validate = {
  name(val, label='Name') {
    if (!val||val.trim().length<1) return `${label} is required`;
    if (val.trim().length>100) return `${label} must be under 100 characters`;
    if (/<|>|script|javascript/i.test(val)) return `${label} contains invalid characters`;
    return null;
  },
  email(val) {
    if (!val||!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Invalid email format';
    if (val.length>254) return 'Email too long';
    return null;
  },
  mobile(val) {
    if (!val||!val.trim()) return null;
    const digits = val.replace(/[\s\-\+\(\)]/g,'');
    if (!/^\d{7,15}$/.test(digits)) return 'Invalid mobile number';
    return null;
  },
  date(val) {
    if (!val) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'Invalid date format (YYYY-MM-DD)';
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d > new Date()) return 'Date cannot be in the future';
    return null;
  },
  bloodGroup(val) {
    if (!val) return null;
    if (!/^(A|B|AB|O)[+-]$/.test(val)) return 'Invalid blood group';
    return null;
  },
  text(val, label='Field', maxLen=500) {
    if (!val||!val.trim()) return null;
    if (val.length>maxLen) return `${label} must be under ${maxLen} characters`;
    if (/<script|javascript:|on\w+\s*=/i.test(val)) return `${label} contains invalid content`;
    return null;
  },
  vitals: {
    heartRate: v => !v||/^\d{1,3}\s*(bpm)?$/i.test(v.trim()) ? null : 'Invalid heart rate (e.g. 72 bpm)',
    bp:        v => !v||/^\d{2,3}\/\d{2,3}$/.test(v.trim()) ? null : 'Invalid BP (e.g. 120/80)',
    temp:      v => !v||/^\d{2,3}(\.\d)?\s*°?[CF]?$/i.test(v.trim()) ? null : 'Invalid temperature (e.g. 36.8°C)',
    sugar:     v => !v||/^\d{2,3}\s*(mg\/dL)?$/i.test(v.trim()) ? null : 'Invalid blood sugar (e.g. 98 mg/dL)',
    weight:    v => !v||/^\d{2,3}(\.\d)?\s*(kg|lbs)?$/i.test(v.trim()) ? null : 'Invalid weight (e.g. 72 kg)',
    spo2:      v => !v||/^\d{2,3}\s*%?$/.test(v.trim()) ? null : 'Invalid SpO2 (e.g. 98%)',
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

const ActionLimit = {
  _limits: {},
  check(key, max, windowMs) {
    const now = Date.now();
    const state = this._limits[key] || { count:0, firstAt:now };
    if (now - state.firstAt > windowMs) { this._limits[key] = { count:1, firstAt:now }; return { allowed:true }; }
    if (state.count >= max) {
      const remaining = Math.ceil((windowMs-(now-state.firstAt))/1000);
      SecureLogger.anomaly('action_rate_limit', { key, count:state.count });
      return { allowed:false, remaining };
    }
    this._limits[key] = { count:state.count+1, firstAt:state.firstAt };
    return { allowed:true };
  }
};

const BotDetect = {
  _loadTime: Date.now(),
  check(honeypotFieldId) {
    const hp = document.getElementById(honeypotFieldId);
    if (hp && hp.value) { SecureLogger.anomaly('bot_honeypot_triggered', { field:honeypotFieldId }); return true; }
    if (Date.now()-this._loadTime < 2000) { SecureLogger.anomaly('bot_timing_check', { elapsed:Date.now()-this._loadTime }); return true; }
    return false;
  }
};

// ── SECURITY: Password hashing via Web Crypto API ──
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

// ── SECURITY: Rate limiting ──
const RateLimit = {  _key: 'ehospitee_login_attempts',
  _max: 5,
  _windowMs: 15 * 60 * 1000,
  _getState() {
    const raw = localStorage.getItem(this._key);
    return raw ? JSON.parse(raw) : { count: 0, firstAttempt: Date.now() };
  },
  check() {
    const state = this._getState();
    const now = Date.now();
    if (now - state.firstAttempt > this._windowMs) { localStorage.removeItem(this._key); return { allowed: true }; }
    if (state.count >= this._max) {
      const remaining = Math.ceil((this._windowMs - (now - state.firstAttempt)) / 60000);
      SecureLogger.anomaly('rate_limit_exceeded', { attempts: state.count });
      return { allowed: false, remaining };
    }
    return { allowed: true };
  },
  record() {
    const state = this._getState();
    const now = Date.now();
    if (now - state.firstAttempt > this._windowMs) {
      localStorage.setItem(this._key, JSON.stringify({ count: 1, firstAttempt: now }));
    } else {
      localStorage.setItem(this._key, JSON.stringify({ count: state.count + 1, firstAttempt: state.firstAttempt }));
    }
  },
  reset() { localStorage.removeItem(this._key); }
};

// ── DATABASE (Supabase) ──
const DB = {
  _prefix: 'ehospitee_',
  _sessionTTL: 8 * 60 * 60 * 1000, // 8 hours
  _patientTables: new Set(['appointments','records','medications','vitals','emergencies']),

  async init() {
    await this._loadSession();
  },

  async _loadSession() {
    const raw = localStorage.getItem(this._prefix + 'session');
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) { this.clearSession(); return; }
      currentUser = session.user;
    } catch { this.clearSession(); }
  },

  /* ── Core CRUD with IDOR protection ── */
  async add(table, data) {
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      if (data.patientId !== currentUser.id) {
        SecureLogger.anomaly('idor_attempt_write', { table, claimedId: data.patientId, actualId: currentUser.id });
        throw new Error('Access denied: cannot write to another user\'s data');
      }
    }
    const { data: row, error } = await _sb.from(table).insert(data).select().single();
    if (error) throw error;
    return row;
  },
  async get(table, id) {
    const query = _sb.from(table).select('*').eq('id', id);
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      query.eq('patientId', currentUser.id);
    }
    const { data, error } = await query.single();
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
      if (data.patientId !== currentUser.id) {
        SecureLogger.anomaly('idor_attempt_update', { table, claimedId: data.patientId, actualId: currentUser.id });
        throw new Error('Access denied: cannot modify another user\'s data');
      }
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
    const { count, error } = await _sb.from(table).select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
  async getByIndex(table, col, val) {
    if (col === 'patientId' && this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      if (val !== currentUser.id) {
        SecureLogger.anomaly('idor_attempt_read', { table, claimedId: val, actualId: currentUser.id });
        throw new Error('Access denied: cannot access another user\'s data');
      }
    }
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

  /* ── Session ── */
  setSession(user, role) {
    const { password: _omit, ...safeUser } = user;
    currentUser = { ...safeUser, role };
    localStorage.setItem(this._prefix + 'session', JSON.stringify({
      user: currentUser,
      expiresAt: Date.now() + this._sessionTTL
    }));
  },
  clearSession() {
    currentUser = null;
    localStorage.removeItem(this._prefix + 'session');
  }
};

let currentUser = null;

// ══════════════════════════════════════
// PAGE INITIALISATION (DOMContentLoaded)
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await DB.init().catch(e => console.error('DB init failed:', e));

  const pageId = document.body.id;

  // ── Guard protected pages ──
  if (pageId === 'page-patient' || pageId === 'page-hospital') {
    const raw = localStorage.getItem('ehospitee_session');
    if (!raw) { window.location.href = 'login.html'; return; }
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        DB.clearSession();
        window.location.href = 'login.html';
        return;
      }
      currentUser = session.user;
    } catch {
      DB.clearSession();
      window.location.href = 'login.html';
      return;
    }
  }

  // ── Per-page init ──
  switch (pageId) {
    case 'page-landing':
      initRevealObserver();
      initHeroTilt();
      initHIWAutoPlay();
      initParallax();
      buildEmojiGrid();
      navScrollHandler();
      break;

    case 'page-login':
      // nothing extra
      break;

    case 'page-register':
      // nothing extra
      break;

    case 'page-patient':
      _setHTML('patient-name', currentUser.firstName);
      _setHTML('sidebar-patient-name', currentUser.firstName + ' ' + (currentUser.lastName || ''));
      await loadPatientDash(currentUser);
      buildEmojiGrid();
      navScrollHandler();
      break;

    case 'page-hospital':
      buildBedGrid();
      buildEmojiGrid();
      navScrollHandler();
      break;
  }
});

// ══════════════════════════════════════
// REGISTRATION
// ══════════════════════════════════════
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
      const inputs = document.querySelectorAll('#reg-patient-form input, #reg-patient-form select');
      const [firstName, lastName, mobile, email, dob, bloodGroup, password, confirmPw] = [...inputs].map(i => i.value.trim());
      if (!firstName || !email || !password) { showToast('⚠️ Please fill all required fields'); return; }
      if (password !== confirmPw)             { showToast('⚠️ Passwords do not match');          return; }
      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast('⚠️ ' + pwError); return; }
      if (await DB.findByEmail('patients', email)) { showToast('⚠️ Email already registered'); return; }
      const hashedPassword = await Auth.hashPassword(password);
      const user = await DB.add('patients', { firstName, lastName, mobile, email, dob, bloodGroup, password: hashedPassword, allergies:'', emergencyContact:'', createdAt:new Date().toISOString() });
      DB.setSession(user, 'patient');
      SecureLogger.info('register_success', { type: 'patient', email });
      showToast('✅ Account created! Redirecting...');
      setTimeout(() => window.location.href = 'patient-dashboard.html', 900);
    } else {
      const inputs = document.querySelectorAll('#reg-hospital-form input');
      const [name, regNo, city, pincode, contactPerson, email, phone, password] = [...inputs].map(i => i.value.trim());
      if (!name || !email || !password) { showToast('⚠️ Please fill all required fields'); return; }
      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast('⚠️ ' + pwError); return; }
      if (await DB.findByEmail('hospitals', email)) { showToast('⚠️ Email already registered'); return; }
      const hashedPassword = await Auth.hashPassword(password);
      const hosp = await DB.add('hospitals', { name, regNo, city, pincode, contactPerson, email, phone, password: hashedPassword, createdAt:new Date().toISOString() });
      DB.setSession(hosp, 'hospital');
      SecureLogger.info('register_success', { type: 'hospital', email });
      showToast('✅ Hospital account created! Redirecting...');
      setTimeout(() => window.location.href = 'hospital-dashboard.html', 900);
    }
  } catch(e) { SecureLogger.error('register_error', { message: e.message }); showToast('⚠️ Registration failed. Try again.'); console.error(e); }
  btn.textContent = 'Create Account →'; btn.disabled = false;
}

// ══════════════════════════════════════
// LOGIN
// ══════════════════════════════════════
function switchLoginTab(type, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-patient').style.display  = type === 'patient'  ? 'block' : 'none';
  document.getElementById('login-hospital').style.display = type === 'hospital' ? 'block' : 'none';
}

async function handleLogin(type) {
  if (type === 'demo-patient') {
    const user = await DB.findByEmail('patients', 'rajesh@demo.com');
    if (user) { DB.setSession(user, 'patient'); window.location.href = 'patient-dashboard.html'; }
    return;
  }
  if (type === 'demo-hospital') {
    const hosp = await DB.findByEmail('hospitals', 'admin@apollo.com');
    if (hosp) { DB.setSession(hosp, 'hospital'); window.location.href = 'hospital-dashboard.html'; }
    return;
  }

  // Rate limit check
  const limit = RateLimit.check();
  if (!limit.allowed) {
    SecureLogger.anomaly('login_blocked_rate_limit', { remaining: limit.remaining });
    showToast(`⚠️ Too many attempts. Try again in ${limit.remaining} min.`);
    return;
  }

  if (type === 'patient') {
    const id = _gval('login-id'), pw = _gval('login-pw');
    if (!id || !pw) { showToast('⚠️ Please enter your credentials'); return; }
    const user = await DB.findByEmail('patients', id) ||
      await DB.findByMobile('patients', id);
    if (!user || !(await Auth.verifyPassword(pw, user.password))) {
      RateLimit.record();
      SecureLogger.warn('login_failed', { identifier: id, type: 'patient' });
      showToast('⚠️ Invalid credentials');
      return;
    }
    RateLimit.reset();
    SecureLogger.info('login_success', { userId: user.id, type: 'patient' });
    if (Auth.isLegacyPassword(user.password)) {
      const hashed = await Auth.hashPassword(pw);
      await _sb.from('patients').update({ password: hashed }).eq('id', user.id);
    }
    DB.setSession(user, 'patient');
    window.location.href = 'patient-dashboard.html';
    return;
  }
  if (type === 'hospital') {
    const id = _gval('hosp-login-id'), pw = _gval('hosp-login-pw');
    if (!id || !pw) { showToast('⚠️ Please enter your credentials'); return; }
    const hosp = await DB.findByEmail('hospitals', id);
    if (!hosp || !(await Auth.verifyPassword(pw, hosp.password))) {
      RateLimit.record();
      SecureLogger.warn('login_failed', { identifier: id, type: 'hospital' });
      showToast('⚠️ Invalid credentials');
      return;
    }
    RateLimit.reset();
    SecureLogger.info('login_success', { hospitalId: hosp.id, type: 'hospital' });
    if (Auth.isLegacyPassword(hosp.password)) {
      const hashed = await Auth.hashPassword(pw);
      await _sb.from('hospitals').update({ password: hashed }).eq('id', hosp.id);
    }
    DB.setSession(hosp, 'hospital');
    window.location.href = 'hospital-dashboard.html';
  }
}

function signOut() { SecureLogger.info('logout', {}); DB.clearSession(); window.location.href = 'index.html'; }

// ══════════════════════════════════════
// PATIENT DASHBOARD — LOAD & RENDER
// ══════════════════════════════════════
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
  const row = a => `<div class="appt-row"><div class="appt-avatar2">🩺</div><div class="appt-info"><div class="appt-doc">${Sanitize.html(a.doctor)} — ${Sanitize.html(a.specialty)}</div><div class="appt-spec">${Sanitize.html(a.hospital)} · ${Sanitize.html(a.date)} · ${Sanitize.html(a.time)}</div></div><span class="status-badge status-${Sanitize.html(a.status)}">${Sanitize.html(a.status.charAt(0).toUpperCase()+a.status.slice(1))}</span></div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No appointments found</div>';
  _setHTML('overview-upcoming', upcoming.length ? upcoming.slice(0,2).map(row).join('') : empty);
  _setHTML('appt-upcoming',     upcoming.length ? upcoming.map(row).join('') : empty);
  _setHTML('appt-past',         past.length     ? past.map(row).join('')     : empty);
  _setHTML('stat-upcoming',     upcoming.length);
}

function renderRecords(recs) {
  const icons = { lab:'🧪', prescription:'🩺', report:'📄', summary:'📋', upload:'📁' };
  const item  = r => `<div class="record-item"><div class="record-icon">${icons[r.type]||'📄'}</div><div><div class="record-name">${Sanitize.html(r.name)}</div><div class="record-date">${Sanitize.html(r.hospital)} · ${Sanitize.html(r.date)}</div></div><button class="record-btn" onclick="showToast('Opening record...')">View</button></div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No records found</div>';
  _setHTML('records-list',     recs.length ? recs.map(item).join('') : empty);
  _setHTML('overview-records', recs.slice(0,2).map(item).join(''));
  _setHTML('stat-records',     recs.length);
}

function renderMedications(meds) {
  const active = meds.filter(m => m.active);
  const item   = m => `<div class="med-item"><div class="med-icon">💊</div><div><div class="med-name">${Sanitize.html(m.name)}</div><div class="med-dose">${Sanitize.html(m.dose)} · ${Sanitize.html(m.frequency)} · ${Sanitize.html(m.prescribedBy)}</div></div><div class="med-time">${Sanitize.html(m.time)}</div></div>`;
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
  // Blood group select
  const bg = document.getElementById('prof-blood');
  if (bg) { [...bg.options].forEach(o => { if (o.value === user.bloodGroup) o.selected = true; }); }
}

// Patient panel switcher
function showPanel(id, btn) {
  document.querySelectorAll('#page-patient .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) { document.querySelectorAll('#page-patient .sidebar-item').forEach(s => s.classList.remove('active')); btn.classList.add('active'); }
}

// ── Patient DB Actions ──
async function saveProfile() {
  if (!currentUser || currentUser.role !== 'patient') return;
  const firstName = _gval('prof-fname'), lastName = _gval('prof-lname'),
        email = _gval('prof-email'), mobile = _gval('prof-mobile');
  const errors = [Validate.name(firstName,'First name'),Validate.name(lastName,'Last name'),Validate.email(email),Validate.mobile(mobile)].filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }
  const updated = { ...currentUser, id:currentUser.id, patientId:currentUser.id,
    firstName:Sanitize.text(firstName), lastName:Sanitize.text(lastName),
    dob:_gval('prof-dob'), bloodGroup:document.getElementById('prof-blood')?.value||'',
    mobile:Sanitize.text(mobile), email:email.toLowerCase().trim(),
    allergies:Sanitize.text(_gval('prof-allergies')), emergencyContact:Sanitize.text(_gval('prof-emergency')) };
  await DB.put('patients', updated);
  DB.setSession(updated, 'patient');
  _setHTML('patient-name', Sanitize.html(updated.firstName));
  _setHTML('sidebar-patient-name', Sanitize.html(updated.firstName) + ' ' + Sanitize.html(updated.lastName));
  showToast('✅ Profile saved to database!');
}

async function bookAppointment(doctor, specialty, hospital, fee) {
  if (!currentUser) { window.location.href = 'login.html'; return; }
  const limit = ActionLimit.check('book_appointment', 5, 60*60*1000);
  if (!limit.allowed) { showToast(`⚠️ Too many bookings. Wait ${limit.remaining}s.`); return; }
  const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  await DB.add('appointments', { patientId:currentUser.id, doctor:Sanitize.text(doctor), specialty:Sanitize.text(specialty), hospital:Sanitize.text(hospital), date, time:'10:30 AM', status:'upcoming', fee, createdAt:new Date().toISOString() });
  renderAppointments(await DB.getByIndex('appointments', 'patientId', currentUser.id));
  showToast(`✅ Appointment booked with ${Sanitize.html(doctor)}!`);
}

async function addMedication() {
  if (!currentUser) return;
  const name=_gval('new-med-name'), dose=_gval('new-med-dose'), freq=_gval('new-med-freq'), time=_gval('new-med-time');
  if (!name) { showToast('⚠️ Enter medication name'); return; }
  const errors = [Validate.text(name,'Medication name',100),Validate.text(dose,'Dose',100),Validate.text(freq,'Frequency',100),Validate.text(time,'Time',50)].filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }
  const limit = ActionLimit.check('add_medication', 20, 10*60*1000);
  if (!limit.allowed) { showToast(`⚠️ Too many requests. Wait ${limit.remaining}s.`); return; }
  await DB.add('medications', { patientId:currentUser.id, name:Sanitize.text(name), dose:Sanitize.text(dose), frequency:Sanitize.text(freq), time:Sanitize.text(time), prescribedBy:'Self', active:true, createdAt:new Date().toISOString() });
  ['new-med-name','new-med-dose','new-med-freq','new-med-time'].forEach(id => _val(id,''));
  renderMedications(await DB.getByIndex('medications','patientId',currentUser.id));
  showToast('✅ Medication saved!');
}

async function uploadRecord(input) {
  if (!currentUser || !input.files[0]) return;
  const file = input.files[0];
  const fileError = Validate.file(file);
  if (fileError) { showToast('⚠️ ' + fileError); input.value=''; return; }
  const limit = ActionLimit.check('upload_record', 10, 60*60*1000);
  if (!limit.allowed) { showToast(`⚠️ Upload limit reached. Wait ${limit.remaining}s.`); return; }
  const safeName = Sanitize.filename(file.name);
  const reader = new FileReader();
  reader.onload = async e => {
    await DB.add('records', { patientId:currentUser.id, name:safeName, type:'upload', hospital:'Self Upload', date:new Date().toISOString().split('T')[0], fileData:e.target.result, createdAt:new Date().toISOString() });
    renderRecords(await DB.getByIndex('records','patientId',currentUser.id));
    showToast('✅ Record uploaded and saved!');
  };
  reader.readAsDataURL(file);
}

async function saveVitals() {
  if (!currentUser) return;
  const fields = { heartRate:_gval('v-hr'), bp:_gval('v-bp'), temp:_gval('v-temp'), sugar:_gval('v-sugar'), weight:_gval('v-weight'), spo2:_gval('v-spo2') };
  const errors = Object.entries(fields).map(([k,v]) => Validate.vitals[k]?.(v)).filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }
  const v = { patientId:currentUser.id, heartRate:Sanitize.text(fields.heartRate)||document.getElementById('stat-heartrate')?.textContent, bp:Sanitize.text(fields.bp)||document.getElementById('stat-bp')?.textContent, temp:Sanitize.text(fields.temp)||document.getElementById('stat-temp')?.textContent, sugar:Sanitize.text(fields.sugar)||document.getElementById('stat-sugar')?.textContent, weight:Sanitize.text(fields.weight)||document.getElementById('stat-weight')?.textContent, spo2:Sanitize.text(fields.spo2)||document.getElementById('stat-spo2')?.textContent, recordedAt:new Date().toISOString() };
  await DB.add('vitals', v);
  renderVitals(v);
  ['v-hr','v-bp','v-temp','v-sugar','v-weight','v-spo2'].forEach(id => _val(id,''));
  showToast('✅ Vitals saved!');
}

async function triggerSOS() {
  await DB.add('emergencies', { patientId:currentUser?.id||0, type:'SOS', location:'Hyderabad', status:'dispatched', triggeredAt:new Date().toISOString() });
  const logEl = document.getElementById('sos-log');
  if (logEl) logEl.innerHTML = `<div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:12px;padding:14px;margin-bottom:10px"><div style="font-weight:700;color:#DC2626;font-size:.88rem">🚨 SOS Triggered — ${new Date().toLocaleTimeString()}</div><div style="font-size:.78rem;color:var(--ink-light);margin-top:6px">✅ Family notified &nbsp;·&nbsp; ✅ 3 Hospitals alerted &nbsp;·&nbsp; ✅ Ambulance dispatched</div></div>` + logEl.innerHTML;
  showToast('🚨 SOS sent! Ambulance dispatched. Family notified.');
}

// ══════════════════════════════════════
// HOSPITAL DASHBOARD
// ══════════════════════════════════════
function showHPanel(id, btn) {
  document.querySelectorAll('#page-hospital .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) { document.querySelectorAll('#page-hospital .sidebar-item').forEach(s => s.classList.remove('active')); btn.classList.add('active'); }
}

function buildBedGrid() {
  const g = document.getElementById('bed-grid');
  if (!g || g.children.length) return;
  const states = ['free','occupied','occupied','free','reserved','occupied','free','occupied','occupied','free','occupied','occupied','reserved','free','occupied','free'];
  states.forEach((s,i) => {
    const b = document.createElement('div');
    b.className = `bed-cell bed-${s}`; b.textContent = 'B'+(i+1); b.title = `Bed ${i+1} — ${s}`;
    b.onclick = () => showToast(`Bed ${i+1}: ${s}`);
    g.appendChild(b);
  });
}

// ══════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════
function handleCTA(btn) {
  const inputs = btn.parentElement.querySelectorAll('input'); let ok = true;
  inputs.forEach(inp => { if (!inp.value.trim()) { inp.style.borderColor='#F87171'; setTimeout(()=>inp.style.borderColor='',2000); ok=false; } });
  if (ok) { btn.textContent='Sent ✓'; btn.style.background='#16A34A'; document.getElementById('cta-success').style.display='block'; inputs.forEach(i=>i.value=''); }
}

let currentStep = 0;
function setStep(idx, el) {
  document.querySelectorAll('.hiw-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.hiw-screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active'); document.getElementById('screen-'+idx).classList.add('active'); currentStep = idx;
}
function initHIWAutoPlay() {
  setInterval(() => {
    const steps = document.querySelectorAll('.hiw-step');
    if (!steps.length) return;
    const next = (currentStep+1) % steps.length; setStep(next, steps[next]);
  }, 3500);
}

function switchTab(type, btn) {
  document.querySelectorAll('.fw-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.fw-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active'); document.getElementById('fw-'+type).classList.add('active');
}

// ══════════════════════════════════════
// WHATSAPP CHAT
// ══════════════════════════════════════
const WA_NUMBER = '919876543210';
let waOpen = false;

function toggleChat() {
  waOpen = !waOpen;
  const chat = document.getElementById('waChat'), dot = document.getElementById('waDot');
  if (waOpen) { chat.classList.add('open'); if(dot) dot.style.display='none'; setTimeout(()=>document.getElementById('waInput')?.focus(), 400); }
  else chat.classList.remove('open');
}

function switchWaTab(tab, btn) {
  document.querySelectorAll('.wa-chat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wa-tab-content').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('wa-tab-'+tab).classList.add('active');
  closeEmojiPicker();
}

const waReplies = {
  'book an appointment':    "I can help book an appointment! 📅\nTell me:\n1. Which specialty?\n2. Preferred date?\n3. Your city?",
  'emergency sos help':     "🚨 For emergencies:\n• Press the **SOS button** in your dashboard\n• Or call **108** immediately\n\nYour location will be shared with nearest hospitals.",
  'view my health records': "📋 Your health records are in your dashboard.\n\nYou can view prescriptions, lab reports, and share with doctors.",
  'contact a doctor':       "🩺 Available doctors:\n• Dr. S. Rao — Cardiology ✅\n• Dr. P. Mehta — Ortho ✅\n• Dr. R. Gupta — General ✅\n\nWhich doctor would you like?",
  'show my health records': "Here are your latest records:\n📄 Lipid Profile — 8 Mar 2026\n🩺 Prescription — 12 Feb\n🧪 CBC Report — 10 Jan",
  'medication reminders':   "💊 Your current schedule:\n• Ecosprin 75mg — 8:00 AM ✅\n• Metoprolol 25mg — 8:00 PM ⏰\n• Atorvastatin 10mg — 10:00 PM ⏰",
  'lab reports update':     "🧪 Latest: **Lipid Profile** uploaded by Apollo Hospitals on 8 Mar 2026.\n\nView in your Health Records.",
  'doctor consultation':    "🩺 Starting consultation...\nAvailable: Dr. Rao (Cardiology), Dr. Mehta (Ortho), Dr. Gupta (General)\nWho would you like to contact?",
  'blood donor request':    "🩸 Found 3 O+ donors within 5 km of Hyderabad.\nShall I send them an alert?",
  'ambulance tracking':     "🚑 AMB-02 is 4 minutes away.\nYou'll receive live updates here.",
  'default':                "Thanks for reaching out! 😊 I'm E-Hospitee's WhatsApp assistant.\n\nI can help with:\n📅 Appointments · 📋 Records\n💊 Medications · 🚨 Emergencies\n\nWhat do you need?"
};
function getReply(msg) { const key = Object.keys(waReplies).find(k => msg.toLowerCase().includes(k)); return waReplies[key] || waReplies['default']; }

function addMessage(text, type) {
  const c = document.getElementById('waMessages'); if (!c) return;
  const now = new Date(), time = now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  const div = document.createElement('div');
  div.className = 'wa-msg wa-msg-'+type;
  div.innerHTML = text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') + `<div class="wa-msg-time">${time}${type==='out'?' <span class="wa-tick">✓✓</span>':''}</div>`;
  c.appendChild(div); c.scrollTop = c.scrollHeight;
}
function showTyping() { const c=document.getElementById('waMessages'); if(!c)return; const t=document.createElement('div'); t.className='wa-typing'; t.id='waTyping'; t.innerHTML='<span></span><span></span><span></span>'; c.appendChild(t); c.scrollTop=c.scrollHeight; }
function removeTyping() { const t=document.getElementById('waTyping'); if(t)t.remove(); }

function sendWaMessage() {
  const input = document.getElementById('waInput'); if (!input) return;
  const text = input.value.trim(); if (!text) return;
  addMessage(text, 'out'); input.value=''; input.style.height='auto'; closeEmojiPicker();
  showTyping(); setTimeout(()=>{ removeTyping(); addMessage(getReply(text),'in'); }, 900+Math.random()*600);
}
function sendQuickReply(text) {
  if (!waOpen) toggleChat();
  switchWaTab('chat', document.querySelector('.wa-chat-tab'));
  setTimeout(()=>{ addMessage(text,'out'); showTyping(); setTimeout(()=>{ removeTyping(); addMessage(getReply(text),'in'); },1000); }, waOpen?0:400);
}
function handleWaKey(e) { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendWaMessage(); } }
function autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,80)+'px'; }

const EMOJIS = ['😊','😷','💊','🏥','❤️','👨‍⚕️','🩺','🩸','🚑','😰','🤒','💉','🧬','🩻','🏃','💪','🧘','😌','🙏','✅','⚠️','📋','📅','🔔','📞','💬','👋','🤝'];
function buildEmojiGrid() {
  const g = document.getElementById('waEmojiGrid'); if (!g || g.children.length) return;
  EMOJIS.forEach(e => { const s=document.createElement('span'); s.textContent=e; s.onclick=()=>{ const i=document.getElementById('waInput'); if(i) i.value+=e; closeEmojiPicker(); i?.focus(); }; g.appendChild(s); });
}
function toggleEmojiPicker(e) { e.stopPropagation(); document.getElementById('waEmojiPicker')?.classList.toggle('open'); }
function closeEmojiPicker() { document.getElementById('waEmojiPicker')?.classList.remove('open'); }
document.addEventListener('click', closeEmojiPicker);
function openWhatsApp() { window.open(`https://wa.me/${WA_NUMBER}?text=Hi+E-Hospitee!+I+need+help.`,'_blank'); }

// ══════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
function _setHTML(id, val) { const el=document.getElementById(id); if(el) el.innerHTML=val; }
function _val(id, val)     { const el=document.getElementById(id); if(el) el.value=val; }
function _gval(id)         { const el=document.getElementById(id); return el?el.value.trim():''; }

function navScrollHandler() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', scrollY > 20);
  });
}

function initRevealObserver() {
  const obs = new IntersectionObserver(es => { es.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

function initHeroTilt() {
  const tilt = document.getElementById('tiltCard'); if (!tilt) return;
  const parent = tilt.closest('.hero-visual');
  parent.addEventListener('mousemove', e => {
    const r=tilt.getBoundingClientRect();
    const dx=(e.clientX-r.left-r.width/2)/(r.width/2), dy=(e.clientY-r.top-r.height/2)/(r.height/2);
    tilt.style.transform=`perspective(800px) rotateY(${dx*14}deg) rotateX(${-dy*10}deg) scale(1.02)`;
  });
  parent.addEventListener('mouseleave', () => { tilt.style.transform=''; });
}

function initParallax() {
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.orb').forEach((o,i) => { o.style.transform=`translateY(${scrollY*(0.08+i*0.04)}px)`; });
  });
}
