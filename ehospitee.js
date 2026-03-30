// ══════════════════════════════════════
// E-HOSPITEE — app.js
// ══════════════════════════════════════

// ── HTTPS ENFORCEMENT ──
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https:' + location.href.substring(location.protocol.length));
}

// ── SUPABASE CONFIG ──
// The anon key is safe to expose in frontend — security is enforced via Supabase Row Level Security (RLS)
const SUPABASE_URL = 'https://ajscgpuozcyqsteseppp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc2NncHVvemN5cXN0ZXNlcHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTk2NDIsImV4cCI6MjA5MDQzNTY0Mn0.NAZG-ZdcwJGHN-SLscKb2MeUIJ52GBOiNmxlBPqGeHg';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    fetch: async (url, options = {}) => {
      try {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500) {
          SecureLogger.error('supabase_api_error', { url, status: res.status });
        }
        return res;
      } catch (err) {
        SecureLogger.error('supabase_network_error', { url, message: err.message });
        throw err;
      }
    }
  }
});

// ── SECURE LOGGER ──
// Logs auth events, API errors, and anomalies to Supabase audit_logs table
// Falls back to console in dev. Never logs passwords or sensitive PII.
const SecureLogger = {
  _isDev: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
  _queue: [],
  _flushing: false,

  _sanitize(data) {
    // Strip any accidental sensitive fields before logging
    const { password, token, key, secret, ...safe } = data || {};
    return safe;
  },

  async _flush() {
    if (this._flushing || this._queue.length === 0) return;
    this._flushing = true;
    const batch = this._queue.splice(0, 10);
    try {
      await _sb.from('audit_logs').insert(batch);
    } catch {
      // Silently fail — logging must never break the app
    }
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

  // Detect and log anomalous patterns
  anomaly(event, data = {}) {
    this._log('warn', `ANOMALY:${event}`, data);
  }
};

// ── INPUT VALIDATION & SANITIZATION ──
const Sanitize = {
  // Escape HTML special chars — prevents XSS in innerHTML rendering
  html(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  // Strip all HTML tags — for plain text fields stored in DB
  text(str) {
    if (str == null) return '';
    return String(str).replace(/<[^>]*>/g, '').trim().slice(0, 500);
  },
  // Allow only safe filename characters
  filename(str) {
    if (str == null) return 'upload';
    return String(str).replace(/[^a-zA-Z0-9._\-]/g, '_').slice(0, 100);
  }
};

const Validate = {
  // Returns error string or null if valid
  name(val, label = 'Name') {
    if (!val || val.trim().length < 1) return `${label} is required`;
    if (val.trim().length > 100) return `${label} must be under 100 characters`;
    if (/<|>|script|javascript/i.test(val)) return `${label} contains invalid characters`;
    return null;
  },
  email(val) {
    if (!val || !val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Invalid email format';
    if (val.length > 254) return 'Email too long';
    return null;
  },
  mobile(val) {
    if (!val || !val.trim()) return null; // optional
    const digits = val.replace(/[\s\-\+\(\)]/g, '');
    if (!/^\d{7,15}$/.test(digits)) return 'Invalid mobile number';
    return null;
  },
  date(val) {
    if (!val) return null; // optional
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
  text(val, label = 'Field', maxLen = 500) {
    if (!val || !val.trim()) return null; // optional
    if (val.length > maxLen) return `${label} must be under ${maxLen} characters`;
    if (/<script|javascript:|on\w+\s*=/i.test(val)) return `${label} contains invalid content`;
    return null;
  },
  vitals: {
    heartRate: v => !v || /^\d{1,3}\s*(bpm)?$/i.test(v.trim()) ? null : 'Invalid heart rate (e.g. 72 bpm)',
    bp:        v => !v || /^\d{2,3}\/\d{2,3}$/.test(v.trim()) ? null : 'Invalid BP (e.g. 120/80)',
    temp:      v => !v || /^\d{2,3}(\.\d)?\s*°?[CF]?$/i.test(v.trim()) ? null : 'Invalid temperature (e.g. 36.8°C)',
    sugar:     v => !v || /^\d{2,3}\s*(mg\/dL)?$/i.test(v.trim()) ? null : 'Invalid blood sugar (e.g. 98 mg/dL)',
    weight:    v => !v || /^\d{2,3}(\.\d)?\s*(kg|lbs)?$/i.test(v.trim()) ? null : 'Invalid weight (e.g. 72 kg)',
    spo2:      v => !v || /^\d{2,3}\s*%?$/.test(v.trim()) ? null : 'Invalid SpO2 (e.g. 98%)',
  },
  file(file) {
    const ALLOWED_TYPES = ['application/pdf','image/jpeg','image/png','image/jpg'];
    const MAX_SIZE_MB = 5;
    if (!file) return 'No file selected';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF, JPG, and PNG files are allowed';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB`;
    return null;
  },
  chatMessage(val) {
    if (!val || !val.trim()) return 'Message cannot be empty';
    if (val.length > 500) return 'Message too long (max 500 characters)';
    return null;
  }
};

// ── ABUSE PROTECTION: Per-action rate limiting ──
const ActionLimit = {
  _limits: {},
  // key: action name, max: max calls, windowMs: time window
  check(key, max, windowMs) {
    const now = Date.now();
    const state = this._limits[key] || { count: 0, firstAt: now };
    if (now - state.firstAt > windowMs) {
      this._limits[key] = { count: 1, firstAt: now };
      return { allowed: true };
    }
    if (state.count >= max) {
      const remaining = Math.ceil((windowMs - (now - state.firstAt)) / 1000);
      SecureLogger.anomaly('action_rate_limit', { key, count: state.count });
      return { allowed: false, remaining };
    }
    this._limits[key] = { count: state.count + 1, firstAt: state.firstAt };
    return { allowed: true };
  }
};

// ── BOT DETECTION: Honeypot + timing check ──
const BotDetect = {
  _loadTime: Date.now(),
  // Returns true if submission looks like a bot
  check(honeypotFieldId) {
    // Honeypot: if a hidden field has a value, it's a bot
    const hp = document.getElementById(honeypotFieldId);
    if (hp && hp.value) {
      SecureLogger.anomaly('bot_honeypot_triggered', { field: honeypotFieldId });
      return true;
    }
    // Timing: real humans take > 2 seconds to fill a form
    if (Date.now() - this._loadTime < 2000) {
      SecureLogger.anomaly('bot_timing_check', { elapsed: Date.now() - this._loadTime });
      return true;
    }
    return false;
  }
};

// ── SECURITY: Password hashing via Web Crypto API (SHA-256 + salt) ──
const Auth = {
  async hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2,'0')).join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(saltHex + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    return `${saltHex}:${hashHex}`;
  },
  async verifyPassword(password, stored) {
    if (!stored) return false;
    if (!stored.includes(':')) return stored === password;
    const [saltHex, storedHash] = stored.split(':');
    if (!saltHex || !storedHash) return false;
    const encoder = new TextEncoder();
    const data = encoder.encode(saltHex + password);
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

// ── SECURITY: Rate limiting for login attempts ──
const RateLimit = {
  _key: 'ehospitee_login_attempts',
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

  // Tables where rows belong to a patient via patientId column
  _patientTables: new Set(['appointments','records','medications','vitals','emergencies']),

  async init() {
    await this._loadSession();
  },

  // Throws if the current user doesn't own the row
  _assertOwner(row) {
    if (!currentUser) throw new Error('Not authenticated');
    if (this._patientTables.has(row._table || '') && row.patientId !== currentUser.id) {
      throw new Error('Access denied: you do not own this resource');
    }
  },

  /* ── Core CRUD ── */
  async add(table, data) {
    // Enforce patientId matches current user for patient-owned tables
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
    // Scope to current user for patient-owned tables
    if (this._patientTables.has(table)) {
      if (!currentUser) throw new Error('Not authenticated');
      query.eq('patientId', currentUser.id);
    }
    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  async getAll(table) {
    // For patient tables, always scope to current user
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
    // Enforce ownership: only update rows that belong to current user
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
    // Enforce ownership on delete
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
    // If querying by patientId, enforce it matches the logged-in user
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

  /* ── Session ── */
  // SESSION_TTL: 8 hours
  _sessionTTL: 8 * 60 * 60 * 1000,

  setSession(user, role) {
    // Never store password in session
    const { password: _omit, ...safeUser } = user;
    currentUser = { ...safeUser, role };
    const session = {
      user: currentUser,
      expiresAt: Date.now() + this._sessionTTL
    };
    localStorage.setItem(this._prefix + 'session', JSON.stringify(session));
  },

  async _loadSession() {
    const raw = localStorage.getItem(this._prefix + 'session');
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        // Session expired — clear it
        this.clearSession();
        return;
      }
      currentUser = session.user;
    } catch {
      this.clearSession();
    }
  },

  clearSession() {
    currentUser = null;
    localStorage.removeItem(this._prefix + 'session');
  }
};

let currentUser = null;
DB.init().catch(e => console.error('DB init failed:', e));

// ══════════════════════════════════════
// PAGE NAVIGATION
// ══════════════════════════════════════
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
  initPage(id);
}

function initPage(id) {
  if (id === 'page-landing') {
    setTimeout(() => {
      const obs = new IntersectionObserver(es => {
        es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: .12 });
      document.querySelectorAll('#page-landing .reveal').forEach(el => obs.observe(el));
    }, 100);
  }
  if (id === 'page-hospital') buildBedGrid();
}

// ══════════════════════════════════════
// AUTH — REGISTRATION
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

  // Bot detection
  if (BotDetect.check('reg-honeypot')) {
    btn.textContent = 'Create Account →'; btn.disabled = false;
    return;
  }
  // Abuse protection: max 3 registrations per 10 minutes
  const limit = ActionLimit.check('register', 3, 10 * 60 * 1000);
  if (!limit.allowed) {
    showToast(`⚠️ Too many attempts. Try again in ${limit.remaining}s.`);
    btn.textContent = 'Create Account →'; btn.disabled = false;
    return;
  }

  try {
    if (selectedRole === 'patient') {
      const inputs = document.querySelectorAll('#reg-patient-form input, #reg-patient-form select');
      const [firstName, lastName, mobile, email, dob, bloodGroup, password, confirmPw] = [...inputs].map(i => i.value.trim());

      const errors = [
        Validate.name(firstName, 'First name'),
        Validate.name(lastName, 'Last name'),
        Validate.email(email),
        Validate.mobile(mobile),
        Validate.date(dob),
        Validate.bloodGroup(bloodGroup),
      ].filter(Boolean);
      if (errors.length) { showToast('⚠️ ' + errors[0]); btn.textContent = 'Create Account →'; btn.disabled = false; return; }
      if (!password) { showToast('⚠️ Password is required'); btn.textContent = 'Create Account →'; btn.disabled = false; return; }
      if (password !== confirmPw) { showToast('⚠️ Passwords do not match'); btn.textContent = 'Create Account →'; btn.disabled = false; return; }

      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast('⚠️ ' + pwError); btn.textContent = 'Create Account →'; btn.disabled = false; return; }
      if (await DB.findByEmail('patients', email)) { showToast('⚠️ Email already registered'); btn.textContent = 'Create Account →'; btn.disabled = false; return; }

      const hashedPassword = await Auth.hashPassword(password);
      const user = await DB.add('patients', {
        firstName: Sanitize.text(firstName),
        lastName:  Sanitize.text(lastName),
        mobile:    Sanitize.text(mobile),
        email:     email.toLowerCase().trim(),
        dob, bloodGroup,
        password: hashedPassword,
        allergies: '', emergencyContact: '',
        createdAt: new Date().toISOString()
      });
      DB.setSession(user, 'patient');
      SecureLogger.info('register_success', { type: 'patient', email });
      await loadPatientDash(user);
      showToast('✅ Account created successfully!');
      setTimeout(() => goPage('page-patient'), 800);

    } else {
      const inputs = document.querySelectorAll('#reg-hospital-form input');
      const [name, regNo, city, pincode, contactPerson, email, phone, password] = [...inputs].map(i => i.value.trim());

      const errors = [
        Validate.name(name, 'Hospital name'),
        Validate.email(email),
        Validate.mobile(phone),
      ].filter(Boolean);
      if (errors.length) { showToast('⚠️ ' + errors[0]); btn.textContent = 'Create Account →'; btn.disabled = false; return; }
      if (!password) { showToast('⚠️ Password is required'); btn.textContent = 'Create Account →'; btn.disabled = false; return; }

      const pwError = Auth.validatePassword(password);
      if (pwError) { showToast('⚠️ ' + pwError); btn.textContent = 'Create Account →'; btn.disabled = false; return; }
      if (await DB.findByEmail('hospitals', email)) { showToast('⚠️ Email already registered'); btn.textContent = 'Create Account →'; btn.disabled = false; return; }

      const hashedPassword = await Auth.hashPassword(password);
      const hosp = await DB.add('hospitals', {
        name: Sanitize.text(name),
        regNo: Sanitize.text(regNo),
        city: Sanitize.text(city),
        pincode: Sanitize.text(pincode),
        contactPerson: Sanitize.text(contactPerson),
        email: email.toLowerCase().trim(),
        phone: Sanitize.text(phone),
        password: hashedPassword,
        createdAt: new Date().toISOString()
      });
      DB.setSession(hosp, 'hospital');
      SecureLogger.info('register_success', { type: 'hospital', email });
      showToast('✅ Hospital account created!');
      setTimeout(() => goPage('page-hospital'), 800);
    }
  } catch(e) {
    SecureLogger.error('register_error', { message: e.message });
    showToast('⚠️ Registration failed. Try again.');
    console.error(e);
  }
  btn.textContent = 'Create Account →'; btn.disabled = false;
}

// ══════════════════════════════════════
// AUTH — LOGIN
// ══════════════════════════════════════
function switchLoginTab(type, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-patient').style.display  = type === 'patient'  ? 'block' : 'none';
  document.getElementById('login-hospital').style.display = type === 'hospital' ? 'block' : 'none';
}

async function handleLogin(type) {
  // Demo logins bypass rate limiting
  if (type === 'demo-patient') {
    const user = await DB.findByEmail('patients', 'rajesh@demo.com');
    if (user) { DB.setSession(user, 'patient'); await loadPatientDash(user); goPage('page-patient'); }
    return;
  }
  if (type === 'demo-hospital') {
    const hosp = await DB.findByEmail('hospitals', 'admin@apollo.com');
    if (hosp) { DB.setSession(hosp, 'hospital'); goPage('page-hospital'); }
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
    const id = document.getElementById('login-id').value.trim();
    const pw = document.getElementById('login-pw').value.trim();
    if (!id || !pw) { showToast('⚠️ Please enter your credentials'); return; }

    const user = await DB.findByEmail('patients', id) ||
      (await DB.getAll('patients')).find(u => u.mobile === id);

    if (!user || !(await Auth.verifyPassword(pw, user.password))) {
      RateLimit.record();
      SecureLogger.warn('login_failed', { identifier: id, type: 'patient' });
      showToast('⚠️ Invalid credentials');
      return;
    }
    RateLimit.reset();
    SecureLogger.info('login_success', { userId: user.id, type: 'patient' });
    DB.setSession(user, 'patient');
    await loadPatientDash(user);
    goPage('page-patient');
    return;
  }

  if (type === 'hospital') {
    const id = document.getElementById('hosp-login-id').value.trim();
    const pw = document.getElementById('hosp-login-pw').value.trim();
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
    DB.setSession(hosp, 'hospital');
    goPage('page-hospital');
  }
}

function signOut() { SecureLogger.info('logout', {}); DB.clearSession(); goPage('page-landing'); }

// ══════════════════════════════════════
// PATIENT DASHBOARD — LOAD & RENDER
// ══════════════════════════════════════
async function loadPatientDash(user) {
  document.getElementById('patient-name').textContent = user.firstName;
  document.getElementById('sidebar-patient-name').textContent = user.firstName + ' ' + (user.lastName || '');
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
  const row = a => `
    <div class="appt-row">
      <div class="appt-avatar2">🩺</div>
      <div class="appt-info">
        <div class="appt-doc">${Sanitize.html(a.doctor)} — ${Sanitize.html(a.specialty)}</div>
        <div class="appt-spec">${Sanitize.html(a.hospital)} · ${Sanitize.html(a.date)} · ${Sanitize.html(a.time)}</div>
      </div>
      <span class="status-badge status-${Sanitize.html(a.status)}">${Sanitize.html(a.status.charAt(0).toUpperCase()+a.status.slice(1))}</span>
    </div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No appointments found</div>';

  _setHTML('overview-upcoming', upcoming.length ? upcoming.map(row).join('') : empty);
  _setHTML('appt-upcoming',     upcoming.length ? upcoming.map(row).join('') : empty);
  _setHTML('appt-past',         past.length     ? past.map(row).join('')     : empty);
  _setHTML('stat-upcoming',     upcoming.length);
}

function renderRecords(recs) {
  const icons = { lab:'🧪', prescription:'🩺', report:'📄', summary:'📋', upload:'📁' };
  const item = r => `
    <div class="record-item">
      <div class="record-icon">${icons[r.type] || '📄'}</div>
      <div><div class="record-name">${Sanitize.html(r.name)}</div><div class="record-date">${Sanitize.html(r.hospital)} · ${Sanitize.html(r.date)}</div></div>
      <button class="record-btn" onclick="showToast('Opening record...')">View</button>
    </div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No records found</div>';

  _setHTML('records-list',    recs.length ? recs.map(item).join('') : empty);
  _setHTML('overview-records', recs.slice(0, 2).map(item).join(''));
  _setHTML('stat-records',    recs.length);
}

function renderMedications(meds) {
  const active = meds.filter(m => m.active);
  const item = m => `
    <div class="med-item">
      <div class="med-icon">💊</div>
      <div>
        <div class="med-name">${Sanitize.html(m.name)}</div>
        <div class="med-dose">${Sanitize.html(m.dose)} · ${Sanitize.html(m.frequency)} · By ${Sanitize.html(m.prescribedBy)}</div>
      </div>
      <div class="med-time">${Sanitize.html(m.time)}</div>
    </div>`;
  const empty = '<div style="color:var(--ink-light);font-size:.85rem;padding:12px 0">No active medications</div>';

  _setHTML('medications-list', active.length ? active.map(item).join('') : empty);
  _setHTML('overview-meds',    active.length ? active.map(item).join('') : empty);
  _setHTML('stat-meds',        active.length);
}

function renderVitals(v) {
  const map = {
    'stat-heartrate': v.heartRate, 'stat-bp': v.bp, 'stat-temp': v.temp,
    'stat-sugar': v.sugar, 'stat-weight': v.weight, 'stat-spo2': v.spo2
  };
  Object.entries(map).forEach(([id, val]) => _setHTML(id, Sanitize.html(val)));
}

function populateProfileForm(user) {
  _val('prof-fname',     user.firstName    || '');
  _val('prof-lname',     user.lastName     || '');
  _val('prof-dob',       user.dob          || '');
  _val('prof-blood',     user.bloodGroup   || '');
  _val('prof-mobile',    user.mobile       || '');
  _val('prof-email',     user.email        || '');
  _val('prof-allergies', user.allergies    || '');
  _val('prof-emergency', user.emergencyContact || '');
}

// ── Patient panel actions ──
function showPanel(id, btn) {
  document.querySelectorAll('#page-patient .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) {
    document.querySelectorAll('#page-patient .sidebar-item').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
  }
}

async function saveProfile() {
  if (!currentUser || currentUser.role !== 'patient') return;

  const firstName = _gval('prof-fname'), lastName = _gval('prof-lname'),
        email = _gval('prof-email'), mobile = _gval('prof-mobile');

  const errors = [
    Validate.name(firstName, 'First name'),
    Validate.name(lastName, 'Last name'),
    Validate.email(email),
    Validate.mobile(mobile),
  ].filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }

  const updated = {
    ...currentUser,
    id: currentUser.id,
    patientId: currentUser.id,
    firstName:        Sanitize.text(firstName),
    lastName:         Sanitize.text(lastName),
    dob:              _gval('prof-dob'),
    bloodGroup:       _gval('prof-blood'),
    mobile:           Sanitize.text(mobile),
    email:            email.toLowerCase().trim(),
    allergies:        Sanitize.text(_gval('prof-allergies')),
    emergencyContact: Sanitize.text(_gval('prof-emergency')),
  };
  await DB.put('patients', updated);
  DB.setSession(updated, 'patient');
  _setHTML('patient-name', Sanitize.html(updated.firstName));
  _setHTML('sidebar-patient-name', Sanitize.html(updated.firstName) + ' ' + Sanitize.html(updated.lastName));
  showToast('✅ Profile saved to database!');
}

async function bookAppointment(doctor, specialty, hospital, fee) {
  if (!currentUser || currentUser.role !== 'patient') { showToast('Please login first'); return; }
  const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  await DB.add('appointments', {
    patientId: currentUser.id, doctor, specialty, hospital,
    date, time: '10:30 AM', status: 'upcoming', fee,
    createdAt: new Date().toISOString()
  });
  renderAppointments(await DB.getByIndex('appointments', 'patientId', currentUser.id));
  showToast(`✅ Appointment booked with ${doctor}!`);
}

async function addMedication() {
  if (!currentUser) return;
  const name = _gval('new-med-name'), dose = _gval('new-med-dose'),
        freq = _gval('new-med-freq'), time = _gval('new-med-time');
  if (!name) { showToast('⚠️ Enter medication name'); return; }

  const errors = [
    Validate.text(name, 'Medication name', 100),
    Validate.text(dose, 'Dose', 100),
    Validate.text(freq, 'Frequency', 100),
    Validate.text(time, 'Time', 50),
  ].filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }

  // Abuse: max 20 medications per 10 minutes
  const limit = ActionLimit.check('add_medication', 20, 10 * 60 * 1000);
  if (!limit.allowed) { showToast(`⚠️ Too many requests. Wait ${limit.remaining}s.`); return; }

  await DB.add('medications', {
    patientId: currentUser.id,
    name: Sanitize.text(name),
    dose: Sanitize.text(dose),
    frequency: Sanitize.text(freq),
    time: Sanitize.text(time),
    prescribedBy: 'Self', active: true, createdAt: new Date().toISOString()
  });
  ['new-med-name','new-med-dose','new-med-freq','new-med-time'].forEach(id => _val(id, ''));
  renderMedications(await DB.getByIndex('medications', 'patientId', currentUser.id));
  showToast('✅ Medication saved to database!');
}

async function uploadRecord(input) {
  if (!currentUser || !input.files[0]) return;
  const file = input.files[0];

  const fileError = Validate.file(file);
  if (fileError) { showToast('⚠️ ' + fileError); input.value = ''; return; }

  // Abuse: max 10 uploads per hour
  const limit = ActionLimit.check('upload_record', 10, 60 * 60 * 1000);
  if (!limit.allowed) { showToast(`⚠️ Upload limit reached. Wait ${limit.remaining}s.`); return; }

  const safeName = Sanitize.filename(file.name);
  const reader = new FileReader();
  reader.onload = async e => {
    await DB.add('records', {
      patientId: currentUser.id,
      name: safeName,
      type: 'upload',
      hospital: 'Self Upload',
      date: new Date().toISOString().split('T')[0],
      fileData: e.target.result,
      createdAt: new Date().toISOString()
    });
    renderRecords(await DB.getByIndex('records', 'patientId', currentUser.id));
    showToast('✅ Record uploaded and saved!');
  };
  reader.readAsDataURL(file);
}

async function saveVitals() {
  if (!currentUser) return;
  const fields = {
    heartRate: _gval('v-hr'), bp: _gval('v-bp'), temp: _gval('v-temp'),
    sugar: _gval('v-sugar'), weight: _gval('v-weight'), spo2: _gval('v-spo2')
  };
  const errors = Object.entries(fields)
    .map(([k, v]) => Validate.vitals[k]?.(v))
    .filter(Boolean);
  if (errors.length) { showToast('⚠️ ' + errors[0]); return; }

  const v = {
    patientId: currentUser.id,
    heartRate: Sanitize.text(fields.heartRate) || document.getElementById('stat-heartrate').textContent,
    bp:        Sanitize.text(fields.bp)        || document.getElementById('stat-bp').textContent,
    temp:      Sanitize.text(fields.temp)      || document.getElementById('stat-temp').textContent,
    sugar:     Sanitize.text(fields.sugar)     || document.getElementById('stat-sugar').textContent,
    weight:    Sanitize.text(fields.weight)    || document.getElementById('stat-weight').textContent,
    spo2:      Sanitize.text(fields.spo2)      || document.getElementById('stat-spo2').textContent,
    recordedAt: new Date().toISOString()
  };
  await DB.add('vitals', v);
  renderVitals(v);
  ['v-hr','v-bp','v-temp','v-sugar','v-weight','v-spo2'].forEach(id => _val(id, ''));
  showToast('✅ Vitals saved to database!');
}

async function triggerSOS() {
  await DB.add('emergencies', {
    patientId: currentUser?.id || 0, type: 'SOS', location: 'Hyderabad',
    status: 'dispatched', triggeredAt: new Date().toISOString()
  });
  const logEl = document.getElementById('sos-log');
  if (logEl) {
    logEl.innerHTML = `
      <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="font-weight:700;color:#DC2626;font-size:.88rem">🚨 SOS Triggered — ${new Date().toLocaleTimeString()}</div>
        <div style="font-size:.78rem;color:var(--ink-light);margin-top:6px">
          ✅ Family notified &nbsp;·&nbsp; ✅ 3 Hospitals alerted &nbsp;·&nbsp; ✅ Ambulance dispatched<br>
          📍 Location shared automatically
        </div>
      </div>` + logEl.innerHTML;
  }
  showToast('🚨 SOS sent! Ambulance dispatched. Family notified.');
}

// ══════════════════════════════════════
// HOSPITAL DASHBOARD
// ══════════════════════════════════════
function showHPanel(id, btn) {
  document.querySelectorAll('#page-hospital .dash-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (btn) {
    document.querySelectorAll('#page-hospital .sidebar-item').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
  }
}

function buildBedGrid() {
  const g = document.getElementById('bed-grid');
  if (!g || g.children.length) return;
  const states = ['free','occupied','occupied','free','reserved','occupied','free','occupied',
                  'occupied','free','occupied','occupied','reserved','free','occupied','free'];
  states.forEach((s, i) => {
    const b = document.createElement('div');
    b.className = `bed-cell bed-${s}`;
    b.textContent = 'B' + (i + 1);
    b.title = `Bed ${i + 1} — ${s}`;
    b.onclick = () => showToast(`Bed ${i + 1}: ${s}`);
    g.appendChild(b);
  });
}

// ══════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════
function handleCTA(btn) {
  const inputs = btn.parentElement.querySelectorAll('input');
  let ok = true;
  inputs.forEach(inp => {
    if (!inp.value.trim()) {
      inp.style.borderColor = '#F87171';
      setTimeout(() => inp.style.borderColor = '', 2000);
      ok = false;
    }
  });
  if (ok) {
    btn.textContent = 'Sent ✓'; btn.style.background = '#16A34A';
    document.getElementById('cta-success').style.display = 'block';
    inputs.forEach(i => i.value = '');
  }
}

let currentStep = 0;
function setStep(idx, el) {
  document.querySelectorAll('#page-landing .hiw-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#page-landing .hiw-screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('screen-' + idx).classList.add('active');
  currentStep = idx;
}
setInterval(() => {
  const steps = document.querySelectorAll('#page-landing .hiw-step');
  if (!steps.length) return;
  const next = (currentStep + 1) % steps.length;
  setStep(next, steps[next]);
}, 3500);

function switchTab(type, btn) {
  document.querySelectorAll('.fw-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.fw-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fw-' + type).classList.add('active');
}

// ══════════════════════════════════════
// WHATSAPP CHAT
// ══════════════════════════════════════
const WA_NUMBER = '919876543210';
let waOpen = false;

function toggleChat() {
  waOpen = !waOpen;
  const chat = document.getElementById('waChat');
  const dot  = document.getElementById('waDot');
  if (waOpen) {
    chat.classList.add('open');
    dot.style.display = 'none';
    setTimeout(() => document.getElementById('waInput').focus(), 400);
  } else {
    chat.classList.remove('open');
  }
}

function switchWaTab(tab, btn) {
  document.querySelectorAll('.wa-chat-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wa-tab-content').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('wa-tab-' + tab).classList.add('active');
  closeEmojiPicker();
}

const waReplies = {
  'book an appointment':    "I can help you book an appointment! 📅\nTell me:\n1. Which specialty?\n2. Preferred date & time?\n3. Your city?\n\nOr click 'Book Appointment' to go directly.",
  'emergency sos help':     "🚨 For emergencies:\n• Press the **SOS button** in your dashboard\n• Or call **108** immediately\n\nYour location will be shared with nearest hospitals automatically.",
  'view my health records': "📋 Your health records are securely stored in your dashboard.\n\nI can help you:\n• View prescriptions\n• Access lab reports\n• Share records with doctors",
  'contact a doctor':       "🩺 To contact a doctor:\n1. Log in to your dashboard\n2. Go to Appointments\n3. Select your doctor\n\nWould you like me to connect you now?",
  'show my health records': "Here are your latest records:\n📄 Lipid Profile — 8 Mar 2026\n🩺 Prescription Dr. Rao — 12 Feb\n🧪 CBC Report — 10 Jan\n\nType the record name to view details.",
  'medication reminders':   "💊 Your current schedule:\n• Ecosprin 75mg — 8:00 AM ✅\n• Metoprolol 25mg — 8:00 PM ⏰\n• Atorvastatin 10mg — 10:00 PM ⏰",
  'lab reports update':     "🧪 Your latest: **Lipid Profile** uploaded by Apollo Hospitals on 8 Mar 2026.\n\nTap 'View' in your Health Records to access the full report.",
  'doctor consultation':    "🩺 Available now:\n• Dr. S. Rao — Cardiology ✅\n• Dr. P. Mehta — Ortho ✅\n• Dr. R. Gupta — General ✅\n\nWhich doctor would you like to contact?",
  'blood donor request':    "🩸 Found 3 O+ donors within 5 km of Hyderabad.\n\nShall I send them an alert? They'll be notified on WhatsApp.",
  'ambulance tracking':     "🚑 Live ambulance tracking activated!\n\nAMB-02 is 4 minutes away.\nYou'll receive live updates here.",
  'default':                "Thanks for reaching out! 😊 I'm the E-Hospitee WhatsApp assistant.\n\nI can help with:\n📅 Appointments · 📋 Records\n💊 Medications · 🚨 Emergencies\n🩺 Doctor consultation\n\nWhat do you need help with?"
};

function getReply(msg) {
  const key = Object.keys(waReplies).find(k => msg.toLowerCase().includes(k));
  return waReplies[key] || waReplies['default'];
}

function addMessage(text, type) {
  const container = document.getElementById('waMessages');
  const now  = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  const div  = document.createElement('div');
  div.className = 'wa-msg wa-msg-' + type;
  // Sanitize user text before rendering — prevents XSS
  const safeText = type === 'out'
    ? Sanitize.html(text).replace(/\n/g, '<br>')
    : text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.innerHTML = safeText
    + `<div class="wa-msg-time">${time}${type === 'out' ? ' <span class="wa-tick">✓✓</span>' : ''}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function sendWaMessage() {
  const input = document.getElementById('waInput');
  const text  = input.value.trim();

  const msgError = Validate.chatMessage(text);
  if (msgError) { showToast('⚠️ ' + msgError); return; }

  // Abuse: max 30 messages per minute
  const limit = ActionLimit.check('chat_message', 30, 60 * 1000);
  if (!limit.allowed) { showToast(`⚠️ Slow down! Wait ${limit.remaining}s.`); return; }

  addMessage(text, 'out');
  input.value = ''; input.style.height = 'auto';
  closeEmojiPicker();
  showTyping();
  setTimeout(() => { removeTyping(); addMessage(getReply(text), 'in'); }, 900 + Math.random() * 600);
}
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
  const text  = input.value.trim();
  if (!text) return;
  addMessage(text, 'out');
  input.value = ''; input.style.height = 'auto';
  closeEmojiPicker();
  showTyping();
  setTimeout(() => { removeTyping(); addMessage(getReply(text), 'in'); }, 900 + Math.random() * 600);
}

function sendQuickReply(text) {
  if (!waOpen) toggleChat();
  switchWaTab('chat', document.querySelector('.wa-chat-tab'));
  setTimeout(() => {
    addMessage(text, 'out');
    showTyping();
    setTimeout(() => { removeTyping(); addMessage(getReply(text), 'in'); }, 1000);
  }, waOpen ? 0 : 400);
}

function handleWaKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendWaMessage(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }

const EMOJIS = ['😊','😷','💊','🏥','❤️','👨‍⚕️','🩺','🩸','🚑','😰','🤒','💉','🧬','🩻','🏃','💪','🧘','😌','🙏','✅','⚠️','📋','📅','🔔','📞','💬','👋','🤝'];

function buildEmojiGrid() {
  const g = document.getElementById('waEmojiGrid');
  EMOJIS.forEach(e => {
    const s = document.createElement('span');
    s.textContent = e;
    s.onclick = () => {
      document.getElementById('waInput').value += e;
      closeEmojiPicker();
      document.getElementById('waInput').focus();
    };
    g.appendChild(s);
  });
}

function toggleEmojiPicker(e) { e.stopPropagation(); document.getElementById('waEmojiPicker').classList.toggle('open'); }
function closeEmojiPicker()    { document.getElementById('waEmojiPicker').classList.remove('open'); }
document.addEventListener('click', closeEmojiPicker);

function openWhatsApp() {
  window.open(`https://wa.me/${WA_NUMBER}?text=Hi+E-Hospitee!+I+need+help.`, '_blank');
}

// ══════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function _setHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML = val; }
function _val(id, val)     { const el = document.getElementById(id); if (el) el.value = val; }
function _gval(id)         { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ── Nav scroll ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', scrollY > 20);
});

// ── 3D Hero Tilt ──
const tilt = document.getElementById('tiltCard');
if (tilt) {
  const parent = tilt.closest('.hero-visual');
  parent.addEventListener('mousemove', e => {
    const r  = tilt.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    tilt.style.transform = `perspective(800px) rotateY(${dx * 14}deg) rotateX(${-dy * 10}deg) scale(1.02)`;
  });
  parent.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
}

// ── Parallax orbs ──
window.addEventListener('scroll', () => {
  document.querySelectorAll('.orb').forEach((o, i) => {
    o.style.transform = `translateY(${scrollY * (0.08 + i * 0.04)}px)`;
  });
});

// ── Initial reveal observer ──
setTimeout(() => {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  buildEmojiGrid();
}, 200);
