---
description: Run code-verification on a specific task
argument-hint: [task-id]
---

Verify Task $1 from EXECUTION_PLAN.md using the code verification workflow.

## Task Context

1. Read Task $1 definition from EXECUTION_PLAN.md
2. Extract all acceptance criteria

## Verification Workflow

Follow the code-verification workflow (inline, no sub-agents):

### Step 1: Parse Criteria

For each acceptance criterion, create a verification item:

| Field | Value |
|-------|-------|
| ID | `V-001`, `V-002`, etc. |
| Criterion | The acceptance criterion text |
| Type | `CODE`, `TEST`, `LINT`, `TYPE`, `BUILD`, or `BROWSER` |
| Files | Which files to examine |

### Step 2: Pre-flight Check

Confirm each criterion is testable:
- Clear pass/fail criteria
- Required files exist
- Test commands available

Flag untestable criteria immediately.

### Step 3: Verify Each Criterion

For each criterion:

1. **Check** if the criterion is met
2. **Record** the result:
   ```
   VERIFICATION: [V-001]
   ---------------------
   Status: PASS | FAIL | BLOCKED
   Location: [file:line or "N/A"]
   Finding: [What was found]
   Expected: [What was expected]
   Suggested Fix: [If FAIL]
   ```
3. **If FAIL**: Attempt fix, then re-verify (up to 5 attempts)
4. **Track attempts** to avoid repeating failed fixes

### Step 4: Exit Conditions

Stop verification loop when:
- PASS: Criterion met
- 5 attempts exhausted: Mark failed
- Same failure 3+ times: Flag for human review

### Step 5: Report

```
TASK VERIFICATION: $1
=====================
Criteria: N total
Passed: X
Failed: Y
Skipped: Z

[V-001] PASS — Criterion summary
[V-002] FAIL — Criterion summary
  - Attempts: 3
  - Blocker: Description
```

## On Success

- Check off completed criteria in EXECUTION_PLAN.md: `- [ ]` → `- [x]`
- Report: Task $1 verified, all criteria met

## On Failure

- Report which criteria failed
- Provide fix recommendations
- Do not check off incomplete criteria
