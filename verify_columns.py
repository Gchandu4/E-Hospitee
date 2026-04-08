import re

with open('index.html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Check patients insert columns
patients_insert = re.search(r"_sb\.from\('patients'\)\.insert\(\{([^}]+)\}", content)
if patients_insert:
    print("PATIENTS INSERT columns:")
    for line in patients_insert.group(1).split(','):
        line = line.strip()
        if line and ':' in line:
            col = line.split(':')[0].strip()
            print(f"  {col}")

print()

# Check hospitals insert columns  
hospitals_insert = re.search(r"_sb\.from\('hospitals'\)\.insert\(\{([^}]+)\}", content)
if hospitals_insert:
    print("HOSPITALS INSERT columns:")
    for line in hospitals_insert.group(1).split(','):
        line = line.strip()
        if line and ':' in line:
            col = line.split(':')[0].strip()
            print(f"  {col}")

print()

# Check medications insert
meds_insert = re.search(r"_sb\.from\('medications'\)\.insert\(\{([^}]+)\}", content)
if meds_insert:
    print("MEDICATIONS INSERT columns:")
    for line in meds_insert.group(1).split(','):
        line = line.strip()
        if line and ':' in line:
            col = line.split(':')[0].strip()
            print(f"  {col}")

print()
print("SQL schema columns:")
with open('supabase-setup.sql', 'r') as f:
    sql = f.read()
    
tables = re.findall(r'create table if not exists (\w+) \(([\s\S]*?)\);', sql)
for name, cols in tables:
    print(f"\n{name}:")
    for col in re.findall(r'"?(\w+)"?\s+\w+', cols):
        if col not in ('primary', 'default', 'unique', 'not', 'null', 'true', 'false'):
            print(f"  {col}")
