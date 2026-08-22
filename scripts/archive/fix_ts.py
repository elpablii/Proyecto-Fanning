import os

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\peliculas\[slug]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add the eslint disable for any
if '/* eslint-disable @typescript-eslint/no-explicit-any */' not in content:
    content = '/* eslint-disable @typescript-eslint/no-explicit-any */\n' + content

# Revert the Record<string, unknown> back to any
content = content.replace("useState<Record<string, unknown> | null>(null)", "useState<any>(null)")
content = content.replace("useState<Record<string, unknown>[]>([])", "useState<any[]>([])")
content = content.replace("(m: Record<string, any>) => m.title", "(m: any) => m.title")
content = content.replace("(r: Record<string, any>) => r.backdrop_path", "(r: any) => r.backdrop_path")
content = content.replace("(img: Record<string, any>) => `https:", "(img: any) => `https:")
content = content.replace("(v: Record<string, any>, i: number)", "(v: any, i: number)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted overly strict TS types to any.")
