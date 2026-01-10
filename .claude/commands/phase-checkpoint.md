---
description: Run checkpoint criteria after completing a phase
argument-hint: [phase-number]
allowed-tools: Bash, Read, Edit, Glob, Grep, AskUserQuestion
---

Phase $1 is complete. Read EXECUTION_PLAN.md and run the checkpoint criteria.

## Automated Checks

Run these commands and report results:

1. **Tests**
   ```
   npm test
   ```
   (or equivalent test command from AGENTS.md)

2. **Type Checking**
   ```
   npm run typecheck
   ```
   (or equivalent, if applicable)

3. **Linting**
   ```
   npm run lint
   ```
   (or equivalent, if applicable)

4. **Security Scan**

   Run security checks:
   - Run dependency audit (npm audit, pip-audit, etc.)
   - Run secrets detection (grep for API keys, tokens, passwords)
   - Run static analysis for insecure patterns

   For CRITICAL or HIGH issues:
   - Present each issue with resolution options
   - Apply fixes based on user choices
   - Re-scan to confirm resolution

   Security scan blocks checkpoint if CRITICAL or HIGH issues remain unresolved.

## Manual Verification

From the "Phase $1 Checkpoint" section in EXECUTION_PLAN.md:
- List each manual verification item
- Indicate what I need to verify before proceeding

## Regression Check (if feature work)

- Confirm existing tests still pass
- Note any changes to existing functionality

## Report

```
Phase $1 Checkpoint Results
===========================

Automated Checks:
- [ ] Tests: PASSED/FAILED
- [ ] Type Check: PASSED/FAILED/SKIPPED
- [ ] Linting: PASSED/FAILED/SKIPPED
- [ ] Security: PASSED/FAILED/PASSED WITH NOTES

Security Summary: X critical, Y high, Z medium (if applicable)

Manual Verification Required:
- [ ] {item from EXECUTION_PLAN.md}
- [ ] {item from EXECUTION_PLAN.md}

Overall: Ready to proceed to Phase {next} | Issues to address
```
