with open('ehospitee-js.js', 'rb') as f:
    raw = f.read()

# The file contains UTF-8 bytes that were re-encoded as latin-1
# Fix: decode as latin-1, then encode as latin-1 bytes, then decode as UTF-8
try:
    text = raw.decode('latin-1')
    # Re-encode as latin-1 to get original bytes, then decode as UTF-8
    fixed = text.encode('latin-1').decode('utf-8')
    print('Fixed via latin-1 -> utf-8 re-decode')
except Exception as e:
    print(f'Method 1 failed: {e}')
    fixed = raw.decode('utf-8', errors='replace')

with open('ehospitee-js.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(fixed)

# Verify
with open('ehospitee-js.js', 'r', encoding='utf-8') as f:
    content = f.read()

if 'Registration failed' in content and 'â' not in content:
    print('SUCCESS: encoding is clean')
elif 'â' in content:
    print('STILL CORRUPTED')
else:
    print('File written')
