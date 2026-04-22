#!/usr/bin/env python3
"""
Restore Original E-Hospitee Colors
Change back from Carevell/Welleni colors to original teal scheme
"""

def restore_colors():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Restoring original E-Hospitee colors...")
    
    # Restore original CSS variables
    old_root = ''':root{
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
    
    new_root = ''':root{
  --teal:#0B7A75;
  --teal-dark:#085553;
  --teal-mid:#0D9488;
  --teal-light:#CCFBF1;
  --teal-pale:#F0FDFA;
  --amber:#D97706;
  --amber-pale:#FFFBEB;
  --cream:#FAFAF7;
  --white:#FFFFFF;
  --ink:#111827;
  --ink-mid:#374151;
  --ink-light:#6B7280;
  --border:#E5E7EB;
  --border-teal:#99F6E4;
  --red:#DC2626;
  --green:#16A34A;
  --shadow-sm:0 1px 3px rgba(0,0,0,.08);
  --shadow-md:0 4px 16px rgba(0,0,0,.08);
  --shadow-lg:0 12px 40px rgba(0,0,0,.10);
  --shadow-teal:0 8px 32px rgba(11,122,117,.18);
}'''
    
    if old_root in content:
        content = content.replace(old_root, new_root)
        print("  ✓ CSS variables restored")
    
    # Restore body font and colors
    content = content.replace(
        "body{font-family:'Inter',sans-serif;background:var(--white);color:var(--body-text);overflow-x:hidden;line-height:1.6}",
        "body{font-family:'Inter',sans-serif;background:var(--white);color:var(--ink);overflow-x:hidden;line-height:1.6}"
    )
    
    # Restore scrollbar
    content = content.replace(
        "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--mist)}::-webkit-scrollbar-thumb{background:var(--foam);border-radius:3px}",
        "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--cream)}::-webkit-scrollbar-thumb{background:var(--teal-light);border-radius:3px}"
    )
    
    # Restore color references
    var_map = {
        'var(--forest)': 'var(--teal-dark)',
        'var(--deep-forest)': 'var(--teal-dark)',
        'var(--mint)': 'var(--teal-light)',
        'var(--foam)': 'var(--teal-pale)',
        'var(--mist)': 'var(--cream)',
        'var(--body-text)': 'var(--ink)',
        'var(--text-mid)': 'var(--ink-mid)',
        'var(--text-light)': 'var(--ink-light)',
        'var(--emergency)': 'var(--red)',
    }
    
    for new_var, old_var in var_map.items():
        count = content.count(new_var)
        if count > 0:
            content = content.replace(new_var, old_var)
            print(f"  ✓ Replaced {count} instances of {new_var}")
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Original colors restored!")
    print("📊 E-Hospitee teal color scheme is back")

if __name__ == '__main__':
    try:
        restore_colors()
        print("\n🎉 Color restoration complete!")
        print("\nNext steps:")
        print("1. Review index.html")
        print("2. Deploy: git add . && git commit -m 'Restore original colors' && git push")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
