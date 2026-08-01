# 🔄 AUTO-DEPLOYMENT WORKFLOW GUIDE

## 📋 Project Rules

### **Rule #1: Project Isolation** 🔒
- **ONLY** work within `/Applications/MAMP/htdocs/vercel_player_registration`
- **NEVER** touch any other projects in `/Applications/MAMP/htdocs/`
- All file paths must be absolute and verified

### **Rule #2: Auto-Deploy After Tasks** 🚀
- After completing ANY task, automatically:
  1. ✅ Build project (if needed)
  2. ✅ Add all changes
  3. ✅ Commit with descriptive message
  4. ✅ Push to GitHub
  5. ✅ Vercel auto-deploys from GitHub

---

## 🛠️ Auto-Deploy Script

### **Location:**
```bash
/Applications/MAMP/htdocs/vercel_player_registration/auto-deploy.sh
```

### **Usage:**

#### **Option 1: With custom commit message**
```bash
./auto-deploy.sh "feat: Added new feature X"
```

#### **Option 2: With default message**
```bash
./auto-deploy.sh
# Uses: "Auto-deploy: Updates and improvements"
```

---

## 📝 Commit Message Conventions

Follow **Conventional Commits** format:

```
<type>: <description>

Examples:
- feat: Add tournament export to PDF
- fix: Resolve duplicate registration bug
- style: Update dashboard card design
- refactor: Optimize Firebase queries
- docs: Update README with new features
- chore: Update dependencies
```

### **Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `style:` - UI/CSS changes
- `refactor:` - Code restructuring
- `perf:` - Performance improvement
- `docs:` - Documentation
- `test:` - Testing
- `chore:` - Maintenance

---

## 🚀 Deployment Pipeline

```
Task Complete → Build (if needed) → Git Add → Git Commit → Git Push → Vercel Deploy
```

### **What Gets Deployed:**
- All source code changes in `src/`
- Package.json updates
- Configuration changes
- Build artifacts in `dist/` (generated)

### **What Doesn't Get Deployed:**
- `node_modules/` (ignored)
- `.env` files (ignored)
- Temporary files (ignored)
- Python scripts (ignored)

---

## 📊 Repository Details

- **GitHub:** https://github.com/arunboseck/player-registration.git
- **Branch:** main
- **Deployment:** Vercel (auto-deploy on push)
- **Environment:** Production

---

## ✅ Task Completion Checklist

After completing a task:

- [ ] 1. Test functionality locally
- [ ] 2. Verify no errors in console
- [ ] 3. Check responsive design (if UI changes)
- [ ] 4. Run build (if needed): `npm run build`
- [ ] 5. Run auto-deploy script: `./auto-deploy.sh "task description"`
- [ ] 6. Verify GitHub push successful
- [ ] 7. Check Vercel deployment status (30-60 seconds)
- [ ] 8. Test on live URL (if critical)

---

## 🔍 Verification Steps

### **1. Check Git Status**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration
git status
```

### **2. Check Latest Commits**
```bash
git log --oneline -5
```

### **3. Check Remote Sync**
```bash
git remote -v
git fetch origin
git status
```

### **4. Check Vercel Deployment**
- Visit: https://vercel.com/dashboard
- Check latest deployment status
- View build logs if needed

---

## 🐛 Troubleshooting

### **Problem: Auto-deploy script fails**
```bash
# Check if script is executable
ls -la auto-deploy.sh

# Make executable if needed
chmod +x auto-deploy.sh
```

### **Problem: Git push rejected**
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

### **Problem: Build fails**
```bash
# Check for errors
npm run build

# Fix errors, then re-run auto-deploy
./auto-deploy.sh "fix: Resolve build errors"
```

---

## 📦 Quick Commands

### **Status Check**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration && git status
```

### **Quick Deploy**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration && ./auto-deploy.sh "quick update"
```

### **Build + Deploy**
```bash
cd /Applications/MAMP/htdocs/vercel_player_registration
npm run build
./auto-deploy.sh "feat: New build with updates"
```

---

## 🎯 Best Practices

1. **Always test locally first** before deploying
2. **Write descriptive commit messages** for future reference
3. **Keep commits atomic** - one logical change per commit
4. **Build before deploying** if source code changed
5. **Verify deployment** after pushing to ensure success

---

## 🔐 Security Notes

- `.env` files are **never** committed (in .gitignore)
- Environment variables set in Vercel dashboard
- Firebase credentials stored securely in Vercel
- Auto-deploy only runs from authorized machine

---

## 📞 Support

If auto-deploy fails:
1. Check git status and errors
2. Verify network connection
3. Check GitHub repository access
4. Verify Vercel integration is active

---

**Last Updated:** 2026-08-01  
**Version:** 1.0  
**Status:** Active
