import os

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\peliculas\[slug]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import FlashcardViewer
import_statement = "import FlashcardViewer from '@/components/ui/FlashcardViewer';\n"
if "import FlashcardViewer" not in content:
    content = content.replace("import { tmdbOverrides }", import_statement + "import { tmdbOverrides }")

# 2. Replace the flashcard modal in the return statement
# We need to find the flashcard modal start
start_idx = content.find("{showFlashcards && (")
if start_idx != -1:
    end_idx = content.find("      )}\n\n      {/* Content */}")
    if end_idx != -1:
        replacement = """{showFlashcards && (
        <FlashcardViewer 
          initialFlashcards={flashcards} 
          onClose={() => setShowFlashcards(false)} 
        />
      )}"""
        # Note: I need to be careful with exact strings. Let's just find the exact block.
        pass

# Actually, the block might be a bit tricky to replace perfectly.
# Let's write the exact block replacement.
start_str = "{showFlashcards && ("
end_str = "      )}\n\n      {/* Contenido Principal */}"

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_flashcard = """{showFlashcards && (
        <FlashcardViewer 
          initialFlashcards={flashcards} 
          onClose={() => setShowFlashcards(false)} 
        />
      )}"""
    content = content[:idx1] + new_flashcard + content[idx2 + 10:] # +10 to skip '      )}\n\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
