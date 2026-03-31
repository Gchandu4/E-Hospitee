with open('ehospitee.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix the broken setSession + duplicate findByEmail block
old = '''  async findByEmail(table, email) {
    const { data, error } = await _sb.from(table).select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  /* \u2500\u2500 Session \u2500\u2500 */
  // SESSION_TTL: 8 hours
  _sessionTTL: 8 * 60 * 60 * 1000,

  setSession(user, role) {
    // Never store password in session
    const { password: _omit, ...safeUser } = user;
    currentUser = { ...safeUser, role };
    const session = {
  async findByEmail(table, email) {
    const { data, error } = await _sb.from(table).select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async findByMobile(table, mobile) {
    const { data, error } = await _sb.from(table).select('*').eq('mobile', mobile).maybeSingle();
    if (error) throw error;
    return data || null;
  },'''

new = '''  async findByEmail(table, email) {
    const { data, error } = await _sb.from(table).select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },
  async findByMobile(table, mobile) {
    const { data, error } = await _sb.from(table).select('*').eq('mobile', mobile).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  /* Session */
  _sessionTTL: 8 * 60 * 60 * 1000,

  setSession(user, role) {
    const { password: _omit, ...safeUser } = user;
    currentUser = { ...safeUser, role };
    const session = {
      user: currentUser,
      expiresAt: Date.now() + this._sessionTTL
    };
    localStorage.setItem(this._prefix + 'session', JSON.stringify(session));
  },'''

if old in content:
    content = content.replace(old, new)
    print('Fixed setSession + duplicate findByEmail')
else:
    print('Pattern not found - trying alternate search')
    # Find the broken section by markers
    start = content.find('  setSession(user, role) {\n    // Never store password in session')
    end = content.find('\n  async findByMobile', start)
    end2 = content.find('\n\n\n', end)
    if start > 0 and end > 0:
        broken = content[start:end2]
        print(f'Found broken section ({len(broken)} chars):')
        print(broken[:200])
    else:
        print(f'start={start}, end={end}')

with open('ehospitee.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('Done')
