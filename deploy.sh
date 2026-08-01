#!/bin/bash
cd /Applications/MAMP/htdocs/vercel_player_registration
git add .
git commit -m "Update players grid to 4 cards per row"
git push origin main
npm run build
