with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find the register page block
reg_start = content.find('<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n     PAGE: REGISTER')
reg_end = content.find('</div><!-- /page-register -->', reg_start) + len('</div><!-- /page-register -->')
login_start = content.find('<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n     PAGE: LOGIN')
login_end = content.find('</div><!-- /page-login -->', login_start) + len('</div><!-- /page-login -->')

print(f'Register: {reg_start} to {reg_end}')
print(f'Login: {login_start} to {login_end}')
print('OK')
