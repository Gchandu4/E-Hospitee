with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# 1. Hide fc-tag and fw-badge (Launch Feature / Phase 2)
content = content.replace(
    '.fc-tag{display:inline-block;margin-top:16px;font-size:.7rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:4px 12px;border-radius:100px;background:var(--teal-pale);color:var(--teal);border:1px solid var(--border-teal)}',
    '.fc-tag{display:none}'
)
content = content.replace(
    '.fw-badge{display:inline-block;margin-top:12px;font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:3px 10px;border-radius:100px;background:var(--teal-pale);color:var(--teal);border:1px solid var(--border-teal)}',
    '.fw-badge{display:none}'
)

# 2. Fix DB.setSession to use consistent session format with expiresAt
old_session = '''  // Session
  setSession(user, role) {
    currentUser = { ...user, role };
    localStorage.setItem(this._prefix + 'session', JSON.stringify(currentUser));
  },

  clearSession() {
    currentUser = null;
    localStorage.removeItem(this._prefix + 'session');
  }'''

new_session = '''  // Session — stored as { user, expiresAt } for consistency
  _sessionTTL: 8 * 60 * 60 * 1000,
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
  }'''

if old_session in content:
    content = content.replace(old_session, new_session)
    print('Fixed setSession')
else:
    print('setSession pattern not found')

# 3. Fix _loadSession to read new format
old_load = '''  async _loadSession() {
    const s = localStorage.getItem(this._prefix + 'session');
    if (s) {
      const session = JSON.parse(s);
      currentUser = session;
    }
  },'''

new_load = '''  async _loadSession() {
    const raw = localStorage.getItem(this._prefix + 'session');
    if (!raw) return;
    try {
      const session = JSON.parse(raw);
      if (session.user) {
        if (session.expiresAt && Date.now() > session.expiresAt) { this.clearSession(); return; }
        currentUser = session.user;
      } else {
        // Legacy flat format
        currentUser = session;
      }
    } catch { this.clearSession(); }
  },'''

if old_load in content:
    content = content.replace(old_load, new_load)
    print('Fixed _loadSession')
else:
    print('_loadSession pattern not found')

with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('Done')
