with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find register page boundaries
reg_start = content.find('<div id="page-register" class="page">')
reg_end = content.find('\n\n<!-- \u2550', reg_start)  # next page comment
if reg_end == -1:
    reg_end = content.find('<div id="page-login"', reg_start)

# Find login page boundaries  
login_start = content.find('<div id="page-login" class="page">')
login_end = content.find('\n\n<!-- \u2550', login_start)
if login_end == -1:
    login_end = content.find('<div id="page-patient"', login_start)

print(f'Register block: {reg_start} to {reg_end}')
print(f'Login block: {login_start} to {login_end}')
print(f'Register snippet: {repr(content[reg_start:reg_start+80])}')
print(f'Login snippet: {repr(content[login_start:login_start+80])}')
