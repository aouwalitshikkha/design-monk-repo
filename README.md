# Design Monk Work Log

Personal consultancy work tracker hosted on GitHub Pages.

## How to Use

### 1. Add Daily Entry (Local CLI)

```bash
node add-entry.js
```

This will prompt you for:
- Date (defaults to today)
- Hours worked
- Category (Research, Suggestion, Consultation, Development, Design, Meeting, Documentation, Learning, Bug Fix, Other)
- Tasks (enter one by one, empty to finish)
- Blockers
- Notes

Then it auto-commits and pushes to GitHub.

### 2. View Dashboard

Visit your GitHub Pages URL:
```
https://aouwalitshikkha.github.io/design-monk-repo/
```

Features:
- View all entries with filters
- Weekly / Monthly / Custom reports
- Export to Excel or PDF
- Charts for category breakdown and timeline

### 3. Categories

- **Research** - Market research, tech exploration
- **Suggestion** - Client recommendations, proposals
- **Consultation** - Advisory sessions
- **Development** - Coding, building
- **Design** - UI/UX, graphics
- **Meeting** - Calls, standups, reviews
- **Documentation** - Docs, guides, specs
- **Learning** - Courses, tutorials
- **Bug Fix** - Debugging, fixes
- **Other** - Anything else

## Setup (First Time)

1. Clone this repo
2. Run `node add-entry.js` to add your first entry
3. Enable GitHub Pages in repo settings (Source: main branch, folder: root)
4. Visit the Pages URL

## Files

- `add-entry.js` - CLI script to add entries
- `work-log.json` - All your work data
- `index.html` - Dashboard (GitHub Pages)
- `app.js` - Dashboard logic
- `styles.css` - Dashboard styles
