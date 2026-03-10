import re

# Read the file
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove empty tables (tables with empty ID fields)
empty_table_pattern = r'\| Field \| Details \|\n\|-------|---------||\n\| \*\*ID\*\* \|  \|\n\| \*\*Name\*\* \|  \|\n\| \*\*Description\*\* \|  \|\n\| \*\*Actors\*\* \|  \|\n\| \*\*Trigger\*\* \|  \|\n\| \*\*Preconditions\*\* \|  \|\n\| \*\*Postconditions\*\* \|  \|\n\n'

content = re.sub(empty_table_pattern, '', content)

# Clean up any double empty lines
content = re.sub(r'\n\n\n+', '\n\n\n', content)

# Fix any missing section headers (if UC headers are gone)
# Add back section headers before tables

# Simplify postconditions - remove redundant lists
def simplify_conditions(match):
    text = match.group(1)
    # Replace semicolons with 'and'
    text = text.replace('; ', ' and ')
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return f"| **Postconditions** | {text} |"

content = re.sub(r'\| \*\*Postconditions\*\* \| (.*?) \|', simplify_conditions, content)

# Same for preconditions
def simplify_preconditions(match):
    text = match.group(1)
    text = text.replace('; ', ' and ')
    text = re.sub(r'\s+', ' ', text).strip()
    return f"| **Preconditions** | {text} |"

content = re.sub(r'\| \*\*Preconditions\*\* \| (.*?) \|', simplify_preconditions, content)

# Write back
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned up the file successfully!")
