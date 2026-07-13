import re, os

pages = ['Dashboard', 'Players', 'RegisterPlayer', 'Tournaments', 'AddTournament', 'EditTournament', 'EditPlayer', 'Login']

for page in pages:
    fp = f'src/pages/{page}.jsx'
    if not os.path.exists(fp):
        continue
    with open(fp) as f:
        c = f.read()
    m = False
    ni = "import Navigation from '../components/Navigation';"
    if ni not in c:
        imp = list(re.finditer(r'^import .+ from .+;$', c, re.MULTILINE))
        if imp:
            p = imp[-1].end()
            c = c[:p] + '\n' + ni + c[p:]
            m = True
    if '<Navigation />' not in c:
        ma = re.search(r'(return\s*\(\s*<div[^>]*>)', c)
        if ma:
            p = ma.end()
            c = c[:p] + '\n      <Navigation />' + c[p:]
            m = True
    if m:
        with open(fp, 'w') as f:
            f.write(c)
        print(f'OK: {page}.jsx')
