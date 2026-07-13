import re
import os

pages = [
    'src/pages/Dashboard.jsx',
    'src/pages/Players.jsx',
    'src/pages/RegisterPlayer.jsx',
    'src/pages/Tournaments.jsx',
    'src/pages/AddTournament.jsx',
    'src/pages/EditTournament.jsx',
    'src/pages/EditPlayer.jsx',
    'src/pages/Login.jsx',
]

for filepath in pages:
    if not os.path.exists(filepath):
        print(f"Skip: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    
    # Add import
    nav_import = "import Navigation from '../components/Navigation';"
    if nav_import not in content:
        import_pattern = r"^import .+ from .+;$"
        imports = list(re.finditer(import_pattern, content, re.MULTILINE))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + '\n' + nav_import + content[insert_pos:]
            modified = True
    
    # Add component
    if '<Navigation />' not in content:
        return_pa        r'        return_pa        r'            return_pa        r'rn_pattern, content)
        if match:        if match:        if mat.end()
            nav_component = '\            nav_component = '\     content = content[:insert_pos] +             nav_componentnsert            nav_compodi            nav_component = '\            with open(filepath, 'w') as f:            navwrite(c            nav_component = '\   at            nav_component   else            nav_comè≠Ô∏è  {os.path.basename(filepath)} (already has Navigation)")

print("\nDone!")
