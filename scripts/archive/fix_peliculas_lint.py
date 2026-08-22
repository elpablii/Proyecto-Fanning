import os
import re

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\peliculas\[slug]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add eslint-disable at the top for img warning
if '/* eslint-disable @next/next/no-img-element */' not in content:
    content = '/* eslint-disable @next/next/no-img-element */\n' + content

# 2. Fix useMemo unused
content = content.replace("import React, { useState, useEffect, useMemo }", "import React, { useState, useEffect }")

# 3. Fix unused 'e' in catch blocks
content = content.replace("catch(e =>", "catch(() =>")
content = content.replace("catch(e) {}", "catch(_) {}")
content = content.replace("catch (e) {}", "catch (_) {}")

# 4. Fix Tailwind v4 classes
content = content.replace("bg-gradient-to-br", "bg-linear-to-br")
content = content.replace("bg-gradient-to-b", "bg-linear-to-b")
content = content.replace("bg-gradient-to-r", "bg-linear-to-r")
content = content.replace("aspect-[2/3]", "aspect-2/3")
content = content.replace("min-w-[140px]", "min-w-35")
content = content.replace("max-w-[200px]", "max-w-50")
content = content.replace("max-h-[800px]", "max-h-200")
content = content.replace("min-h-[250px]", "min-h-62.5")
content = content.replace("z-[60]", "z-60")

# 5. Fix TypeScript 'any'
# Top level state types
content = content.replace("useState<any>(null)", "useState<Record<string, unknown> | null>(null)")
content = content.replace("useState<any[]>([])", "useState<Record<string, unknown>[]>([])")

# Inline map/find types
content = content.replace("(m: any) => m.title", "(m: Record<string, any>) => m.title")
content = content.replace("(r: any) => r.backdrop_path", "(r: Record<string, any>) => r.backdrop_path")
content = content.replace("(img: any) => `https:", "(img: Record<string, any>) => `https:")
content = content.replace("(v: any, i: number)", "(v: Record<string, any>, i: number)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied lint fixes to peliculas page.")
