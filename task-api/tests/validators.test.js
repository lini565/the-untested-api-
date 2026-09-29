const { validateCreateTask, validateUpdateTask } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateCreateTask', () => {
    test('should pass for a valid minimal task', () => {
      const result = validateCreateTask({ title: 'Valid Title' });
      expect(result).toBeNull();
    });

    test('should pass for a valid full task', () => {
      const result = validateCreateTask({
        title: 'Full Task',
        description: 'Description',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-12-31T00:00:00.000Z',
      });
      expect(result).toBeNull();
    });

    test('should fail when title is missing', () => {
      const result = validateCreateTask({});
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('should fail when title is not a string', () => {
      const result = validateCreateTask({ title: 12345 });
      expect(result).toBe('title is required and must be a non-empty string');
    });

    test('should fail when title is an empty or whitespace string', () => {
      const result1 = validateCreateTask({ title: '' });
      expect(result1).toBe('title is required and must be a non-empty string');

      const result2 = validateCreateTask({ title: '   ' });
      expect(result2).toBe('title is required and must be a non-empty string');
    });

    test('should fail when status is invalid', () => {
      const result = validateCreateTask({ title: 'Task', status: 'invalid_status' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('should fail when priority is invalid', () => {
      const result = validateCreateTask({ title: 'Task', priority: 'urgent' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('should fail when dueDate is invalid', () => {
      const result = validateCreateTask({ title: 'Task', dueDate: 'not-a-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });
  });

  describe('validateUpdateTask', () => {
    test('should pass for an empty update body', () => {
      const result = validateUpdateTask({});
      expect(result).toBeNull();
    });

    test('should pass for valid update fields', () => {
      const result = validateUpdateTask({
        title: 'New Title',
        status: 'done',
        priority: 'low',
        dueDate: '2026-10-10',
      });
      expect(result).toBeNull();
    });

    test('should fail when updated title is not a string', () => {
      const result = validateUpdateTask({ title: 999 });
      expect(result).toBe('title must be a non-empty string');
    });

    test('should fail when updated title is an empty string', () => {
      const result = validateUpdateTask({ title: '  ' });
      expect(result).toBe('title must be a non-empty string');
    });

    test('should fail when updated status is invalid', () => {
      const result = validateUpdateTask({ status: 'completed' });
      expect(result).toBe('status must be one of: todo, in_progress, done');
    });

    test('should fail when updated priority is invalid', () => {
      const result = validateUpdateTask({ priority: 'critical' });
      expect(result).toBe('priority must be one of: low, medium, high');
    });

    test('should fail when updated dueDate is invalid', () => {
      const result = validateUpdateTask({ dueDate: 'bad-date' });
      expect(result).toBe('dueDate must be a valid ISO date string');
    });
  });
});
