# AGENTS.md

## Project Overview

**Jemi** is a React-based todo list application built with Vite, Tailwind CSS, and TypeScript. It features a playful, aesthetic UI with confetti animations and Lucide icons.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Icons:** lucide-react
- **Animations:** canvas-confetti

## Development Commands

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Vite dev server (port 5173) |
| `npm run build` | Type-check and build for production  |
| `npm run lint`  | Run oxlint linter                    |
| `npm run preview` | Preview the production build       |

## Project Structure

```
girly-todo-app/
├── src/              # Application source code
├── public/           # Static assets
├── index.html        # Entry HTML file
├── vite.config.ts    # Vite configuration
├── vercel.json       # Vercel deployment config (SPA routing)
├── tsconfig.json     # TypeScript configuration
└── package.json      # Dependencies and scripts
```

## Deployment

- **Platform:** Vercel
- **Build Command:** `npm run build` (runs `tsc -b && vite build`)
- **Output Directory:** `dist/`
- **Routing:** SPA fallback configured in `vercel.json` — all routes serve `index.html`

## Code Style

- TypeScript strict mode enabled
- Linting via oxlint
- Tailwind CSS for styling (utility-first approach)
