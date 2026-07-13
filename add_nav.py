import re
import os

filepath = 'src/pages/TournamentRegister.jsx'

with open(filepath, 'r') as f:
    content = f.read()

# Add import
nav_import = "import Navigation from '../components/Navigation';"
if nav_import not in content:
    import_pattern = r"^import .+ from .+;$"
    imports = list(re.finditer(import_pattern, content, re.MULTILINE))
    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        content = content[:insert_pos] + '\n' + nav_import + content[insert_pos:]
        print("Added import")

# Add component
if '<Navigation />' not in content:
    return_pattern = r'(return\s*\(\s*<div[^>]*>)'
    match = re.search(return_pattern, content)
    if match:
        insert_pos = match.end()
        nav_component = '\n      <Navigation />'
        content = content[:insert_pos] + nav_component + content[insert_pos:]
        print("Added component")

with open(filepath, 'w') as f:
    f.write(content)

print("Done!")
