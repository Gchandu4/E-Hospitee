import re

new_styles = """<style>
/* Loading state */
.form-btn { display: flex; align-items: center; justify-content: center; gap: 8px; }
.form-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none !important; }
.btn-spinner { display: none; width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0; }
.form-btn.loading .btn-spinner { display: block; }
@keyframes spin { to { transform: rotate(360deg); } }
.form-control.error { border-color: #EF4444 !important; background: #FFF5F5; }
.form-control.error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.12) !important; }
.field-error { font-size: .74rem; color: #EF4444; margin-top: 5px; display: none; font-weight: 500; }
.field-error.show { display: block; }
.pw-wrap { position: relative; }
.pw-wrap .form-control { padding-right: 46px; }
.pw-toggle { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ink-light); font-size: .82rem; padding: 4px 2px; line-height: 1; transition: color .2s; }
.pw-toggle:hover { color: var(--teal); }
.pw-strength { height: 4px; border-radius: 3px; margin-top: 8px; background: var(--border); overflow: hidden; }
.pw-strength-bar { height: 100%; border-radius: 3px; transition: width .3s ease, background .3s ease; width: 0; }
.pw-strength-label { font-size: .72rem; color: var(--ink-light); margin-top: 4px; font-weight: 500; }
.auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 88px 20px 48px; background: linear-gradient(145deg, #f0fdfa 0%, #ffffff 45%, #f0fdfa 100%); position: relative; overflow: hidden; }
.auth-wrap::before { content: ''; position: absolute; top: -180px; right: -180px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, rgba(11,122,117,.09), transparent 70%); pointer-events: none; }
.auth-wrap::after { content: ''; position: absolute; bottom: -120px; left: -120px; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(11,122,117,.06), transparent 70%); pointer-events: none; }
.auth-card { background: #ffffff; border-radius: 24px; box-shadow: 0 8px 40px rgba(11,122,117,.10), 0 2px 8px rgba(0,0,0,.06); border: 1px solid rgba(11,122,117,.1); padding: 44px 48px; width: 100%; max-width: 500px; position: relative; z-index: 1; animation: cardIn .4s ease both; }
@keyframes cardIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
.auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
.auth-title { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 800; color: var(--ink); margin-bottom: 6px; letter-spacing: -.02em; }
.auth-sub { font-size: .88rem; color: var(--ink-light); margin-bottom: 28px; line-height: 1.6; }
.role-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.role-card { padding: 18px 14px; border: 1.5px solid var(--border); border-radius: 14px; cursor: pointer; transition: all .22s; text-align: center; }
.role-card:hover { border-color: var(--teal); background: var(--teal-pale); transform: translateY(-2px); }
.role-card.selected { border-color: var(--teal); background: var(--teal-pale); box-shadow: 0 0 0 3px rgba(11,122,117,.12); }
.role-card-icon { font-size: 1.9rem; margin-bottom: 8px; }
.role-card-title { font-weight: 700; font-size: .88rem; color: var(--ink); }
.role-card-sub { font-size: .72rem; color: var(--ink-light); margin-top: 3px; line-height: 1.4; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: .8rem; font-weight: 600; color: var(--ink-mid); margin-bottom: 7px; letter-spacing: .01em; }
.form-control { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: .9rem; color: var(--ink); background: var(--white); outline: none; transition: border-color .2s, box-shadow .2s, background .2s; box-sizing: border-box; }
.form-control::placeholder { color: #9CA3AF; }
.form-control:hover:not(:focus) { border-color: #C4C9D4; }
.form-control:focus { border-color: var(--teal); box-shadow: 0 0 0 3.5px rgba(11,122,117,.1); background: #fafffe; }
select.form-control { cursor: pointer; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-btn { width: 100%; padding: 14px 20px; border-radius: 12px; background: linear-gradient(135deg, #0B7A75, #0D9488); color: white; border: none; font-family: 'DM Sans', sans-serif; font-size: .95rem; font-weight: 700; cursor: pointer; letter-spacing: .01em; box-shadow: 0 4px 16px rgba(11,122,117,.3); transition: all .25s; margin-top: 6px; }
.form-btn:hover:not(:disabled) { background: linear-gradient(135deg, #085553, #0B7A75); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,122,117,.38); }
.form-btn:active:not(:disabled) { transform: translateY(0); }
.auth-switch { text-align: center; margin-top: 22px; font-size: .85rem; color: var(--ink-light); }
.auth-switch a { color: var(--teal); font-weight: 600; text-decoration: none; }
.auth-switch a:hover { text-decoration: underline; }
@media (max-width: 540px) { .auth-card { padding: 32px 22px; border-radius: 20px; } .auth-title { font-size: 1.5rem; } .form-row { grid-template-columns: 1fr; gap: 0; } .role-cards { gap: 10px; } }
</style>"""

with open('ehospitee-register.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace everything between <style> and </style> in head
content = re.sub(r'<style>.*?</style>', new_styles, content, flags=re.DOTALL, count=1)

with open('ehospitee-register.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print('Done')
