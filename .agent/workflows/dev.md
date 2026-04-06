---
description: How to run Aether Ink in development mode
---

## Prerequisites
- Node.js 18+ installed
- npm installed

## Steps

// turbo-all

1. Install dependencies (if needed):
```
npm install
```

2. Start the development server:
```
npm run dev
```

3. Open `http://localhost:3000` in your browser

## Notes
- The SQLite database is automatically initialized on first page load via `/api/init`
- Data is stored in `.aether-data/aether-ink.db` (local to the project)
- The `.aether-data` directory should be gitignored
- OpenRouter API key needs to be configured in Settings for LLM features (The Architect)
- Press `Ctrl+K` to open the Command Palette
- Press `Ctrl+B` to toggle sidebar
- Press `Ctrl+J` to toggle The Architect sidecar
