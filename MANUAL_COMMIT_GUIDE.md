# Jak commitować zmiany AdminPanelScreen

## Metoda 1: Użyj VS Code Source Control UI (najłatwiej)

1. Otwórz **Source Control** (Ctrl+Shift+G)
2. Kliknij **+** obok `src/pages/AdminPanelScreen.tsx` aby ją stage'ować
3. W polu **Message** wklej pierwszy commit message z poniżej
4. Kliknij **Commit** (Ctrl+Enter)
5. Powtórz dla pozostałych commitów

---

## Commit Messages (skopiuj i wklej)

### Commit 1: Core Admin Panel
```
[Feature] Implement admin panel dashboard with project management

- Create AdminPanelScreen component with full CRUD operations
- Add sidebar navigation with project selector
- Implement project and stage management forms
- Add TypeScript types, icon components and helpers
- Wire edit/duplicate/delete handlers to API calls
```

### Commit 2: Mobile Layout & Styling  
```
[UI] Add responsive mobile layout and design system alignment

- Implement separate mobile layout for stages section
- Hide projects table on mobile (visible on lg+ screens)
- Update background to match public roadmap (#0a0d12)
- Replace white borders with dark slate (#1b2330)
- Optimize card spacing and mobile typography
```

### Commit 3: Documentation
```
[Chore] Add commit messages documentation for admin panel changes

- Create COMMIT_MESSAGES.md with detailed commit instructions
- Add DemoPage.tsx supporting component
```

---

## Metoda 2: Terminal Commands (jeśli terminal działa)

```bash
cd /workspaces/roadmap

# Commit 1
git add src/pages/AdminPanelScreen.tsx
git commit -m "[Feature] Implement admin panel dashboard with project management

- Create AdminPanelScreen component with full CRUD operations
- Add sidebar navigation with project selector
- Implement project and stage management forms
- Add TypeScript types, icon components and helpers
- Wire edit/duplicate/delete handlers to API calls"

# Commit 2
git add src/pages/AdminPanelScreen.tsx
git commit --amend -m "[UI] Add responsive mobile layout and design system alignment

- Implement separate mobile layout for stages section
- Hide projects table on mobile (visible on lg+ screens)
- Update background to match public roadmap (#0a0d12)
- Replace white borders with dark slate (#1b2330)
- Optimize card spacing and mobile typography"

# Commit 3
git add COMMIT_MESSAGES.md src/pages/DemoPage.tsx
git commit -m "[Chore] Add commit messages documentation for admin panel changes

- Create COMMIT_MESSAGES.md with detailed commit instructions
- Add DemoPage.tsx supporting component"

# View results
git log --oneline -5
```

---

## Weryfikacja

Po commitowaniu sprawdź:
```bash
git log --oneline -5
git show HEAD  # Pokaż ostatni commit
```
