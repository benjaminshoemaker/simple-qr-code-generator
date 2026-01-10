# AGENTS.md

Workflow guidelines for AI agents executing tasks from EXECUTION_PLAN.md.

## Project Context

**Tech Stack:** TypeScript, Next.js 14+ (App Router), Tailwind CSS, Drizzle ORM, Neon (PostgreSQL), NextAuth.js v5, Stripe

**Dev Server:** `npm run dev` → `http://localhost:3000` (wait 3s for startup)

---

## Workflow

```
HUMAN (Orchestrator)
├── Completes pre-phase setup
├── Assigns tasks from EXECUTION_PLAN.md
├── Reviews and approves at phase checkpoints

AGENT (Executor)
├── Executes one task at a time
├── Works in git branch (one per phase)
├── Follows TDD: tests first, then implementation
├── Runs verification against acceptance criteria
└── Reports completion or blockers
```

---

## Task Execution

1. **Load context** — Read AGENTS.md, TECHNICAL_SPEC.md, and your task from EXECUTION_PLAN.md
2. **Check dependencies** — Confirm prior tasks are complete
3. **Create branch** — If first task in phase: `git checkout -b phase-{N}`
4. **Write tests first** — One test per acceptance criterion
5. **Implement** — Minimum code to pass tests
6. **Verify** — Run tests, type check, lint
7. **Update progress** — Check off completed criteria in EXECUTION_PLAN.md: `- [ ]` → `- [x]`
8. **Commit** — Format: `task(1.1.A): brief description`

---

## Context Management

**Start fresh for each task.** Do not carry conversation history between tasks.

Before starting, load: AGENTS.md, TECHNICAL_SPEC.md, your task from EXECUTION_PLAN.md.

**Preserve context while debugging.** If tests fail, continue in same conversation until resolved.

**Use `/compact` between steps** to free context.

---

## Testing Policy

- Tests must exist for every acceptance criterion
- All tests must pass before reporting complete
- Never skip or disable tests to make them pass
- Read full error output before attempting fixes

---

## Verification

After implementing each task:
1. `npm test` — run tests
2. `npm run build` — type check
3. `npm run lint` — lint
4. Manual check — verify each acceptance criterion

---

## When to Stop and Ask

Stop and ask the human if:
- A dependency is missing
- You need environment variables or secrets
- Acceptance criteria are ambiguous
- A test fails and you cannot determine why
- You need to modify files outside your task scope

**Blocker format:**
```
BLOCKED: Task {id}
Issue: {what's wrong}
Tried: {what you attempted}
Need: {what would unblock}
```

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

## Completion Report

When done: what was built, files created/modified, test status, commit hash.

---

## Follow-Up Items

When you discover items outside current task scope (refactoring, edge cases, tech debt): note them for TODOS.md, do not fix without approval, mention in completion report.
