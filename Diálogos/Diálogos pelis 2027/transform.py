import re
import os

file_path = "dialogos gta vice city.txt"

# Try to read with utf-8, fallback to latin-1
try:
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
except UnicodeDecodeError:
    with open(file_path, "r", encoding="latin-1") as f:
        lines = f.readlines()

out_lines = []
dialogue_count = 1

for line in lines:
    original_line = line.strip()
    
    # We want to keep empty lines as they are
    if not original_line:
        out_lines.append(line)
        continue
    
    # Check if the line is a dialogue
    # E.g., 'SONNY: Tommy Vercetti...Huh! shit.'
    match = re.match(r'^([A-Z0-9 ]+):\s*(.*)', original_line)
    
    if match:
        out_lines.append(f"{dialogue_count}\n")
        out_lines.append("00:00:00,000 --> 00:00:00,000\n")
        out_lines.append(f"{original_line}\n\n")
        dialogue_count += 1
    else:
        out_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

print(f"Processed {dialogue_count - 1} dialogue lines.")
