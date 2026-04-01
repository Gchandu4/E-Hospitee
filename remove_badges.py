import re

with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Remove all fc-tag and fw-badge span elements
content = re.sub(r'<span class="fc-tag">[^<]*</span>', '', content)
content = re.sub(r'<span class="fw-badge">[^<]*</span>', '', content)

with open('index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

# Verify
remaining = content.count('fc-tag') + content.count('fw-badge')
print(f'Remaining badge elements in HTML: {remaining} (should be 2 - just the CSS rules)')
