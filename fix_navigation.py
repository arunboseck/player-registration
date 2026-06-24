import re

css_file = '/Applications/MAMP/htdocs/cricket-player-app/src/components/Navigation.css'

with open(css_file, 'r') as f:
    content = f.read()

# Fix z-index for hamburger button (line 6)
content = re.sub(
    r'(\.hamburger-menu-btn\s*\{[^}]*z-index:\s*)1001',
    r'\g<1>10000',
    content
)

# Fix z-index for sidebar menu (line 49)
content = re.sub(
    r'(\.sidebar-menu\s*\{[^}]*z-index:\s*)1000',
    r'\g<1>9999',
    content
)

# Add padding styles for page titles at the end
title_padding = '''

/* Prevent title overlap with hamburger menu */
.dashboard-container h1,
.players-container h1,
.register-container h1,
.tournaments-container h1,
.add-tournament-container h1,
.edit-tournament-container h1,
.edit-player-container h1,
.login-container h1,
.public-register-container h1 {
  padding-left: 80px !important;
}

@media (max-width: 768px) {
  .dashboard-container h1,
  .players-container h1,
  .register-container h1,
  .tournaments-container h1,
  .add-tournament-container h1,
  .edit-tournam  .edit-ain  .edit-tournam  .edit-ain  .edit-tournam  .edit-ain  .edit-tournam  .edit-ain  .edit-r h1 {
    padding-left: 70px !imp    padding-left: 70p: 1.5rem !important;
  }
}
'''

# Add the title# Add the title#if# Add the title# Add the title#if# Add the title# Add  c# Add the title# nt += title_padding

with open(css_file, 'w') as f:
    f.    f.    f.    pr    f.    f.    f.    pr    f.    f.    f.    prsidebar=9999')
print('✅ Added title padding to prevent overlap')
