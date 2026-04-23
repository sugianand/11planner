#!/usr/bin/env python3
import re

with open('backend/app/api/support.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Look for 2-element return statements that should be 3-element
    if re.match(r'\s+return ".+?", "[a-z_]+"$', line):
        # This is a 2-element return, convert to 3-element
        match = re.match(r'(\s+)return "(.+?)", "([a-z_]+)"$', line)
        if match:
            indent = match.group(1)
            text = match.group(2)
            view = match.group(3)
            new_lines.append(f'{indent}return ("{text}", "{view}", None)\n')
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('backend/app/api/support.py', 'w') as f:
    f.writelines(new_lines)

print('Fixed all remaining 2-element returns')
