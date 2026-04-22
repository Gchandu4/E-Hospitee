#!/usr/bin/env python3
"""
Rebrand Carevell to Welleni
Replace all instances throughout the website
"""

import re

def rebrand_to_welleni():
    """Replace all Carevell references with Welleni"""
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Rebranding Carevell to Welleni...")
    
    # Replace all variations of Carevell
    replacements = {
        'Carevell': 'Welleni',
        'carevell': 'welleni',
        'CAREVELL': 'WELLENI',
        'Care': 'Well',
        'care': 'well',
    }
    
    total_changes = 0
    for old, new in replacements.items():
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"  ✓ Replaced {count} instances of '{old}' with '{new}'")
            total_changes += count
    
    # Update the logo wordmark styling
    # Change "Care" color to keep the same styling but with "Well"
    # The wordmark will now be: "Well" (font-weight 500, #9FE1CB) + "eni" (font-weight 400, white)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Rebranding complete!")
    print(f"📊 Total changes: {total_changes}")
    print("\n🎉 Carevell → Welleni transformation finished!")

if __name__ == '__main__':
    try:
        rebrand_to_welleni()
        print("\nNext steps:")
        print("1. Review index.html")
        print("2. Test in browser")
        print("3. Deploy: git add . && git commit -m 'Rebrand to Welleni' && git push")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
