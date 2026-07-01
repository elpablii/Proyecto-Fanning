import re

file_path = "gta 3 dialogos.txt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

out_lines = []
dialogue_count = 1

def flush_unit(unit):
    global dialogue_count
    if unit:
        unit_clean = re.sub(r'\s+', ' ', unit.strip())
        out_lines.append(f"{dialogue_count}\n")
        out_lines.append("00:00:00,000 --> 00:00:00,000\n")
        out_lines.append(f"{unit_clean}\n\n")
        dialogue_count += 1

current_unit = ""

for line in lines:
    s = line.strip()
    
    if not s:
        flush_unit(current_unit)
        current_unit = ""
        out_lines.append("\n")
        continue

    # Separator
    if re.match(r'^[=\-]+$', s):
        flush_unit(current_unit)
        current_unit = ""
        out_lines.append(s + "\n")
        continue

    # Mission header or Category header
    if re.match(r'^\d+\.\d+,', s) or re.match(r'^\d+,', s):
        flush_unit(current_unit)
        current_unit = ""
        out_lines.append(s + "\n")
        continue

    # Character dialogue line
    if re.match(r'^[A-Za-z0-9_\-\.\'\s]+:', s):
        flush_unit(current_unit)
        current_unit = s
        continue

    # Continuation or Description
    if current_unit:
        current_unit += " " + s
    else:
        current_unit = s

flush_unit(current_unit)

# Avoid having more than 2 consecutive empty lines in output
final_out = []
empty_count = 0
for out in out_lines:
    if out == "\n":
        empty_count += 1
        if empty_count > 2:
            continue
    else:
        empty_count = 0
    final_out.append(out)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(final_out)

print(f"Processed {dialogue_count - 1} dialogues/descriptions.")
