#!/usr/bin/env python3
import subprocess
import os

os.chdir('/Applications/MAMP/htdocs/vercel_player_registration')

commands = [
    ['git', 'add', '.'],
    ['git', 'commit', '-m', 'Update players grid to 4 cards per row'],
    ['git', 'push', 'origin', 'main'],
    ['npm', 'run', 'build']
]

for cmd in commands:
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    print()
