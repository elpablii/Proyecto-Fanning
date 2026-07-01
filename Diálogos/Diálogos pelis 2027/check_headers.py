import re

file_path = "gta 3 dialogos.txt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    s = line.strip()
    if not s: continue
    if re.match(r'^[=\-]+$', s): continue
    if re.match(r'^\d+\.\d+,', s): continue
    if re.match(r'^\d+,', s): continue
    if re.match(r'^[A-Za-z0-9_\-\.\'\s]+:', s): continue
    
    # This is either a continuation or a description. Let's print it to see if any header slipped through.
    # We will print only the first 20 to avoid flooding.
    # print(s)
