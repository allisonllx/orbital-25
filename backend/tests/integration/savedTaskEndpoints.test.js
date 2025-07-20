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

jest.mock('../../db/index');
jest.mock('../../middlewares/rateLimiter', () => ({
    authLimiter: (req, res, next) => next(),
    usersLimiter: (req, res, next) => next(),
    tasksReadLimiter: (req, res, next) => next(),
    tasksWriteLimiter: (req, res, next) => next(),
    chatLimiter: (req, res, next) => next(),
  }));
jest.mock('../../middlewares/auth', () => (req, res, next) => {
    if (req.headers['authorization'] === 'no-auth') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    req.user = { id: 1, email: 'test@gmail.com' }; // mock decoded token payload
    next();
  });

beforeEach(() => {
    jest.clearAllMocks();
  });

afterAll(() => {
// close any open pool connections if needed
if (pool.end) return pool.end();
});

describe('Saved Tasks Endpoints', () => {
    describe('POST /users/save-task/:taskId', () => {
        test('successfully saves a task', async () => {
            const savedRow = { user_id: 1, task_id: 42 };
            pool.query.mockResolvedValueOnce({ rows: [savedRow] });
    
            const res = await request(app)
            .post('/users/save-task/42')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Task saved successfully');
            expect(res.body.content).toEqual(savedRow);
        });
    
        test('returns 409 if task already saved', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });
    
            const res = await request(app)
            .post('/users/save-task/42')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Task already saved');
        });
    
        test('returns 401 if unauthorized', async () => {
            // override auth mock to simulate no user
    
            const res = await request(app)
                .post('/users/save-task/42')
                .set('authorization', 'no-auth'); // trigger unauthorized path
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
        });
        });
    
        describe('DELETE /users/unsave-task/:taskId', () => {
        test('successfully unsaves a task', async () => {
            const deletedRow = { user_id: 1, task_id: 42 };
            pool.query.mockResolvedValueOnce({ rows: [deletedRow] });
    
            const res = await request(app)
            .delete('/users/unsave-task/42')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Task unsaved successfully');
        });
    
        test('returns 404 if saved task not found', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });
    
            const res = await request(app)
            .delete('/users/unsave-task/42')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Saved task not found');
        });
    
        test('returns 401 if unauthorized', async () => {
            const res = await request(app)
                .delete('/users/unsave-task/42')
                .set('authorization', 'no-auth'); // trigger unauthorized path
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
        });
        });
    
        describe('GET /tasks/saved', () => {
        test('fetches saved tasks successfully', async () => {
            const savedTasks = [{ task_id: 1 }, { task_id: 2 }];
            pool.query.mockResolvedValueOnce({ rows: savedTasks });
    
            const res = await request(app)
            .get('/tasks/saved')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(savedTasks);
        });
    
        test('returns 401 if unauthorized', async () => {
            const res = await request(app)
                .get('/tasks/saved')
                .set('authorization', 'no-auth'); // trigger unauthorized path
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Unauthorized');
        });
    
        test('handles server error gracefully', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB failure'));
    
            const res = await request(app)
            .get('/tasks/saved')
            .set('Authorization', 'Bearer fake-token');
    
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to fetch saved tasks');
        });
    });
});
  