#!/usr/bin/env python3
"""
Update all logos in index.html to Carevell hexagon branding
"""

import re

def update_all_logos():
    """Update all logo instances to Carevell branding"""
    
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern 1: Logo with emoji in nav
    old_logo_1 = r'<div class="logo-mark">🏥</div><span class="logo-text">E-Hospi<span>tee</span></span>'
    new_logo_1 = '<svg viewBox="0 0 64 70" style="width:36px;height:40px"><polygon points="32,4 58,18 58,52 32,66 6,52 6,18" fill="#1D9E75"/><rect x="28" y="22" width="8" height="26" rx="3" fill="white"/><rect x="19" y="31" width="26" height="8" rx="3" fill="white"/></svg><span class="logo-text"><span style="font-weight:500;color:#9FE1CB">Care</span><span style="font-weight:400">vell</span></span>'
    
    content = re.sub(old_logo_1, new_logo_1, content)
    
    # Pattern 2: Larger logo in auth pages
    old_logo_2 = r'<div class="logo-mark" style="width:44px;height:44px;font-size:1\.3rem">🏥</div><span class="logo-text" style="font-size:1\.7rem">E-Hospi<span>tee</span></span>'
    new_logo_2 = '<svg viewBox="0 0 64 70" style="width:44px;height:50px"><polygon points="32,4 58,18 58,52 32,66 6,52 6,18" fill="#1D9E75"/><rect x="28" y="22" width="8" height="26" rx="3" fill="white"/><rect x="19" y="31" width="26" height="8" rx="3" fill="white"/></svg><span class="logo-text" style="font-size:1.7rem"><span style="font-weight:500;color:#9FE1CB">Care</span><span style="font-weight:400">vell</span></span>'
    
    content = re.sub(old_logo_2, new_logo_2, content)
    
    # Update any remaining E-Hospitee references
    content = content.replace('E-Hospitee', 'Carevell')
    content = content.replace('E-Hospi', 'Care')
    content = content.replace('e-hospitee', 'carevell')
    
    # Update tagline references
    content = content.replace('Your Health, Our Priority', 'Connecting to better health')
    
    # Save
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ All logos updated to Carevell hexagon")
    print("✅ Branding text updated")

if __name__ == '__main__':
    update_all_logos()
    print("\n🎉 Logo update complete!")
