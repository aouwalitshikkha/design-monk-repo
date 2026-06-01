# Design Monk — Work Tracker

Personal consultancy work tracker with a **GitHub Pages dashboard** and a **Node.js CLI** for daily time logging. Built for Design Monk consultancy by Abdul Aouwal.

## GitHub Pages

**Live URL:** [https://aouwalitshikkha.github.io/design-monk-repo/](https://aouwalitshikkha.github.io/design-monk-repo/)

The dashboard is served from the **root of the `main` branch**. To enable or reconfigure:

1. Go to repo **Settings > Pages**
2. Set **Source** to `Deploy from a branch`
3. Select branch `main`, folder `/ (root)`
4. Save — site deploys at `https://<user>.github.io/<repo>/`

The dashboard fetches `work-log.json` and `tasks.json` directly from the `main` branch on `raw.githubusercontent.com`.

## Quick Start

```bash
cd app
npm run log       # Add a daily entry
npm run edit      # Edit an existing entry
npm run task      # Manage tasks
```

See [`app/README.md`](app/README.md) for full documentation — categories, CLI commands, dashboard features.

## Project Structure

| Path | Purpose |
|---|---|
| `index.html` | GitHub Pages dashboard |
| `app/` | CLI tool (`add-entry.js`), dashboard logic (`app.js`), data files |
| `app/work-log.json` | Work entry data |
| `app/tasks.json` | Task data (pending & completed) |
| `app/attachments/` | Note files attached to entries |
| `report/` | SEO audit reports for Design Monks |
| `work-log.bat` | Windows batch menu for the CLI |

## License

MIT
