# Design Monk Work Log

Personal consultancy work tracker hosted on GitHub Pages.

## How to Use

### 1. Add Daily Entry

```bash
node add-entry.js
# or
npm run log
```

Prompts for:
- **Date** (defaults to today)
- **Hours worked** (e.g. `1.5`, `30m`, `1h30m`, `1:30`)
- **Category** (select by number)
- **Tasks** (enter one by one, empty to finish)
- **Blockers**
- **Notes**
- **Attachments** — path to `.txt`/`.md` note files to attach

Auto-commits and pushes to GitHub.

### 2. Edit an Existing Entry

```bash
node add-entry.js --edit
# or
npm run edit
```

Shows a numbered list of all entries. Select one by number, then edit any field — press Enter to keep the current value. You can also add attachments to old entries.

### 3. View Dashboard

Visit: [https://aouwalitshikkha.github.io/design-monk-repo/](https://aouwalitshikkha.github.io/design-monk-repo/)

Features:
- **Calendar** — month grid with dots on days that have entries. Click a date to filter.
- **Stats cards** — total entries, hours, categories, avg hours/day
- **Filters** — by category, date range, or keyword search
- **Reports** — Weekly, Monthly, or Custom range
- **Export** — Excel (.xlsx) or PDF
- **Charts** — category breakdown (doughnut) and hours over time (bar)
- **Entries list** — shows last 10 entries

### 4. Categories

- **Research** — Market research, tech exploration
- **Suggestion** — Client recommendations, proposals
- **Consultation** — Advisory sessions
- **Development** — Coding, building
- **Design** — UI/UX, graphics
- **Meeting** — Calls, standups, reviews
- **Documentation** — Docs, guides, specs
- **Learning** — Courses, tutorials
- **Bug Fix** — Debugging, fixes
- **Other** — Anything else

## Setup (First Time)

1. Clone this repo
2. Run `node add-entry.js` to add your first entry
3. Enable GitHub Pages in repo settings (Source: main branch, folder: root)
4. Visit the Pages URL

## Files

- `add-entry.js` — CLI script to add & edit entries
- `work-log.json` — All your work data
- `index.html` — Dashboard (GitHub Pages)
- `app.js` — Dashboard logic (calendar, charts, filters, reports)
- `styles.css` — Dashboard styles
- `attachments/` — Folder for attached note files
