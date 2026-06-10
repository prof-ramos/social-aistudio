<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# policies

## Purpose
Business rule validators that encapsulate domain-specific logic. Ensures data integrity and authorization rules are enforced at the application layer.

## Key Files

| File | Description |
|------|-------------|
| `postPolicy.ts` | Post creation and editing business rules — content validation, permissions |
| `postPolicy.test.ts` | Tests for post policy validation |

## For AI Agents

### Working In This Directory
- Policies are pure validation functions — no side effects, no database access
- Run policy checks after user input, before service calls
- Each policy focuses on a single domain entity (e.g., posts)
- Tests should cover valid and invalid inputs

<!-- MANUAL: -->
