import re

# Read the file
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match use case tables
pattern = r'(###\s+\d+\.\d+\.\d+\s+.*?\n\n\| Field \| Details \|\n\|-------|---------|.*?)(?=\n\n\n---)'

def simplify_table(match):
    full_text = match.group(1)
    
    # Extract essential fields only
    id_match = re.search(r'\|\s*\*\*ID\*\*\s*\|\s*(.*?)\s*\|', full_text)
    name_match = re.search(r'\|\s*\*\*Name\*\*\s*\|\s*(.*?)\s*\|', full_text)
    desc_match = re.search(r'\|\s*\*\*Description\*\*\s*\|\s*(.*?)\s*\|', full_text)
    actors_match = re.search(r'\|\s*\*\*Actors\*\*\s*\|\s*(.*?)\s*\|', full_text)
    trigger_match = re.search(r'\|\s*\*\*Trigger\*\*\s*\|\s*(.*?)\s*\|', full_text)
    pre_match = re.search(r'\|\s*\*\*Preconditions\*\*\s*\|\s*(.*?)\s*\|', full_text)
    post_match = re.search(r'\|\s*\*\*Postconditions\*\*\s*\|\s*(.*?)\s*\|', full_text)
    
    # Get the header
    header_match = re.match(r'(###\s+\d+\.\d+\.\d+\s+.*?)\n', full_text)
    header = header_match.group(1) if header_match else ""
    
    # Clean up preconditions and postconditions (remove bullet points and join)
    def clean_conditions(text):
        if not text:
            return ""
        # Remove HTML breaks and bullet points
        text = re.sub(r'<br>', '; ', text)
        text = re.sub(r'\u2022\s*', '', text)
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    preconditions = clean_conditions(pre_match.group(1) if pre_match else "")
    postconditions = clean_conditions(post_match.group(1) if post_match else "")
    
    # Build simplified table
    simplified = f"""{header}

| Field | Details |
|-------|---------|
| **ID** | {id_match.group(1) if id_match else ""} |
| **Name** | {name_match.group(1) if name_match else ""} |
| **Description** | {desc_match.group(1) if desc_match else ""} |
| **Actors** | {actors_match.group(1) if actors_match else ""} |
| **Trigger** | {trigger_match.group(1) if trigger_match else ""} |
| **Preconditions** | {preconditions} |
| **Postconditions** | {postconditions} |"""

    return simplified

# Replace all use case tables
content_new = re.sub(pattern, simplify_table, content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\gaurt\Downloads\11Planner\DESIGN_SECTION_4.md', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("Simplified all use case tables successfully!")
