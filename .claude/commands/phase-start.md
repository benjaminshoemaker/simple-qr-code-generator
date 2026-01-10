---
description: Execute all tasks in a phase autonomously
argument-hint: [phase-number]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

Execute all steps and tasks in Phase $1 from EXECUTION_PLAN.md.

## Context

Before starting, read these files:
- **AGENTS.md** — Follow all workflow conventions
- **EXECUTION_PLAN.md** — Task definitions and acceptance criteria

## Execution Rules

1. **Git Workflow (Auto-Commit)**

   **One branch per phase, one commit per task:**
   ```
   main
     └── phase-$1 (branch)
           ├── task(1.1.A): Add user model       ← step 1.1
           ├── task(1.1.B): Add user routes
           ├── task(1.1.C): Add user tests
           ├── task(1.2.A): Add auth middleware   ← step 1.2 continues
           ├── task(1.2.B): Add login endpoint
           └── task(1.3.A): Add session handling  ← step 1.3 continues
   ```

   Before starting the phase (once, at the beginning):
   ```bash
   # Commit any dirty files first (preserves user work)
   git add -A && git diff --cached --quiet || git commit -m "wip: uncommitted changes before phase-$1"

   # Create phase branch from current HEAD
   git checkout -b phase-$1
   ```

   After each task completion (sequential commits on same branch):
   ```bash
   git add -A
   git commit -m "task({id}): {description}"
   ```

   **Do NOT push.** Leave pushing to the human after manual verification at checkpoint.

   **Commit discipline:**
   - Every task gets its own commit immediately after verification passes
   - All commits are sequential on the phase branch—each builds on the previous
   - Steps are logical groupings, not separate branches
   - Never batch multiple tasks into one commit
   - Include task ID in commit message for traceability
   - Use conventional commit format: `task({id}): {imperative description}`

2. **Task Execution** (for each task)
   - Read the task definition and acceptance criteria
   - Write tests first (one per acceptance criterion)
   - Implement minimum code to pass tests
   - Run verification using /verify-task
   - Update checkboxes in EXECUTION_PLAN.md: `- [ ]` → `- [x]`
   - **Commit immediately** (see Git Workflow above)

3. **Stuck Detection and Recovery**

   Track consecutive failures. If ANY of these occur, **STOP and escalate to human**:

   | Trigger | Threshold | Action |
   |---------|-----------|--------|
   | Consecutive task failures | 3 tasks | Pause phase |
   | Same error pattern | 2 occurrences | Pause and report pattern |
   | Verification loop | 5 attempts on same criterion | Mark task blocked |
   | Test flakiness | Same test passes then fails | Flag for review |

   **When stuck, report:**
   ```
   STUCK: Phase $1, Task {id}
   ─────────────────────────────
   Pattern: {describe what keeps failing}
   Attempts: {N}

   Last 3 errors:
   1. {error summary}
   2. {error summary}
   3. {error summary}

   Possible causes:
   - {hypothesis 1}
   - {hypothesis 2}

   Options:
   1. Skip this task and continue
   2. Modify acceptance criteria
   3. Take a different approach: {suggestion}
   4. Abort phase for manual intervention
   ```

   **Do not:**
   - Keep retrying the same approach
   - Silently skip failing tasks
   - Reduce test coverage to make things pass

4. **Blocking Issues**
   - If blocked, report using the format in AGENTS.md
   - Do not continue past a blocker without resolution

5. **Context Hygiene**
   - Summarize progress between steps if context grows large

## Completion

Do not check back until Phase $1 is complete, unless blocked or stuck.

When done, provide:
- Summary of what was built
- Files created/modified
- Git branch and commits created
- Any issues encountered
- Ready for /phase-checkpoint $1

**Note:** Branches are not pushed automatically. After `/phase-checkpoint` passes, the human will review and push.
