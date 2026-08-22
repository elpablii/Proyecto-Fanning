import pypdf, re

pdf2 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 2).pdf"

t = ''.join(p.extract_text() for p in pypdf.PdfReader(pdf2).pages)

with open("kim_explore_s2.txt", "w", encoding="utf-8") as f:
    f.write("S02 matches:\n")
    f.write(str(re.findall(r'.{0,10}S02.{0,10}', t, re.IGNORECASE)[:50]) + "\n")
