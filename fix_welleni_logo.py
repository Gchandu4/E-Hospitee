#!/usr/bin/env python3
"""
Fix Welleni logo wordmark
Change "Well" + "vell" to "Well" + "eni"
"""

def fix_logo():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Fixing Welleni logo wordmark...")
    
    # Fix the wordmark: "Well" + "vell" → "Well" + "eni"
    old_wordmark = '<span style="font-weight:500;color:#9FE1CB">Well</span><span style="font-weight:400">vell</span>'
    new_wordmark = '<span style="font-weight:500;color:#9FE1CB">Well</span><span style="font-weight:400">eni</span>'
    
    count = content.count(old_wordmark)
    content = content.replace(old_wordmark, new_wordmark)
    
    print(f"  ✓ Fixed {count} logo instances")
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Logo wordmark fixed!")
    print("   Logo now shows: Well (foam) + eni (white)")

if __name__ == '__main__':
    fix_logo()
    print("\n🎉 Welleni branding complete!")
