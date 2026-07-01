import re
import os

file_path = "dialogos gta vice city.txt"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(file_path, "r", encoding="latin-1") as f:
        lines = f.readlines()

# 1. Revert to original text
clean_lines = []
skip = 0
for i in range(len(lines)):
    if skip > 0:
        skip -= 1
        continue
    
    s = lines[i].strip()
    if re.match(r'^\d+$', s) and i + 1 < len(lines) and "00:00:00,000 --> 00:00:00,000" in lines[i+1]:
        skip = 1
        continue
    clean_lines.append(lines[i])

# 2. Process with new rules
def is_section_header(line):
    s = line.strip()
    # Matches "1. I N T R O", "a. THE PARTY", "V. ASSET MISSION SCRIPTS", etc.
    # We restrict the prefix length a bit, normally it's 1-3 chars (like '1', 'a', 'IV', etc.)
    match = re.match(r'^([a-zA-Z0-9]{1,4})\.\s+(.*)', s)
    if match:
        # Just to be extra safe, ensure the rest of the string is mostly uppercase or it's a known header
        return True
    return False

def is_separator(line):
    s = line.strip()
    if re.match(r'^[=\-~]+$', s):
        return True
    return False

out_lines = []
dialogue_count = 1
prev_was_empty = False

for line in clean_lines:
    s = line.strip()
    
    # Handle empty lines
    if not s:
        if not prev_was_empty:
            out_lines.append("\n")
        prev_was_empty = True
        continue
    
    prev_was_empty = False
    
    if is_separator(line) or is_section_header(line):
        out_lines.append(line.rstrip() + "\n")
    else:
        # This is a dialogue, description, or place
        out_lines.append(f"{dialogue_count}\n")
        out_lines.append("00:00:00,000 --> 00:00:00,000\n")
        out_lines.append(f"{s}\n\n")
        dialogue_count += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

print(f"Processed {dialogue_count - 1} dialogue/description lines.")
