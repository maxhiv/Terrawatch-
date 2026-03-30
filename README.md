#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  TERRAWATCH v2.0 — GitHub Push Script
#  Run this from inside the terrawatch/ folder
# ══════════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  TERRAWATCH v2.0 — GitHub Push               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Create repo via GitHub API ─────────────────────────────────
echo "→ Creating GitHub repository 'terrawatch-v2'..."
echo ""
echo "  Option A — GitHub CLI (recommended if you have 'gh' installed):"
echo "  gh repo create terrawatch-v2 --private --description 'TERRAWATCH v2 — Planetary Environmental Intelligence Platform' --source=. --push"
echo ""
echo "  Option B — Manual steps:"
echo "  1. Go to https://github.com/new"
echo "  2. Repository name: terrawatch-v2"
echo "  3. Description: TERRAWATCH v2 — Planetary Environmental Intelligence Platform"
echo "  4. Private ✓ | Add no README (we have one)"
echo "  5. Click 'Create repository'"
echo "  6. Copy the repo URL (e.g. https://github.com/YOUR_USERNAME/terrawatch-v2.git)"
echo ""

# ── 2. Set remote and push ─────────────────────────────────────────
read -p "→ Paste your GitHub repo URL here: " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "No URL provided. Exiting."
  exit 1
fi

echo ""
echo "→ Setting remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

echo "→ Renaming branch to main..."
git branch -M main

echo "→ Pushing to GitHub..."
git push -u origin main

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✓ TERRAWATCH v2.0 pushed to GitHub!         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "→ Next: Import into Replit"
echo "  1. replit.com → + Create Repl"
echo "  2. Import from GitHub → paste: $REPO_URL"
echo "  3. Replit auto-detects Node.js"
echo "  4. In Replit Shell: cp .env.example .env"
echo "  5. Edit .env with your API keys"
echo "  6. Click ▶ Run"
echo ""
echo "→ Free APIs that work with NO keys:"
echo "  USGS NWIS, NOAA CO-OPS, NOAA NWS, NOAA NDBC"
echo "  (Dashboard will show live Mobile Bay data immediately)"
echo ""
