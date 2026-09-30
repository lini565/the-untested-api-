# Bug Report — Take-Home Assignment: The Untested API

## Overview

This report details the bugs discovered in the Task Manager API during test-driven code analysis and execution.

---

## Bug 1: Partial Substring Matching in `getByStatus`

- **File**: `src/services/taskService.js` (Line 9)
- **Discovered Via**: Unit test analysis in `tests/taskService.test.js`.
- **Expected Behavior**: `taskService.getByStatus('todo')` should strictly return tasks whose `status` is exactly `'todo'`.
- **Actual Behavior**: The code uses `tasks.filter((t) => t.status.includes(status))`. Passing `status = 'do'` returns tasks with status `'todo'` AND status `'done'` because both strings contain `'do'`.
- **Impact**: Filtering tasks by status via `GET /tasks?status=do` or status values that are substrings returns incorrect tasks.
- **Fix**: Replace `.includes(status)` with strict equality comparison `===`:
  ```javascript
  const getByStatus = (status) => tasks.filter((t) => t.status === status);
  ```

---

## Bug 2: Off-By-One Offset in Pagination Calculation

- **File**: `src/services/taskService.js` (Line 11–14) & `src/routes/tasks.js` (Line 19–24)
- **Discovered Via**: Integration test execution for `GET /tasks?page=1&limit=2`.
- **Expected Behavior**: In 1-based page indexing, requesting `page = 1` with `limit = 10` should return the first page of results (indices `0` to `9`). Passing `page = 0` should also safely default to page 1.
- **Actual Behavior**: 
  - `getPaginated` calculates `offset = page * limit`. When `page = 1` and `limit = 2`, `offset` becomes `2`, skipping the first 2 tasks (returning tasks at index 2 and 3 instead of 0 and 1).
  - In `routes/tasks.js`, `parseInt("0") || 1` evaluates `0 || 1`, converting `page=0` to `1`, which then skips the first page due to the offset bug.
- **Impact**: API clients requesting `page=1` miss the first `limit` items of their data set.
- **Fix**: Update pagination offset calculation to handle 1-indexed pages properly:
  ```javascript
  const getPaginated = (page, limit) => {
    const pageNum = Math.max(1, page);
    const offset = (pageNum - 1) * limit;
    return tasks.slice(offset, offset + limit);
  };
  ```

---

## Bug 3: Priority Reset in `completeTask`

- **File**: `src/services/taskService.js` (Line 63–77)
- **Discovered Via**: Unit testing `completeTask` with a task created with `priority: 'high'`.
- **Expected Behavior**: Marking a task as complete should set `status = 'done'` and record `completedAt`, while preserving the task's existing priority.
- **Actual Behavior**: `completeTask` explicitly hardcodes `priority: 'medium'` in the updated object:
  ```javascript
  const updated = {
    ...task,
    priority: 'medium', // <--- Bug: overwrites high/low priority
    status: 'done',
    completedAt: new Date().toISOString(),
  };
  ```
- **Impact**: Completing a high-priority task silently downgrades its priority to medium.
- **Fix**: Remove `priority: 'medium'` from the updated object:
  ```javascript
  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };
  ```

---

## Bug 4: Silent Failure on Invalid `dueDate` in Stats Calculation

- **File**: `src/services/taskService.js` (Line 23)
- **Discovered Via**: Static code inspection of `getStats`.
- **Expected Behavior**: Overdue date comparison should validate date parsing to prevent invalid date comparisons.
- **Actual Behavior**: If `t.dueDate` contains an invalid date string, `new Date(t.dueDate)` evaluates to `Invalid Date` (`NaN`), causing `new Date(t.dueDate) < now` to evaluate to `false` without warning.
- **Impact**: Corrupted or improperly formatted dates silently fail to be flagged as overdue in statistics.
- **Fix**: Validate parsed timestamp before comparing against `now`:
  ```javascript
  const dueDate = t.dueDate ? new Date(t.dueDate) : null;
  const isValidDate = dueDate && !isNaN(dueDate.getTime());
  if (isValidDate && t.status !== 'done' && dueDate < now) {
    overdue++;
  }
  ```
