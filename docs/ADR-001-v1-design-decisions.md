# ADR-001: V1 Design Decisions

**Status**: Accepted
**Date**: 2026-02-03
**Authors**: Greg Williams

---

## Context

Agent Eval Tool V1 is a local-first, single-user web application for human-in-the-loop agent evaluation. This ADR documents the key design decisions made during implementation planning to ensure consistency and provide rationale for future maintainers.

---

## Decisions

### 1. deleteTestRun: Hard Delete

**Decision**: Use hard delete (permanent removal) rather than soft delete (flag-based).

**Rationale**: V1 is local-only with no multi-user or audit requirements. Hard delete keeps the codebase simple and prevents database bloat. Soft delete can be added in V2 if audit trails become necessary.

---

### 2. Transaction Support: Implement

**Decision**: Implement transaction support via a `withTransaction()` helper function.

**Rationale**: Prevent orphaned records when creating test runs with multiple test cases and evaluations. A partial failure should not leave the database in an inconsistent state.

---

### 3. Pagination: Defer to V2

**Decision**: No pagination in V1; defer to V2 backlog.

**Rationale**: V1 targets small datasets (30-50 test cases per run, <10 test runs locally). Pagination adds complexity without proportional benefit at this scale. Added to PRD backlog as D15.

---

### 4. reviewerId Field: Remove for V1

**Decision**: Remove `reviewerId` from the Evaluation interface and database schema.

**Rationale**: V1 is single-user. YAGNI (You Ain't Gonna Need It) applies. Multi-reviewer support is explicitly deferred to V2 (D12 in PRD). Re-adding this field when needed is straightforward.

---

### 5. API Route Sync/Async: Synchronous

**Decision**: API routes execute synchronously and wait for TDX command completion.

**Rationale**:
- TDX test commands have a 5-minute timeout, which is within acceptable HTTP request duration
- Simpler implementation without job queuing infrastructure
- Client shows loading state while waiting
- Async job processing can be added in V2 if test runs exceed timeout

---

### 6. TDX Command Format: Verify Manually

**Decision**: Run TDX commands manually to capture real output format before implementing parsers.

**Rationale**: TDX CLI output format is not formally documented. Manual verification ensures parsers handle actual output structure rather than assumed formats.

---

### 7. Parser Validation: Test with Fixtures

**Decision**: Create test fixtures from real TDX output samples.

**Rationale**: Using captured real output ensures parser compatibility. Fixtures serve as documentation of expected formats and enable regression testing.

---

### 8. listAgentsByProject: Frontend Filtering

**Decision**: Return all agents from `tdx agent list` and filter by project on the frontend.

**Rationale**:
- Simpler API design (single endpoint)
- Expected <50 agents total across all projects
- Frontend filtering provides instant response when switching projects

---

### 9. Retry Logic: User-Initiated Retry

**Decision**: Show a "Retry" button on failure rather than implementing automatic retry with exponential backoff.

**Rationale**:
- Simpler implementation
- User maintains control over retry attempts
- Automatic retry with backoff deferred to V2 (D16 in PRD)

---

### 10. Lucide Icons: Wrapper Approach

**Decision**: Wrap Lucide React icons in a span with a title attribute for accessibility.

**Rationale**: Provides tooltip functionality and accessibility without custom icon components. Simple and consistent pattern across the UI.

---

### 11. Service Layer: Minimal for V1

**Decision**: Keep business logic minimal in V1; simple CRUD operations in route handlers.

**Rationale**:
- V1 operations are straightforward CRUD
- Premature abstraction adds complexity without benefit
- Service layer can be introduced in V2 when business logic grows (D18 in PRD)

---

### 12. Request Validation: Manual Validation

**Decision**: Use manual validation with early returns rather than a validation library.

**Rationale**:
- V1 has few API endpoints with simple request bodies
- Early return pattern is clear and maintainable
- Zod validation deferred to V2 (D17 in PRD)

---

### 13. Logging: Console Logging

**Decision**: Use `console.log` for development logging with documentation in GETTING-STARTED.md.

**Rationale**:
- V1 runs locally in development mode
- Console output visible in terminal running `npm run dev`
- Structured JSON logging deferred to V2 (D19 in PRD)

---

## Summary Table

| # | Issue | Decision | Rationale |
|---|-------|----------|-----------|
| 1 | deleteTestRun | Hard delete | V1 is local-only; no audit trail needed |
| 2 | Transaction support | Implement | Prevent orphaned records on partial failures |
| 3 | Pagination | Defer to V2 | Small dataset in V1; add to PRD backlog |
| 4 | reviewerId field | Remove for V1 | Single-user; YAGNI applies |
| 5 | API route sync/async | Synchronous | 5-min timeout sufficient; simpler |
| 6 | TDX command format | Verify manually | Run commands to capture real output |
| 7 | Parser validation | Test with fixtures | Create samples from real TDX output |
| 8 | listAgentsByProject | Frontend filtering | Simpler; <50 agents expected |
| 9 | Retry logic | User-initiated retry | Show "Retry" button; defer auto-retry |
| 10 | Lucide icons | Wrapper approach | Wrap in span with title attribute |
| 11 | Service layer | Minimal for V1 | Simple CRUD in routes; expand in V2 |
| 12 | Request validation | Manual validation | Use early returns; add Zod in V2 |
| 13 | Logging | Console logging | Add to GETTING-STARTED.md |

---

## Consequences

### Positive
- Simpler V1 implementation
- Faster time to first working version
- Clear upgrade path documented in PRD

### Negative
- Some refactoring required when implementing V2 features
- Manual validation is more verbose than Zod schemas

### Neutral
- Decisions are appropriate for V1 scale and will be revisited for V2

---

## Related Documents

- `/docs/PRD-agent-eval-tool-v1.md` - Product requirements and deferred items
- `/docs/TECHNICAL-implementation-guide.md` - Technical implementation details
- `/docs/implementation-qa-clarifications.md` - Initial Q&A decisions
- `/docs/implementation-qa-round2.md` - UI/UX and behavior clarifications
