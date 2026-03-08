# AGENTS.md

Project-wide workflow guidance for AI agents working in this project.

## Instruction Hierarchy

- This file is the durable, project-wide baseline.
- Initial greenfield execution guidance lives in `plans/greenfield/AGENTS.md`.
- Feature execution guidance lives in `features/<name>/AGENTS.md`.
- When working in a scoped directory, read this file first, then the local `AGENTS.md` or `CLAUDE.md` in that directory.

## Project Context

**Tech Stack:** TypeScript, Next.js 14+ (App Router), Tailwind CSS, Drizzle ORM, Neon (PostgreSQL), NextAuth.js v5, Stripe

**Dev Server:** `npm run dev` → `http://localhost:3000` (wait 3s for startup)

---

## Git Conventions

**Branch:** `phase-{N}` (one branch per phase)
**Commit:** `task({id}): {description}`

Do not push until human reviews at checkpoint.

---

## Guardrails

- Make the smallest change that satisfies acceptance criteria
- Do not duplicate files to work around issues — fix the original
- Do not guess — if you can't access something, say so
- Do not introduce new APIs without flagging for spec updates
- Read error output fully before attempting fixes

---

## Follow-Up Items

When you discover items outside current task scope (refactoring, edge cases, tech debt): note them for TODOS.md, do not fix without approval, mention in completion report.
