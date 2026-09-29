# Submission Notes — Day 1

## Overview

This repository contains the Day 1 deliverables for **The Untested API** take-home assignment.

---

## 1. Test Suite & Coverage Summary

A complete unit and integration test suite has been created under `task-api/tests/`:

- `tests/validators.test.js`: Unit tests for schema and input validation logic.
- `tests/taskService.test.js`: Unit tests for service operations and in-memory store management.
- `tests/routes.test.js`: Integration tests for API endpoints using Supertest.

### Test Execution Results

```text
PASS tests/validators.test.js
PASS tests/taskService.test.js
PASS tests/routes.test.js

Test Suites: 3 passed, 3 total
Tests:       53 passed, 53 total
Snapshots:   0 total
Time:        2.937 s
```

### Coverage Report (`npm run coverage`)

```text
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |    98.5 |    97.33 |   96.15 |   98.36 |                   
 src             |   84.61 |       75 |      50 |   84.61 |                   
  app.js         |   84.61 |       75 |      50 |   84.61 | 17-18             
 src/routes      |     100 |      100 |     100 |     100 |                   
  tasks.js       |     100 |      100 |     100 |     100 |                   
 src/services    |     100 |    94.11 |     100 |     100 |                   
  taskService.js |     100 |    94.11 |     100 |     100 | 22                
 src/utils       |     100 |      100 |     100 |     100 |                   
  validators.js  |     100 |      100 |     100 |     100 |                   
-----------------|---------|----------|---------|---------|-------------------
```

---

## 2. Day 1 Reflections & Observations

### What Surprised Me in the Codebase

1. **`getByStatus` Partial Substring Matching**:
   `taskService.js` uses `t.status.includes(status)` rather than strict string equality (`===`). Requesting `GET /tasks?status=do` returns tasks with status `todo` as well as `done`.
2. **Priority Mutation on Complete**:
   Calling `completeTask()` forcibly resets `priority` to `'medium'`, overriding whatever priority (`low` / `high`) the user had previously set for the task.
3. **Pagination Offset Calculation**:
   `getPaginated` calculates `offset = page * limit`. When `page=1` with `limit=10`, `offset` becomes `10`, which skips items `0..9`. Additionally, `parseInt(page) || 1` in `routes/tasks.js` turns `page=0` into `1`.

---

### What I'd Test Next (Given More Time)

1. **Concurrent Request Race Conditions**: Test behavior under rapid parallel read/write operations against the in-memory array.
2. **Payload Schema Edge Cases**: Test injection payloads, extremely long strings, unexpected data types (e.g., boolean or nested objects passed to string fields), and edge-case ISO date formats.
3. **HTTP Header & Query Parameter Edge Cases**: Test behavior with missing `Content-Type: application/json` headers, negative numbers for `page`/`limit`, or floating-point numbers.

---

### Questions I'd Ask Before Shipping to Production

1. **Database & Persistence**: What database (e.g., PostgreSQL / MongoDB) will replace the temporary in-memory store so data persists across server restarts?
2. **Authentication & Authorization**: How will user access control be structured? Should tasks belong to specific user accounts or teams?
3. **Rate Limiting & Operational Monitoring**: Are rate limiters and structured loggers (e.g. Pino / Winston) configured for API safety and observability in production?
