---
name: code-verification-lite
description: Single-agent code verification workflow. Cross-tool compatible (works in Claude Code, Codex CLI, Cursor). Use when verifying code against requirements, acceptance criteria, or quality standards.
---

# Code Verification Lite

Verify code against requirements using a single-agent verify-fix loop. This is a simplified version of code-verification that works across different AI coding tools.

## When to Use This vs Full Verification

| Version | Use When |
|---------|----------|
| **code-verification** (full) | Claude Code only, want context isolation, parallel verification |
| **code-verification-lite** | Cross-tool compatibility, simpler workflow, smaller codebases |

## Workflow Overview

```
1. Parse verification instructions into testable items
2. For each instruction:
   a. Pre-flight: Confirm instruction is testable
   b. Verify: Check if instruction is met
   c. If failed: Attempt fix
   d. Re-verify after fix
   e. Repeat c-d up to 5 times or until success
3. Generate verification report
```

## Step 1: Parse Verification Instructions

Extract each verification instruction into a discrete, testable item:

| Field | Description | Example |
|-------|-------------|---------|
| **ID** | Unique identifier | `V-001` |
| **Instruction** | The requirement text | "All API endpoints return JSON" |
| **Test approach** | How to verify | File inspection, run tests, lint, etc. |
| **Files involved** | Which files to examine | `src/api/*.ts` |

### Categorize Each Instruction

Mark each instruction with a verification type:

- `CODE` — Check source code (grep, read files)
- `TEST` — Run test suite
- `LINT` — Run linter/formatter
- `TYPE` — Run type checker
- `BUILD` — Run build process
- `BROWSER` — Requires browser/UI verification (may be skipped if unavailable)

## Step 2: Pre-flight Validation

Before starting verification, confirm each instruction is testable:

```
PRE-FLIGHT CHECK
----------------
[V-001] READY — Clear criteria, files exist
[V-002] READY — Test command available
[V-003] BLOCKED — Ambiguous: "code should be clean" (no measurable criteria)
[V-004] SKIPPED — Browser verification, no dev server available
```

**Flag immediately** (don't attempt verification):
- Ambiguous instructions without clear pass/fail criteria
- Missing required files or resources
- Browser checks when dev server unavailable

## Step 3: Verification Loop

For each READY instruction, run this loop:

```
┌─────────────────────────────────────────┐
│  VERIFY                                 │
│  Check if instruction is met            │
└─────────────────┬───────────────────────┘
                  │
          ┌───────▼───────┐
          │  PASS?        │
          └───────┬───────┘
                  │
       ┌──────────┴──────────┐
       │                     │
      YES                   NO
       │                     │
       ▼                     ▼
   ┌───────┐         ┌─────────────┐
   │ DONE  │         │ Attempts<5? │
   └───────┘         └──────┬──────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                YES                   NO
                 │                     │
                 ▼                     ▼
          ┌─────────────┐       ┌───────────┐
          │ APPLY FIX   │       │ MARK FAIL │
          └──────┬──────┘       └───────────┘
                 │
                 └────► (back to VERIFY)
```

### Verification Output Format

After each verification check, record:

```
VERIFICATION: [V-001]
---------------------
Status: PASS | FAIL | BLOCKED
Location: [file:line or "N/A"]
Finding: [What was found]
Expected: [What was expected]
Suggested Fix: [If FAIL, specific recommendation]
```

### Verification Methods by Type

**CODE verification:**
```
1. Use Grep to search for patterns
2. Use Read to inspect specific files
3. Check for presence/absence of code patterns
```

**TEST verification:**
```
1. Run test command (npm test, pytest, etc.)
2. Parse output for pass/fail
3. Check coverage if specified
```

**LINT verification:**
```
1. Run linter (eslint, ruff, etc.)
2. Check for zero errors (warnings may be acceptable)
```

**TYPE verification:**
```
1. Run type checker (tsc, mypy, etc.)
2. Check for zero type errors
```

**BUILD verification:**
```
1. Run build command
2. Check for successful exit code
3. Verify output artifacts exist
```

## Step 4: Fix Protocol

When verification fails:

1. **Review the finding** — Understand what failed and why
2. **Check fix history** — Don't repeat a previously attempted fix
3. **Apply targeted fix** — Minimum change to address the issue
4. **Log the attempt** — Record what was changed

### Fix Attempt Tracking

Maintain a fix log to avoid repeating failed approaches:

```
FIX LOG: V-002
--------------
Attempt 1: Added missing return type to getUserById() → FAIL (other functions still missing)
Attempt 2: Added return types to all functions in users.ts → PASS
```

### Strategy Escalation

| Attempt | Strategy |
|---------|----------|
| 1-2 | Direct fix based on verification finding |
| 3 | Try alternative approach |
| 4-5 | Broaden scope, consider if requirement is achievable |

**Key rule:** If the same failure pattern repeats twice, explicitly try a different strategy.

## Step 5: Exit Conditions

Exit the verification loop when ANY condition is met:

| Condition | Action |
|-----------|--------|
| Verification PASS | Mark complete, move to next |
| 5 attempts exhausted | Mark FAILED with notes |
| Same failure 3+ times | Exit early, flag for human review |
| Fix introduces regression | Revert, flag for review |

## Step 6: Regression Check

After each fix attempt, verify:

1. **Primary check** — The targeted instruction
2. **Related checks** — Any previously-passing instructions that touch the same files

If a fix breaks something else:
1. Revert the change
2. Note the conflict
3. Flag for human review

## Step 7: Generate Report

After all instructions are processed:

```
VERIFICATION REPORT
===================
Total: 5 instructions
Passed: 3
Failed: 1
Skipped: 1

RESULTS
-------
[V-001] PASS — All functions have return types
[V-002] PASS — No unused imports (fixed: removed 3 unused imports)
[V-003] FAIL — Tests pass with >80% coverage
         Current: 72% coverage
         Attempts: 3
         Blocker: New tests needed for auth module
[V-004] PASS — ESLint passes with zero errors
[V-005] SKIP — Browser verification skipped (no dev server)

FIX SUMMARY
-----------
Files modified: 4
- src/users.ts: Added return types (V-001)
- src/api.ts: Removed unused imports (V-002)
- src/utils.ts: Removed unused imports (V-002)
- src/auth.ts: Added tests (V-003, partial)

RECOMMENDATIONS
---------------
- V-003: Add tests for auth.login() and auth.logout() to reach 80% coverage
- V-005: Run with dev server to complete browser verification
```

## Example

Given acceptance criteria:
```
[ ] All API handlers validate input
[ ] No console.log statements in production code
[ ] Tests pass
```

Execution:

```
1. Parse into V-001, V-002, V-003

2. Pre-flight: All READY

3. V-001: Check for input validation
   - Grep for API handlers without validation
   - FAIL: src/api/users.ts:45 missing validation
   - Fix: Add zod schema validation
   - Re-verify: PASS

4. V-002: Check for console.log
   - Grep for console.log in src/
   - FAIL: Found 3 occurrences
   - Fix: Remove console.log statements
   - Re-verify: PASS

5. V-003: Run tests
   - Execute: npm test
   - PASS: All tests passing

6. Report: 3/3 PASSED
```

## Key Principles

- **One agent, one loop** — No sub-agents, works anywhere
- **Structured output** — Every check produces actionable findings
- **No repeated fixes** — Track attempts to avoid loops
- **Early exit** — Don't waste attempts on unfixable issues
- **Regression awareness** — Fixes shouldn't break other things

## Differences from Full Version

| Feature | Full (code-verification) | Lite (this) |
|---------|--------------------------|-------------|
| Sub-agents | Yes (context isolation) | No (inline) |
| Parallel verification | Yes (up to 10) | No (sequential) |
| Browser verification | Full protocol | Simplified/skippable |
| Tool compatibility | Claude Code only | Claude Code, Codex CLI, Cursor |
| Context accumulation | Isolated per check | Accumulates in main context |
