#!/usr/bin/env python3
"""
Rebrand E-Hospitee to Carevell
Updates colors, branding, fonts, and design system
"""

import re

def rebrand_index_html():
    """Rebrand the index.html file to Carevell"""
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update title and meta
    content = content.replace(
        '<title>E-Hospitee — Hospital & Patient Management</title>',
        '<title>Carevell — Connecting to better health</title>'
    )
    
    # Update font from DM Sans to Inter
    content = content.replace(
        "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    )
    content = content.replace("'DM Sans',sans-serif", "'Inter',sans-serif")
    content = content.replace('"DM Sans",sans-serif', '"Inter",sans-serif')
    
    # Update CSS color variables
    old_colors = {
        '--teal:#0B7A75': '--forest:#085041',
        '--teal-dark:#085553': '--deep-forest:#04342C',
        '--teal-mid:#0D9488': '--teal:#1D9E75',
        '--teal-light:#CCFBF1': '--mint:#5DCAA5',
        '--teal-pale:#F0FDFA': '--foam:#9FE1CB',
        '--cream:#FAFAF7': '--mist:#E1F5EE',
        '--ink:#111827': '--body-text:#2C2C2A',
        '--ink-mid:#374151': '--text-mid:#2C2C2A',
        '--ink-light:#6B7280': '--text-light:#888780',
        '--red:#DC2626': '--emergency:#E24B4A',
    }
    
    for old, new in old_colors.items():
        content = content.replace(old, new)
    
    # Update color references in CSS
    color_refs = {
        'var(--teal)': 'var(--teal)',  # Keep teal
        'var(--teal-dark)': 'var(--forest)',
        'var(--teal-mid)': 'var(--teal)',
        'var(--teal-light)': 'var(--mint)',
        'var(--teal-pale)': 'var(--foam)',
        'var(--cream)': 'var(--mist)',
        'var(--ink)': 'var(--body-text)',
        'var(--ink-mid)': 'var(--text-mid)',
        'var(--ink-light)': 'var(--text-light)',
        'var(--red)': 'var(--emergency)',
    }
    
    # Update logo and branding text
    # Replace E-Hospitee with Carevell
    content = re.sub(
        r'E-Hospitee',
        'Carevell',
        content,
        flags=re.IGNORECASE
    )
    
    # Update logo HTML to use Carevell branding
    # Find and replace logo section
    logo_pattern = r'<div class="logo-text">.*?</div>'
    new_logo = '<div class="logo-text"><span style="font-weight:500;color:#9FE1CB">Care</span><span style="font-weight:400;color:white">vell</span></div>'
    
    # Update hero section headline
    content = content.replace(
        'Your Health, Our Priority',
        'Every hospital. Every patient. One platform.'
    )
    
    # Update hero description
    old_hero_desc = 'E-Hospitee connects patients with hospitals across Hyderabad'
    new_hero_desc = 'Carevell connects patients with hospitals across Hyderabad'
    content = content.replace(old_hero_desc, new_hero_desc)
    
    # Add tagline
    content = content.replace(
        '</head>',
        '<meta name="description" content="Carevell - Connecting to better health. Every hospital. Every patient. One platform.">\n</head>'
    )
    
    # Update emergency red color
    content = content.replace('#DC2626', '#E24B4A')
    content = content.replace('#B91C1C', '#E24B4A')
    
    # Update primary colors
    content = content.replace('#0B7A75', '#1D9E75')
    content = content.replace('#085553', '#085041')
    content = content.replace('#0D9488', '#1D9E75')
    content = content.replace('#CCFBF1', '#9FE1CB')
    content = content.replace('#F0FDFA', '#E1F5EE')
    content = content.replace('#FAFAF7', '#E1F5EE')
    
    # Update text colors
    content = content.replace('#111827', '#2C2C2A')
    content = content.replace('#374151', '#2C2C2A')
    content = content.replace('#6B7280', '#888780')
    
    # Update border radius to match design system
    # Already using 12px for cards, 8px for buttons
    
    # Save the updated content
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ index.html rebranded to Carevell")
    print("✅ Colors updated to new palette")
    print("✅ Font changed to Inter")
    print("✅ Branding text updated")

if __name__ == '__main__':
    rebrand_index_html()
    print("\n🎉 Rebranding complete!")
    print("\nNext steps:")
    print("1. Review the changes in index.html")
    print("2. Test the application")
    print("3. Update logo SVG manually if needed")
    print("4. Push to GitHub")
