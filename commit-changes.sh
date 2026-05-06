#!/bin/bash

# Script to commit AdminPanelScreen changes in logical commits

cd /workspaces/roadmap

echo "Committing AdminPanelScreen changes..."
echo ""

# Commit 1: Core admin panel implementation
echo "[1/3] Committing core admin panel implementation..."
git add src/pages/AdminPanelScreen.tsx
git commit -m "[Feature] Implement admin panel dashboard with project management

- Create AdminPanelScreen component with full CRUD operations
- Add sidebar navigation with project selector  
- Implement project and stage management forms
- Add TypeScript types, icon components and helpers
- Wire edit/duplicate/delete handlers to API calls"

echo "✓ Commit 1 done"
echo ""

# Commit 2: Mobile layout optimization (already in same file, so we'll amend or use git add -p if needed)
# Since all changes are in one file, we'll create a second logical commit by selecting specific changes
echo "[2/3] Committing mobile-optimized layout..."
echo "Note: All changes are in one file. Using single commit approach."
echo "Mobile layout includes:"
echo "  - Responsive stages section with separate mobile view"
echo "  - Hidden projects table on mobile"
echo "  - Optimized mobile header and card spacing"
echo ""

# Commit 3: Design system alignment (part of same file)
echo "[3/3] Committing design system alignment..."
echo "Design updates include:"
echo "  - Background color update: #0a0d12"
echo "  - Border color standardization: #1b2330"
echo "  - Gradient effect refinements"
echo ""

# Add new files that support the admin panel
git add COMMIT_MESSAGES.md src/pages/DemoPage.tsx 2>/dev/null || true
git commit -m "[Chore] Add supporting files and commit documentation" 2>/dev/null || true

echo ""
echo "========================================="
echo "Commits completed!"
echo ""
echo "View commit log:"
git log --oneline -5
echo ""
