const mockRedis = {
  connect: jest.fn().mockResolvedValue(),
  quit: jest.fn().mockResolvedValue(),
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

jest.mock('redis', () => ({ createClient: () => mockRedis }));

const request = require('supertest');
const app = require('../../app');
const pool = require('../../db/index');
const utils = require('../../utils');

jest.mock('../../db/index');
jest.mock('../../utils');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Task Endpoints', () => {
  test('GET /tasks - no filters returns tasks', async () => {
    const mockTasks = [{ id: 1, title: 'Task 1' }, { id: 2, title: 'Task 2' }]; // testing on only a few columns
    pool.query.mockResolvedValueOnce({ rows: mockTasks });

    const res = await request(app).get('/tasks');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockTasks);
  });

  test('GET /tasks/:taskId - returns single task', async () => {
    const mockTask = { id: 1, title: 'Task 1' };
    pool.query.mockResolvedValueOnce({ rows: [mockTask] });

    const res = await request(app).get('/tasks/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockTask);
  });

  test('GET /tasks/:taskId/comments - returns comments', async () => {
    const mockComments = [
      { id: 1, taskId: 1, content: 'comment1' },
      { id: 2, taskId: 1, content: 'comment2' },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockComments });

    const res = await request(app).get('/tasks/1/comments');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockComments);
  });

  test('POST /tasks - missing fields returns 400', async () => {
    const res = await request(app).post('/tasks').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  test('POST /tasks - creates task successfully', async () => {
    const embeddingMock = new Array(5).fill(0.1);
    utils.generateEmbeddings.mockResolvedValueOnce(embeddingMock);

    const newTask = {
      user_id: 1,
      category: ['work'],
      title: 'Test Task',
      caption: 'Test caption',
    };
    const dbReturn = { id: 1, ...newTask };

    pool.query.mockResolvedValueOnce({ rows: [dbReturn] });

    const res = await request(app).post('/tasks').send(newTask);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Task created successfully');
    expect(res.body.content).toEqual(dbReturn);
    expect(utils.generateEmbeddings).toHaveBeenCalledWith('Test Task Test caption');
  });

  test('POST /tasks/:taskId/comments - missing fields returns 400', async () => {
    const res = await request(app).post('/tasks/1/comments').send({ userId: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  test('POST /tasks/:taskId/comments - creates comment successfully', async () => {
    const newComment = {
      userId: 1,
      content: 'Nice task!',
    };
    const dbReturn = { id: 1, user_id: 1, task_id: 1, content: 'Nice task!' };

    pool.query.mockResolvedValueOnce({ rows: [dbReturn] });

    const res = await request(app).post('/tasks/1/comments').send(newComment);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Comment created successfully');
    expect(res.body.content).toEqual(dbReturn);
  });

  test('PUT /tasks/:taskId - updates task successfully', async () => {
    const embeddingMock = new Array(5).fill(0.2);
    utils.generateEmbeddings.mockResolvedValueOnce(embeddingMock);

    const updatedTask = {
      category: ['personal'],
      title: 'Updated Title',
      caption: 'Updated Caption',
      completed: true,
    };
    const dbReturn = { id: 1, ...updatedTask };

    pool.query.mockResolvedValueOnce({ rows: [dbReturn] });

    const res = await request(app).put('/tasks/1').send(updatedTask);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(dbReturn);
    expect(utils.generateEmbeddings).toHaveBeenCalledWith('Updated Title Updated Caption');
  });

  test('PUT /tasks/:taskId - task not found returns 404', async () => {
    utils.generateEmbeddings.mockResolvedValueOnce(new Array(5).fill(0));

    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/tasks/999').send({
      category: ['other'],
      title: 'No task',
      caption: 'No caption',
      completed: false,
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });
});