const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('should return an empty array initially', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should return list of all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    test('should filter tasks by status when ?status query param is provided', async () => {
      taskService.create({ title: 'Task Todo', status: 'todo' });
      taskService.create({ title: 'Task Done', status: 'done' });

      const res = await request(app).get('/tasks?status=done');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task Done');
    });

    test('should paginate tasks when ?page or ?limit query params are provided', async () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    test('should fallback to default page=1 and limit=10 if invalid numbers are passed', async () => {
      taskService.create({ title: 'Task 1' });

      const res = await request(app).get('/tasks?page=invalid&limit=invalid');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /tasks/stats', () => {
    test('should return status counts and overdue counts', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 0,
      });
    });
  });

  describe('POST /tasks', () => {
    test('should create a task with valid payload (happy path)', async () => {
      const payload = {
        title: 'New Integration Task',
        description: 'Testing POST endpoint',
        priority: 'high',
      };

      const res = await request(app).post('/tasks').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(payload.title);
      expect(res.body.description).toBe(payload.description);
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('todo');
      expect(res.body.assignee).toBeNull();
      expect(res.body.id).toBeDefined();
    });

    test('should return 400 when payload is missing required title', async () => {
      const res = await request(app).post('/tasks').send({ description: 'No title' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 400 when invalid status is provided', async () => {
      const res = await request(app).post('/tasks').send({
        title: 'Task',
        status: 'invalid_status',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    test('should return 400 when invalid priority is provided', async () => {
      const res = await request(app).post('/tasks').send({
        title: 'Task',
        priority: 'super_high',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });

    test('should return 400 when invalid dueDate is provided', async () => {
      const res = await request(app).post('/tasks').send({
        title: 'Task',
        dueDate: 'not-a-valid-date',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update existing task (happy path)', async () => {
      const created = taskService.create({ title: 'Original Title' });
      const payload = { title: 'Updated Title', status: 'in_progress' };

      const res = await request(app).put(`/tasks/${created.id}`).send(payload);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in_progress');
    });

    test('should return 400 if update payload is invalid', async () => {
      const created = taskService.create({ title: 'Original Title' });

      const res = await request(app).put(`/tasks/${created.id}`).send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 404 if task id does not exist', async () => {
      const res = await request(app).put('/tasks/non-existent-id').send({ title: 'New Title' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete an existing task (happy path)', async () => {
      const created = taskService.create({ title: 'To Be Deleted' });

      const res = await request(app).delete(`/tasks/${created.id}`);
      expect(res.status).toBe(204);

      const fetchRes = await request(app).get('/tasks');
      expect(fetchRes.body.length).toBe(0);
    });

    test('should return 404 when deleting a non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('should mark task as complete (happy path)', async () => {
      const created = taskService.create({ title: 'Task to Complete' });

      const res = await request(app).patch(`/tasks/${created.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeDefined();
    });

    test('should return 404 when completing non-existent task', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('should assign task to user (happy path)', async () => {
      const created = taskService.create({ title: 'Task to assign' });

      const res = await request(app)
        .patch(`/tasks/${created.id}/assign`)
        .send({ assignee: 'Charlie' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.assignee).toBe('Charlie');
    });

    test('should return 400 if assignee is missing or empty string', async () => {
      const created = taskService.create({ title: 'Task' });

      const res1 = await request(app).patch(`/tasks/${created.id}/assign`).send({});
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('assignee is required');

      const res2 = await request(app).patch(`/tasks/${created.id}/assign`).send({ assignee: '   ' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('assignee is required');
    });

    test('should return 404 if task id does not exist', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Charlie' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('Error handling middleware', () => {
    test('should catch unhandled errors and return 500', async () => {
      const spy = jest.spyOn(taskService, 'getAll').mockImplementationOnce(() => {
        throw new Error('Database unexpected explosion');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });

      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});
