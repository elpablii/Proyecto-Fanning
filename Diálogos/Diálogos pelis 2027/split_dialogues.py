import re

file_path = "gta 3 dialogos.txt"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_out = []
dialogue_count = 1

def flush_dialogue(prefix, text):
    global dialogue_count
    if text:
        new_out.append(f"{dialogue_count}\n")
        new_out.append("00:00:00,000 --> 00:00:00,000\n")
        new_out.append(f"{prefix}{text.strip()}\n\n")
        dialogue_count += 1

i = 0
while i < len(lines):
    s = lines[i].strip()
    
    if not s:
        i += 1
        continue
        
    if re.match(r'^\d+$', s) and i + 1 < len(lines) and "00:00:00,000" in lines[i+1]:
        text = lines[i+2].strip()
        
        prefix = ""
        content = text
        m = re.match(r'^([A-Za-z0-9_\-\.\'\s]+:)\s*(.*)', text)
        if m:
            prefix = m.group(1) + " "
            content = m.group(2)
            
        if len(content) > 80:
            # Split by sentences
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z\"\'\¿\¡])', content)
            
            for sentence in sentences:
                if len(sentence) > 100:
                    # Split by comma if the sentence is still very long
                    subparts = re.split(r'(?<=[,;])\s+', sentence)
                    temp = ""
                    for sp in subparts:
                        if len(temp) + len(sp) > 80 and temp:
                            flush_dialogue(prefix, temp)
                            temp = sp
                        else:
                            temp += (" " if temp else "") + sp
                    if temp:
                        flush_dialogue(prefix, temp)
                else:
                    flush_dialogue(prefix, sentence)
        else:
            flush_dialogue(prefix, content)
            
        i += 3
        continue
        
    # Header or separator
    if re.match(r'^[=\-]+$', s) or re.match(r'^\d+\.\d+,', s) or re.match(r'^\d+,', s):
        new_out.append(s + "\n")
        i += 1
        continue
        
    # Any other raw text (if any)
    new_out.append(s + "\n")
    i += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_out)

print(f"File processed. Total dialogues: {dialogue_count - 1}")
