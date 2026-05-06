# Commit Messages for AdminPanelScreen

Use these commit messages when staging the changes. Follow the [Tag] format from COMMIT_EDITMSG.

## Commit 1: Core Admin Panel Implementation
```
[Feature] Implement admin panel dashboard with project management

- Create AdminPanelScreen component with full CRUD operations
- Add sidebar navigation with project selector
- Implement project and stage management forms
- Add TypeScript types and icon components
- Wire edit/duplicate/delete handlers
```

**Files:** src/pages/AdminPanelScreen.tsx (new file)

---

## Commit 2: Mobile-Optimized Layout
```
[UI] Add responsive mobile layout for admin panel

- Implement separate mobile layout for stages section
- Hide projects table on mobile (visible on lg+ screens)
- Add compact mobile header with menu toggle
- Optimize card spacing and typography for mobile
- Add delete-only actions on mobile, full CRUD on desktop
```

**Files:** src/pages/AdminPanelScreen.tsx (mobile layout section)

---

## Commit 3: Design System Alignment
```
[Style] Align admin panel with public roadmap color scheme

- Update background from #070b10 to #0a0d12 (matches PublicView)
- Replace white borders with dark slate (#1b2330)
- Adjust gradient effects for better cohesion
- Ensure consistent theming across all sections
```

**Files:** src/pages/AdminPanelScreen.tsx (theme colors)

---

## How to Commit

1. Open VS Code Source Control (Ctrl+Shift+G)
2. Stage all changes
3. Copy one commit message at a time
4. Commit with the exact message
5. Repeat for each section

Alternative (if terminal works):
```bash
git add src/pages/AdminPanelScreen.tsx
git commit -m "[Feature] Implement admin panel dashboard..."
```
