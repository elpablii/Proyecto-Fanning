import pypdf
import os

pdf_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2024\Palabras desconocidas de About Time (lista definitiva).pdf"
reader = pypdf.PdfReader(pdf_path)
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

print(text[:1000]) # print first 1000 chars to see format
