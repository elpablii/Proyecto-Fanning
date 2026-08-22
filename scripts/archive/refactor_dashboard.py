import os

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import MovieCard
import_statement = "import MovieCard from '@/components/ui/MovieCard';\n"
if "import MovieCard" not in content:
    content = content.replace("import Link from 'next/link';", "import Link from 'next/link';\n" + import_statement)

# 2. Remove the inline MovieCard definition
start_idx = content.find("const MovieCard = ({ title, count, dialogues, href }")
if start_idx != -1:
    # Find the end of MovieCard
    end_idx = content.find("};\n\nexport default function Dashboard()")
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx + 4:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
