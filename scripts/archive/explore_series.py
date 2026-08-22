import pypdf

pdfs = [
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Euphoria in English (Season 1 + Special Episodes).pdf",
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Euphoria in English (Season 2).pdf"
]

for pdf in pdfs:
    print(f"\n--- Reading: {pdf} ---")
    try:
        reader = pypdf.PdfReader(pdf)
        text = reader.pages[0].extract_text()
        print(text[:1500])
    except Exception as e:
        print(f"Error: {e}")
