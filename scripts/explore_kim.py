import pypdf, re

pdf1 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 1).pdf"

t = ''.join(p.extract_text() for p in pypdf.PdfReader(pdf1).pages)

with open("kim_explore.txt", "w", encoding="utf-8") as f:
    f.write("S01 matches:\n")
    f.write(str(re.findall(r'.{0,10}S01.{0,10}', t, re.IGNORECASE)[:50]) + "\n")
    f.write("EP matches:\n")
    f.write(str(re.findall(r'.{0,10}EP\d+.{0,10}', t, re.IGNORECASE)[:50]) + "\n")
    f.write("Episode matches:\n")
    f.write(str(re.findall(r'.{0,10}Episode \d+.{0,10}', t, re.IGNORECASE)[:50]) + "\n")
