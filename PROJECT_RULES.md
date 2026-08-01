# 🔒 PROJECT RULES & CONSTRAINTS

## ⚠️ CRITICAL RULES - MUST FOLLOW

---

## 🎯 RULE #1: PROJECT ISOLATION

### **ONLY work in this directory:**
```
/Applications/MAMP/htdocs/vercel_player_registration
```

### **NEVER touch:**
- Any other project in `/Applications/MAMP/htdocs/`
- System files outside the project
- Other repositories

### **How to verify:**
```bash
# Always start with this
cd /Applications/MAMP/htdocs/vercel_player_registration
pwd  # Must show: /Applications/MAMP/htdocs/vercel_player_registration
```

---

## 🚀 RULE #2: AUTO-DEPLOY AFTER TASKS

### **After completing ANY task:**
1. ✅ Test locally (if code changes)
2. ✅ Build if needed: `npm run build`
3. ✅ Auto-deploy: `./auto-deploy.sh "descriptive message"`

### **The script automatically:**
- Adds all changes
- Commits with message
- Pushes to GitHub
- Triggers Vercel deployment (30-60 seconds)

### **Command Template:**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration
./auto-deploy.sh "type: description of changes"
```

### **Examples:**
```bash
./auto-deploy.sh "feat: Add PDF export for players"
./auto-deploy.sh "fix: Resolve duplicate registration bug"
./auto-deploy.sh "style: Update dashboard colors"
./auto-deploy.sh "refactor: Optimize Firebase queries"
```

---

## 📝 COMMIT MESSAGE FORMAT

### **Convention:** `<type>: <description>`

### **Types:**
| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | `feat: Add tournament export` |
| `fix` | Bug fix | `fix: Resolve photo upload issue` |
| `style` | UI/CSS changes | `style: Update button colors` |
| `refactor` | Code restructure | `refactor: Clean up player utils` |
| `perf` | Performance | `perf: Optimize database queries` |
| `docs` | Documentation | `docs: Update README` |
| `chore` | Maintenance | `chore: Update dependencies` |
| `test` | Testing | `test: Add unit tests` |

---

## 🔄 DEPLOYMENT PIPELINE

```
┌─────────────┐
│ Task Done   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ npm build   │ (if needed)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ git add -A  │ (auto)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ git commit  │ (auto)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  git push   │ (auto)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Vercel    │ (auto-deploy)
└─────────────┘
```

---

## 📂 FILE STRUCTURE AWARENESS

### **Source Files:**
```
src/
├── components/    # 4 reusable components
├── contexts/      # Auth context
├── firebase/      # Firebase config
├── hooks/         # Custom hooks
├── pages/         # 12 page components
└── utils/         # 4 utility files
```

### **Build Output:**
```
dist/              # Auto-generated, DO NOT edit manually
```

### **Config Files:**
```
package.json       # Dependencies
vite.config.js     # Build config
vercel.json        # Deployment config
database.rules.json # Firebase rules
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before running `./auto-deploy.sh`:

- [ ] **Code tested locally?**
  - `npm run dev` - Check functionality
  - Test in browser at `localhost:5173`

- [ ] **Build successful?** (if code changes)
  - `npm run build` - Check for errors

- [ ] **Console errors checked?**
  - Open browser DevTools
  - Check Console tab for errors

- [ ] **Responsive design?** (if UI changes)
  - Test mobile view
  - Test tablet view

- [ ] **Commit message ready?**
  - Follows convention
  - Descriptive and clear

---

## 🚫 WHAT NOT TO COMMIT

### **Never commit:**
- `.env` files (contains secrets)
- `node_modules/` (too large)
- `dist/` folder (auto-generated)
- Personal API keys
- Database credentials
- `.DS_Store` (Mac system files)

### **Already in .gitignore:**
```
node_modules/
/dist
.env
.DS_Store
*.log
.cache/
```

---

## 🔧 TROUBLESHOOTING

### **Problem: Script permission denied**
```bash
chmod +x /Applications/MAMP/htdocs/vercel_player_registration/auto-deploy.sh
```

### **Problem: Git push rejected**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration
git pull origin main --rebase
./auto-deploy.sh "merge: Sync with remote"
```

### **Problem: Vercel not deploying**
1. Check GitHub push successful: `git log -1`
2. Visit Vercel dashboard
3. Check deployment logs
4. Verify GitHub integration active

---

## 📊 MONITORING DEPLOYMENT

### **Check Git Status:**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration
git status
git log --oneline -5
```

### **Check Vercel:**
- Dashboard: https://vercel.com/dashboard
- View latest deployment
- Check build logs if failed

---

## 🎯 WORKFLOW SUMMARY

```
1. Receive task
2. Work ONLY in /Applications/MAMP/htdocs/vercel_player_registration
3. Make changes
4. Test locally
5. Build (if needed)
6. Run: ./auto-deploy.sh "type: description"
7. Verify GitHub push
8. Wait for Vercel deployment (30-60s)
9. Task complete ✅
```

---

**Remember:** 
- ✅ **ALWAYS** work in project directory
- ✅ **ALWAYS** auto-deploy after tasks
- ✅ **NEVER** touch other projects
- ✅ **NEVER** commit secrets

---

**Last Updated:** 2026-08-01  
**Status:** ACTIVE  
**Compliance:** MANDATORY
