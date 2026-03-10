import re

# Read the file
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix table headers with extra pipes at the end
content = content.replace('|-------|---------||', '|-------|---------|')

# Write back
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed table formatting!")
