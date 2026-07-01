import re

file_path = "dialogos gta vice city.txt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

current_mission = "INTRO"
missions = {current_mission: []}

i = 0
while i < len(lines):
    line = lines[i]
    # Check for mission header:
    # ----------------
    # a. THE PARTY
    # ----------------
    if re.match(r'^[\-]+$', line.strip()) and i + 2 < len(lines) and re.match(r'^[\-]+$', lines[i+2].strip()):
        match = re.match(r'^[a-zA-Z0-9]+\.\s+(.*)', lines[i+1].strip())
        if match:
            current_mission = match.group(1).strip()
            missions[current_mission] = []
            i += 3
            continue
    missions[current_mission].append(line)
    i += 1

for m in missions.keys():
    print(m)
