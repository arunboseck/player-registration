import re
import os

def add_navigation_to_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    modified = False
    
    # Add Navigation import
    import_line = "import Navigation from '../components/Navigation';"
    if import_line not in content:
        last_import = list(re.finditer(r'^import .+;$', content, re.MULTILINE))[-1]
        insert_pos = last_import.end()
        content = content[:insert_pos] + '\n' + import_line + content[insert_pos:]
        modified = True
        print(f'  ✅ Added Navigation import to {os.path.basename(file_path)}')
    
    # Add Navigation component
    if '<Navigation />' not in content:
        pattern = r'(return\s*\([^<]*<[^>]+>)'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            insert_pos = match.end()
            nav_component = '\n      <Navigation />'
            content = content[:insert_pos] + nav_component + content[insert_pos:]
            modified = True
            print(f'  ✅ Add        gation /> to             print(f'  ✅ Add')
    
                                    il                               f.write(content)
        re        re        re      


       re        re        re      
l                               isl                               id.jsx',
    'src/pages/Players.jsx',
    'src/pages/RegisterPlayer.jsx',
    'src/page    'src/page    'src/page    'src/padT    'src/page    'src/page    'src/page    'src/padT    'src/page    'src/page   ',    'src/page    'src/ga    'src/page    'src/page    'src/page    'src/padT    'src/page    'src/page 
        add_navigation_to_file(page)
    else:
        print(f'  ⚠️  File not found: {page}')

print('\n✅ Done!')
