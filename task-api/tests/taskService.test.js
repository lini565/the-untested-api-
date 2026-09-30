const taskService = require('../src/services/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('should create a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
    });

    test('should create a task with provided optional fields', () => {
      const dueDate = '2026-12-31T23:59:59.000Z';
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate,
      });

      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Detailed description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll', () => {
    test('should return an empty array when no tasks exist', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    test('should return all created tasks', () => {
      const t1 = taskService.create({ title: 'Task 1' });
      const t2 = taskService.create({ title: 'Task 2' });
      const all = taskService.getAll();

      expect(all.length).toBe(2);
      expect(all).toEqual([t1, t2]);
    });

    test('should return a copy of the tasks array so external mutations do not alter internal array directly', () => {
      taskService.create({ title: 'Task 1' });
      const all = taskService.getAll();
      all.push({ title: 'Fake Task' });
      expect(taskService.getAll().length).toBe(1);
    });
  });

  describe('findById', () => {
    test('should find existing task by id', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toEqual(created);
    });

    test('should return undefined if task id is not found', () => {
      const found = taskService.findById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('should return tasks matching given status strictly', () => {
      const t1 = taskService.create({ title: 'Task 1', status: 'todo' });
      const t2 = taskService.create({ title: 'Task 2', status: 'in_progress' });
      const t3 = taskService.create({ title: 'Task 3', status: 'done' });

      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toEqual([t1]);

      const inProgressTasks = taskService.getByStatus('in_progress');
      expect(inProgressTasks).toEqual([t2]);

      const doneTasks = taskService.getByStatus('done');
      expect(doneTasks).toEqual([t3]);
    });

    test('should not match partial status substring (bugfix verification)', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      // Searching status='do' should strictly match nothing since status must be exact
      const matchedDo = taskService.getByStatus('do');
      expect(matchedDo).toEqual([]);
    });
  });

  describe('getPaginated', () => {
    test('should return paginated slice of tasks with 1-based indexing', () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      // Page 1 should return first 2 items (indices 0 and 1)
      const page1 = taskService.getPaginated(1, 2);
      expect(page1.length).toBe(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      // Page 2 should return next 2 items (indices 2 and 3)
      const page2 = taskService.getPaginated(2, 2);
      expect(page2.length).toBe(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');
    });

    test('should default to page 1 when page <= 0 is provided', () => {
      taskService.create({ title: 'Task 1' });
      const page0 = taskService.getPaginated(0, 5);
      expect(page0.length).toBe(1);
      expect(page0[0].title).toBe('Task 1');
    });
  });

  describe('getStats', () => {
    test('should calculate status counts and overdue tasks accurately', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day future

      taskService.create({ title: 'Todo Overdue', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Todo Normal', status: 'todo', dueDate: futureDate });
      taskService.create({ title: 'In Progress Overdue', status: 'in_progress', dueDate: pastDate });
      taskService.create({ title: 'Done Overdue', status: 'done', dueDate: pastDate }); // done tasks should not count as overdue

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(2);
    });

    test('should handle tasks with no status or no dueDate or unknown status gracefully', () => {
      taskService.create({ title: 'No Due Date', status: 'todo' });
      // Direct push to simulate task with invalid/unknown status
      const allTasks = taskService.getAll();
      allTasks.push({ id: '99', title: 'Custom Status', status: 'unknown', dueDate: null, completedAt: null, createdAt: '' });
      
      const stats = taskService.getStats();
      expect(stats.todo).toBe(1);
      expect(stats.overdue).toBe(0);
    });
  });

  describe('update', () => {
    test('should update specified fields of an existing task', () => {
      const created = taskService.create({ title: 'Initial Title', priority: 'low' });
      const updated = taskService.update(created.id, { title: 'Updated Title', priority: 'high' });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(taskService.findById(created.id).title).toBe('Updated Title');
    });

    test('should return null when attempting to update non-existent task', () => {
      const updated = taskService.update('invalid-id', { title: 'New Title' });
      expect(updated).toBeNull();
    });
  });

  describe('remove', () => {
    test('should remove an existing task and return true', () => {
      const created = taskService.create({ title: 'To Delete' });
      const success = taskService.remove(created.id);

      expect(success).toBe(true);
      expect(taskService.findById(created.id)).toBeUndefined();
      expect(taskService.getAll().length).toBe(0);
    });

    test('should return false when trying to remove a non-existent task', () => {
      const success = taskService.remove('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('completeTask', () => {
    test('should mark task as completed preserving original priority (bugfix verification)', () => {
      const created = taskService.create({ title: 'Task to Complete', priority: 'high' });
      const completed = taskService.completeTask(created.id);

      expect(completed.id).toBe(created.id);
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(completed.priority).toBe('high'); // Priority preserved!
    });

    test('should return null when trying to complete a non-existent task', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    test('should assign task to specified user and return updated task', () => {
      const created = taskService.create({ title: 'Task to Assign' });
      expect(created.assignee).toBeNull();

      const assigned = taskService.assignTask(created.id, '  Bob Builder  ');
      expect(assigned.id).toBe(created.id);
      expect(assigned.assignee).toBe('Bob Builder');
      expect(taskService.findById(created.id).assignee).toBe('Bob Builder');
    });

    test('should return null when assigning a non-existent task', () => {
      const result = taskService.assignTask('non-existent-id', 'Alice');
      expect(result).toBeNull();
    });
  });

  describe('_reset', () => {
    test('should clear all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService._reset();
      expect(taskService.getAll()).toEqual([]);
    });
  });
});
