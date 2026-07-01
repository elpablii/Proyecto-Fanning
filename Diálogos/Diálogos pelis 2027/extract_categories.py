import re

file_path = "dialogos gta vice city.txt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if re.match(r'^[=]+$', lines[i].strip()) and i + 2 < len(lines) and re.match(r'^[=]+$', lines[i+2].strip()):
        print(lines[i+1].strip())
