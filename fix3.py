with open('ehospitee-js.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

fixed = []
for line in lines:
    # Replace all known corrupted sequences with clean ASCII equivalents
    line = line.replace('\u00e2\u009c\u0085', 'OK')
    line = line.replace('\u00e2\u009a\u00a0\u00ef\u00b8\u008f', 'Warning:')
    line = line.replace('\u00e2\u0086\u0092', '->')
    line = line.replace('\u00e2\u0095\u0090', '=')
    line = line.replace('\u00e2\u0094\u0080', '-')
    line = line.replace('\u00e2\u0080\u0094', '-')
    line = line.replace('\u00e2\u0080\u0099', "'")
    # Also handle the raw corrupted bytes showing as replacement chars
    line = line.replace('\ufffd', '')
    # Handle specific patterns seen in the file
    line = line.replace('â\x9c\x85', 'OK')
    line = line.replace('â\x9a \xef\xb8\x8f', 'Warning:')
    line = line.replace('â\x86\x92', '->')
    line = line.replace('â\x95\x90', '=')
    line = line.replace('â\x94\x80', '-')
    fixed.append(line)

with open('ehospitee-js.js', 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(fixed)

# Check result
with open('ehospitee-js.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_chars = [c for c in content if ord(c) > 127 and c not in '✅⚠️→═─—''""🏥🩺💊🚑😊😷❤️👨‍⚕️🩸😰🤒💉🧬🩻🏃💪🧘😌🙏📋📅🔔📞💬👋🤝🎯📍👨‍👩‍👧']
print(f'Remaining non-ASCII chars: {len(bad_chars)}')
if bad_chars[:5]:
    print('Sample:', [hex(ord(c)) for c in bad_chars[:5]])
