#!/usr/bin/env python3
"""
Fix CSS variables directly
"""

def fix_css_variables():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and replace the :root section
    old_root = ''':root{
  --teal:#0B7A75;--teal-dark:#085553;--teal-mid:#0D9488;
  --teal-light:#CCFBF1;--teal-pale:#F0FDFA;
  --amber:#D97706;--amber-pale:#FFFBEB;
  --cream:#FAFAF7;--white:#FFFFFF;
  --ink:#111827;--ink-mid:#374151;--ink-light:#6B7280;
  --border:#E5E7EB;--border-teal:#99F6E4;
  --red:#DC2626;--green:#16A34A;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08);
  --shadow-md:0 4px 16px rgba(0,0,0,.08);
  --shadow-lg:0 12px 40px rgba(0,0,0,.10);
  --shadow-teal:0 8px 32px rgba(11,122,117,.18);
}'''
    
    new_root = ''':root{
  --forest:#085041;
  --deep-forest:#04342C;
  --teal:#1D9E75;
  --mint:#5DCAA5;
  --foam:#9FE1CB;
  --mist:#E1F5EE;
  --white:#FFFFFF;
  --body-text:#2C2C2A;
  --text-mid:#2C2C2A;
  --text-light:#888780;
  --border:#E5E7EB;
  --emergency:#E24B4A;
  --green:#16A34A;
  --amber:#D97706;
  --amber-pale:#FFFBEB;
  --shadow-sm:0 1px 3px rgba(8,80,65,.08);
  --shadow-md:0 4px 16px rgba(8,80,65,.08);
  --shadow-lg:0 12px 40px rgba(8,80,65,.10);
  --shadow-teal:0 8px 32px rgba(29,158,117,.18);
}'''
    
    if old_root in content:
        content = content.replace(old_root, new_root)
        print("✅ CSS variables updated")
    else:
        print("⚠️  Old CSS variables not found")
    
    # Fix body font
    content = content.replace(
        "body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);overflow-x:hidden;line-height:1.6}",
        "body{font-family:'Inter',sans-serif;background:var(--white);color:var(--body-text);overflow-x:hidden;line-height:1.6}"
    )
    print("✅ Body font updated to Inter")
    
    # Fix scrollbar
    content = content.replace(
        "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--cream)}::-webkit-scrollbar-thumb{background:var(--teal-light);border-radius:3px}",
        "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--mist)}::-webkit-scrollbar-thumb{background:var(--foam);border-radius:3px}"
    )
    print("✅ Scrollbar colors updated")
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n🎉 CSS variables fixed!")

if __name__ == '__main__':
    fix_css_variables()
