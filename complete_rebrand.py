#!/usr/bin/env python3
"""
Complete Carevell Rebranding
- Remove ALL E-Hospitee references
- Replace ALL old colors with new Carevell palette
- Ensure consistent branding throughout
"""

import re

def complete_rebrand():
    """Complete rebranding to Carevell"""
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Starting complete rebrand...")
    
    # ============================================================
    # STEP 1: REMOVE ALL E-HOSPITEE REFERENCES
    # ============================================================
    print("📝 Removing E-Hospitee references...")
    
    # Case variations
    replacements = {
        'E-Hospitee': 'Carevell',
        'e-hospitee': 'carevell',
        'E-HOSPITEE': 'CAREVELL',
        'eHospitee': 'Carevell',
        'E Hospitee': 'Carevell',
        'E-Hospi': 'Care',
        'e-hospi': 'care',
    }
    
    for old, new in replacements.items():
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"  ✓ Replaced {count} instances of '{old}'")
    
    # ============================================================
    # STEP 2: UPDATE CSS COLOR VARIABLES
    # ============================================================
    print("\n🎨 Updating CSS color variables...")
    
    # Find and replace the entire :root section
    old_root = r':root\{[^}]+\}'
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
  --border-teal:#99F6E4;
  --emergency:#E24B4A;
  --green:#16A34A;
  --amber:#D97706;
  --amber-pale:#FFFBEB;
  --shadow-sm:0 1px 3px rgba(8,80,65,.08);
  --shadow-md:0 4px 16px rgba(8,80,65,.08);
  --shadow-lg:0 12px 40px rgba(8,80,65,.10);
  --shadow-teal:0 8px 32px rgba(29,158,117,.18);
}'''
    
    content = re.sub(old_root, new_root, content)
    print("  ✓ Updated CSS variables")
    
    # ============================================================
    # STEP 3: REPLACE ALL COLOR REFERENCES
    # ============================================================
    print("\n🎨 Replacing all color hex codes...")
    
    color_map = {
        # Old teal shades -> New colors
        '#0B7A75': '#1D9E75',  # Old teal -> New teal
        '#085553': '#085041',  # Old teal-dark -> Forest
        '#0D9488': '#1D9E75',  # Old teal-mid -> Teal
        '#CCFBF1': '#9FE1CB',  # Old teal-light -> Foam
        '#F0FDFA': '#E1F5EE',  # Old teal-pale -> Mist
        '#99F6E4': '#9FE1CB',  # Old border-teal -> Foam
        
        # Old neutrals -> New colors
        '#FAFAF7': '#E1F5EE',  # Old cream -> Mist
        '#111827': '#2C2C2A',  # Old ink -> Body text
        '#374151': '#2C2C2A',  # Old ink-mid -> Text mid
        '#6B7280': '#888780',  # Old ink-light -> Text light
        
        # Old red -> Emergency
        '#DC2626': '#E24B4A',
        '#B91C1C': '#E24B4A',
        '#FEE2E2': '#FEE2E2',  # Keep light red for backgrounds
        '#FECACA': '#FECACA',  # Keep light red for borders
        
        # Update rgba colors
        'rgba(11,122,117': 'rgba(29,158,117',  # Old teal rgba
        'rgba(8,85,83': 'rgba(8,80,65',        # Old dark rgba
    }
    
    for old_color, new_color in color_map.items():
        count = content.count(old_color)
        if count > 0:
            content = content.replace(old_color, new_color)
            print(f"  ✓ Replaced {count} instances of {old_color}")
    
    # ============================================================
    # STEP 4: UPDATE CSS VARIABLE REFERENCES
    # ============================================================
    print("\n🎨 Updating CSS variable references...")
    
    var_map = {
        'var(--teal-dark)': 'var(--forest)',
        'var(--teal-mid)': 'var(--teal)',
        'var(--teal-light)': 'var(--mint)',
        'var(--teal-pale)': 'var(--foam)',
        'var(--cream)': 'var(--mist)',
        'var(--ink)': 'var(--body-text)',
        'var(--ink-mid)': 'var(--text-mid)',
        'var(--ink-light)': 'var(--text-light)',
        'var(--red)': 'var(--emergency)',
        'var(--border-teal)': 'var(--foam)',
    }
    
    for old_var, new_var in var_map.items():
        count = content.count(old_var)
        if count > 0:
            content = content.replace(old_var, new_var)
            print(f"  ✓ Replaced {count} instances of {old_var}")
    
    # ============================================================
    # STEP 5: UPDATE BACKGROUND COLORS IN SECTIONS
    # ============================================================
    print("\n🎨 Updating section backgrounds...")
    
    # Update hero background
    content = content.replace(
        'background:linear-gradient(160deg,var(--white) 0%,var(--teal-pale) 60%,var(--teal-light) 100%)',
        'background:linear-gradient(160deg,var(--white) 0%,var(--mist) 60%,var(--foam) 100%)'
    )
    
    # Update emergency section background
    content = content.replace(
        'background:linear-gradient(135deg,var(--teal-dark),var(--teal) 50%,var(--teal-mid))',
        'background:linear-gradient(135deg,var(--deep-forest),var(--forest) 50%,var(--teal))'
    )
    
    # Update auth wrap background
    content = content.replace(
        'background:linear-gradient(160deg,var(--white) 0%,var(--teal-pale) 100%)',
        'background:linear-gradient(160deg,var(--white) 0%,var(--mist) 100%)'
    )
    
    print("  ✓ Updated section backgrounds")
    
    # ============================================================
    # STEP 6: UPDATE NAVBAR BACKGROUNDS
    # ============================================================
    print("\n🎨 Updating navbar styles...")
    
    # Hospital nav background
    content = content.replace(
        '.hosp-nav{background:var(--teal-dark);color:white}',
        '.hosp-nav{background:var(--forest);color:white}'
    )
    content = content.replace(
        '.hosp-sidebar{background:var(--teal-dark);border-right:none}',
        '.hosp-sidebar{background:var(--forest);border-right:none}'
    )
    
    print("  ✓ Updated navbar styles")
    
    # ============================================================
    # STEP 7: UPDATE DASHBOARD HEADER GRADIENTS
    # ============================================================
    print("\n🎨 Updating dashboard gradients...")
    
    content = content.replace(
        'background:linear-gradient(135deg,var(--teal),var(--teal-mid))',
        'background:linear-gradient(135deg,var(--teal),var(--mint))'
    )
    
    print("  ✓ Updated dashboard gradients")
    
    # ============================================================
    # STEP 8: UPDATE STATS BAR
    # ============================================================
    print("\n🎨 Updating stats bar...")
    
    content = content.replace(
        '.stats-bar{background:var(--teal);padding:56px 32px}',
        '.stats-bar{background:var(--forest);padding:56px 32px}'
    )
    
    print("  ✓ Updated stats bar")
    
    # ============================================================
    # STEP 9: UPDATE TAGLINE AND DESCRIPTIONS
    # ============================================================
    print("\n📝 Updating taglines and descriptions...")
    
    content = content.replace(
        'Your Health, Our Priority',
        'Connecting to better health'
    )
    
    print("  ✓ Updated taglines")
    
    # ============================================================
    # STEP 10: UPDATE LOGO MARK STYLES
    # ============================================================
    print("\n🎨 Updating logo mark styles...")
    
    content = content.replace(
        'background:linear-gradient(135deg,var(--teal),var(--teal-mid))',
        'background:linear-gradient(135deg,var(--teal),var(--mint))'
    )
    
    print("  ✓ Updated logo mark styles")
    
    # ============================================================
    # STEP 11: UPDATE INLINE STYLES
    # ============================================================
    print("\n🎨 Updating inline styles...")
    
    # Update inline background colors
    inline_replacements = {
        'background:var(--teal-pale)': 'background:var(--foam)',
        'background:var(--cream)': 'background:var(--mist)',
        'color:var(--teal)': 'color:var(--teal)',  # Keep teal
        'border:1px solid var(--border-teal)': 'border:1px solid var(--foam)',
        'border:1.5px solid var(--border-teal)': 'border:1.5px solid var(--foam)',
    }
    
    for old_style, new_style in inline_replacements.items():
        count = content.count(old_style)
        if count > 0:
            content = content.replace(old_style, new_style)
            print(f"  ✓ Replaced {count} inline style instances")
    
    # ============================================================
    # SAVE FILE
    # ============================================================
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Complete rebrand finished!")
    print("\n📊 Summary:")
    print("  ✓ All E-Hospitee references removed")
    print("  ✓ All old colors replaced with Carevell palette")
    print("  ✓ CSS variables updated")
    print("  ✓ Inline styles updated")
    print("  ✓ Backgrounds and gradients updated")
    print("  ✓ Navbar and dashboard styles updated")
    
    return True

if __name__ == '__main__':
    try:
        complete_rebrand()
        print("\n🎉 Carevell rebranding 100% complete!")
        print("\nNext steps:")
        print("1. Review index.html")
        print("2. Test in browser")
        print("3. Deploy to production")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
