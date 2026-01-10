---
description: Analyze and prioritize TODO items from TODOS.md
allowed-tools: Read, Glob, Grep
---

Analyze the TODO items in TODOS.md and produce a prioritized list with implementation guidance.

## Process

1. **Read TODOS.md** from the project root
2. **Read project context** — Scan PRODUCT_SPEC.md, TECHNICAL_SPEC.md, AGENTS.md, and EXECUTION_PLAN.md if they exist
3. **Extract TODO items** — Parse all actionable items from TODOS.md
4. **Analyze each item** using the framework below
5. **Sort by priority score** (highest first), break ties by value to project
6. **Output the prioritized list**

## Analysis Framework

For each TODO item, evaluate:

### Ranking Factors

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| **Requirements Clarity** | One-liner with no context, unclear intent | Some details but gaps remain | Detailed spec with acceptance criteria |
| **Ease of Implementation** | Can't assess without clearer requirements | Moderate effort, approach is clear | Straightforward, clear path |
| **Value to Project** | Can't assess without clearer requirements | Useful improvement | Core functionality, high impact |

### Critical Rule: Do NOT Infer

**If requirements clarity is LOW, do NOT attempt to infer what the item means.**

- Do NOT guess the implementation approach
- Do NOT assume what problem it solves
- Set Ease and Value to "Cannot assess"
- Focus Open Questions on understanding the basic intent

A one-liner TODO like "Add feature X" with no additional context = LOW clarity, regardless of how obvious it might seem.

### Priority Score Calculation

```
Priority = (Clarity + Ease + Value) / 3 × 10
```

Where each factor is scored 1-3 (Low=1, Medium=2, High=3), producing a 1-10 scale.

**If Clarity is LOW, cap the Priority Score at 3/10 maximum.**

Adjust score based on:
- **Boost (+1-2):** Blocks other work, security-related, frequently requested
- **Reduce (-1-2):** Speculative, already has workaround, external dependency

## Output Format

### For items with HIGH or MEDIUM requirements clarity:

```markdown
## {N}. {TODO Title}

**Priority Score:** {N}/10
**Ranking Factors:**
- Requirements Clarity: {Medium|High} — {one sentence explanation}
- Ease of Implementation: {Low|Medium|High} — {one sentence explanation}
- Value to Project: {Low|Medium|High} — {one sentence explanation}

**Implementation Notes:**
{2-4 sentences on how to implement: key files to modify, approach, dependencies, estimated scope}

**Open Questions:**
- {Question that would improve requirements clarity}
- {Another question, if applicable}

**Suggested Next Action:** {One of: "Ready to implement", "Needs research", "Consider deferring", "Consider removing"}
```

### For items with LOW requirements clarity:

```markdown
## {N}. {TODO Title}

**Priority Score:** {N}/10 (capped due to unclear requirements)
**Ranking Factors:**
- Requirements Clarity: **Low** — {explain what's missing: no context, unclear intent, etc.}
- Ease of Implementation: Cannot assess
- Value to Project: Cannot assess

**What I understand:** {Brief statement of what little is clear, or "Only the title"}

**What I don't understand:**
- {Specific gap in understanding}
- {Another gap}

**Questions to clarify before proceeding:**
1. {Fundamental question about intent/purpose}
2. {Question about scope}
3. {Question about expected behavior}

**Suggested Next Action:** Clarify requirements first
```

### Summary section:

```markdown
# TODOS Analysis

**Generated:** {date}
**Items Analyzed:** {count}
**Project:** {project name from specs, or directory name}

---

{Individual item analyses, sorted by priority score}

---

## Summary

| Priority | Item | Score | Next Action |
|----------|------|-------|-------------|
| 1 | {title} | {N}/10 | {action} |
| 2 | {title} | {N}/10 | {action} |
| ... | ... | ... | ... |

**Ready to implement:** {count}
**Needs clarification:** {count}
**Consider deferring:** {count}
```

## Notes

- If TODOS.md doesn't exist, report: "No TODOS.md found in project root."
- Skip items that are clearly completed (checked boxes)
- Group related items if they should be tackled together
- Consider project phase — items relevant to current phase score higher
