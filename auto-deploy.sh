#!/bin/bash

# ============================================
# AUTO-DEPLOY SCRIPT
# Cricket Player Management System
# ============================================
# This script automatically:
# 1. Adds all changes
# 2. Commits with a descriptive message
# 3. Pushes to GitHub
# 4. Triggers Vercel deployment
# ============================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Applications/MAMP/htdocs/vercel_player_registration"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 AUTO-DEPLOY: Cricket Player Management${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository!${NC}"
    exit 1
fi

# Get commit message from argument or use default
COMMIT_MSG="${1:-Auto-deploy: Updates and improvements}"

echo -e "\n${YELLOW}📝 Commit Message:${NC} $COMMIT_MSG"

# Check git status
echo -e "\n${BLUE}📊 Checking git status...${NC}"
git status --short

# Add all changes
echo -e "\n${BLUE}➕ Adding all changes...${NC}"
git add -A

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo -e "\n${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# Commit changes
echo -e "\n${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "\n${BLUE}🌿 Current branch:${NC} $BRANCH"

# Push to remote
echo -e "\n${BLUE}🚀 Pushing to GitHub...${NC}"
git push origin "$BRANCH"

# Success message
echo -e "\n${GREEN}✅ Successfully deployed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 Changes committed and pushed to GitHub${NC}"
echo -e "${GREEN}🔄 Vercel will auto-deploy in ~30 seconds${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Show latest commit
echo -e "\n${BLUE}📜 Latest commit:${NC}"
git log -1 --oneline

echo ""
