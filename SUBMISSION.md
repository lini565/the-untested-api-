# Take-Home Assignment Submission: The Untested API

## Overview

This repository contains the full submission (Day 1 & Day 2) for the **Task Manager API** take-home assignment.

---

## Deliverables Summary

1. 🧪 **Full Test Suite & 98.7% Code Coverage**: Unit & Integration tests in `task-api/tests/`
2. 🐞 **Bug Report**: Documented in [`BUG_REPORT.md`](./BUG_REPORT.md)
3. 🛠️ **Bug Fixes**: Resolved pagination offset, status substring matching, priority reset on completion, and date parsing bugs.
4. ✨ **New Endpoint Feature**: Implemented `PATCH /tasks/:id/assign` with input validation and comprehensive tests.

---

## Part A: Bug Report Summary

See [`BUG_REPORT.md`](./BUG_REPORT.md) for full details.

| Bug # | Location | Description | Status |
|---|---|---|---|
| **1** | `taskService.js` (L9) | Partial status substring matching (`status.includes(status)` matches `do` against `todo` & `done`) | 🟢 Fixed |
| **2** | `taskService.js` & `routes/tasks.js` | 1-based pagination offset bug (`page * limit` skipped page 1 items) | 🟢 Fixed |
| **3** | `taskService.js` (L69) | `completeTask()` forcibly reset task priority to `'medium'` | 🟢 Fixed |
| **4** | `taskService.js` (L23) | Invalid date string caused silent failure in overdue calculation | 🟢 Fixed |

---

## Part B: Bug Fixes & Refactoring

### 1. Fixed Substring Matching in `getByStatus`
- Changed `t.status.includes(status)` to strict equality `t.status === status`.
- Verified with unit tests in `taskService.test.js`.

### 2. Fixed Pagination Offset
- Updated `getPaginated` offset formula to `(Math.max(1, page) - 1) * limit`.
- Requesting `GET /tasks?page=1&limit=2` now correctly returns the first two tasks (index 0 and 1).

### 3. Preserved Priority in `completeTask`
- Removed hardcoded `priority: 'medium'` from `completeTask` update object so task's original priority (`high` or `low`) is preserved upon completion.

---

## Part C: New Feature — `PATCH /tasks/:id/assign`

### Implementation & Design Decisions

1. **Endpoint**: `PATCH /tasks/:id/assign`
2. **Payload**: `{ "assignee": "string" }`
3. **Task Shape Update**: Added `assignee: null` as default field on task objects.
4. **Validation (`validateAssignTask`)**:
   - Rejects missing body, non-string `assignee`, or empty/whitespace-only strings (`""` or `"   "`) with a `400 Bad Request` (`{ error: 'assignee is required and must be a non-empty string' }`).
   - Automatically trims whitespace from assignee names (e.g. `"  Alice  "` -> `"Alice"`).
5. **Not Found Handling**:
   - Returns `404 Not Found` (`{ error: 'Task not found' }`) if the task ID does not exist in memory.

---

## Test Execution & Coverage Output (`npm run coverage`)

```text
PASS tests/validators.test.js
PASS tests/taskService.test.js
PASS tests/routes.test.js

-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |   98.72 |    97.82 |   96.66 |    98.6 |                   
 src             |   84.61 |       75 |      50 |   84.61 |                   
  app.js         |   84.61 |       75 |      50 |   84.61 | 17-18             
 src/routes      |     100 |      100 |     100 |     100 |                   
  tasks.js       |     100 |      100 |     100 |     100 |                   
 src/services    |     100 |    96.42 |     100 |     100 |                   
  taskService.js |     100 |    96.42 |     100 |     100 | 24                
 src/utils       |     100 |      100 |     100 |     100 |                   
  validators.js  |     100 |      100 |     100 |     100 |                   
-----------------|---------|----------|---------|---------|-------------------

Test Suites: 3 passed, 3 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        13.627 s
```

---

## Reflections & Future Work

- **What I'd test next**: Load and concurrency stress testing for in-memory array operations, XSS sanitization on user input strings (`title`, `description`, `assignee`), and rate-limiting middleware.
- **Questions before shipping to production**:
  1. What persistent database (PostgreSQL/MongoDB) will replace the in-memory array store?
  2. How will user authentication (JWT / OAuth2) and task assignment permissions be handled?
