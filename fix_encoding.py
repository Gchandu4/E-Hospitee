import re

with open('ehospitee-js.js', 'rb') as f:
    raw = f.read()

# The file was saved as latin-1 but contains UTF-8 sequences
# Re-decode correctly
try:
    text = raw.decode('utf-8')
except:
    text = raw.decode('latin-1')

# Fix mojibake (UTF-8 bytes interpreted as latin-1)
fixes = [
    ('\u00e2\u009c\u0085', 'OK'),           # ✅
    ('\u00e2\u009a\u00a0\u00ef\u00b8\u008f', 'Warning:'),  # ⚠️
    ('\u00e2\u0086\u0092', '->'),            # →
    ('\u00e2\u0095\u0090', '='),             # ═
    ('\u00e2\u0094\u0080', '-'),             # ─
    ('\u00e2\u0080\u0094', '-'),             # —
    ('\u00e2\u0080\u0099', "'"),             # '
    ('\u00e2\u0080\u009c', '"'),             # "
    ('\u00e2\u0080\u009d', '"'),             # "
]

for old, new in fixes:
    text = text.replace(old, new)

with open('ehospitee-js.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print('Done - encoding fixed')
