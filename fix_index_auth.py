with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find and replace the login function
old_login_start = '// \u2500\u2500 LOGIN (DB-connected) \u2500\u2500'
old_login_end = '\nasync function loadPatientDash(user) {'

start = content.find(old_login_start)
end = content.find(old_login_end)

if start == -1:
    # Try alternate search
    start = content.find('// \u2014\u2014 LOGIN (DB-connected)')
    print(f'Alternate search: {start}')

print(f'Login function found at: {start} to {end}')

if start > 0 and end > 0:
    new_login = '''// -- LOGIN (Supabase direct) --
async function handleLogin(type) {
  async function verifyPw(pw, stored) {
    if (!stored) return false;
    if (!stored.includes(':')) return stored === pw;
    const [saltHex, storedHash] = stored.split(':');
    const data = new TextEncoder().encode(saltHex + pw);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    return hex === storedHash;
  }
  if (type === 'demo-patient') {
    const { data: user } = await _sb.from('patients').select('*').eq('email', 'rajesh@demo.com').maybeSingle();
    if (user) { const { password: _o, ...u } = user; DB.setSession(u, 'patient'); goPage('page-patient'); loadPatientDash(u); }
    else showToast('Demo account not found. Please register first.');
    return;
  }
  if (type === 'demo-hospital') {
    const { data: hosp } = await _sb.from('hospitals').select('*').eq('email', 'admin@apollo.com').maybeSingle();
    if (hosp) { const { password: _o, ...h } = hosp; DB.setSession(h, 'hospital'); goPage('page-hospital'); }
    else showToast('Demo account not found. Please register first.');
    return;
  }
  if (type === 'patient') {
    const id = document.getElementById('login-id').value.trim();
    const pw = document.getElementById('login-pw').value.trim();
    if (!id || !pw) { showToast('Please enter your credentials'); return; }
    const btn = document.getElementById('patient-login-btn');
    if (btn) { btn.style.opacity='0.7'; btn.textContent='Signing in...'; }
    try {
      let { data: user } = await _sb.from('patients').select('*').eq('email', id.toLowerCase()).maybeSingle();
      if (!user) { const r = await _sb.from('patients').select('*').eq('mobile', id).maybeSingle(); user = r.data; }
      if (!user || !(await verifyPw(pw, user.password))) { showToast('Invalid credentials'); return; }
      const { password: _o, ...safeUser } = user;
      DB.setSession(safeUser, 'patient');
      goPage('page-patient');
      loadPatientDash(safeUser);
    } catch(e) { showToast('Login error: ' + e.message); console.error(e); }
    finally { if (btn) { btn.style.opacity='1'; btn.textContent='Sign In as Patient'; } }
    return;
  }
  if (type === 'hospital') {
    const id = document.getElementById('hosp-login-id').value.trim();
    const pw = document.getElementById('hosp-login-pw').value.trim();
    if (!id || !pw) { showToast('Please enter your credentials'); return; }
    try {
      const { data: hosp } = await _sb.from('hospitals').select('*').eq('email', id.toLowerCase()).maybeSingle();
      if (!hosp || !(await verifyPw(pw, hosp.password))) { showToast('Invalid credentials'); return; }
      const { password: _o, ...safeHosp } = hosp;
      DB.setSession(safeHosp, 'hospital');
      goPage('page-hospital');
    } catch(e) { showToast('Login error: ' + e.message); console.error(e); }
  }
}
'''
    content = content[:start] + new_login + content[end:]
    print('Login function replaced successfully')
else:
    print('ERROR: Could not find login function boundaries')

with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('Done')
