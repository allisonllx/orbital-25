const request = require('supertest');
const app = require('../../app');
const pool = require('../../db.js');

jest.mock('../../db.js');

beforeEach(() => {
    jest.clearAllMocks();
  });

describe('User Endpoints', () => {
    test('GET /users/:userId - success', async () => {
        const mockUser = {
          id: 1,
          name: 'Alice',
          email: 'e1234567@u.nus.edu',
          password: 'hashed_password',
          last_seen: '2025-01-01T00:00:00.000Z',
          points: 0,
          interests: []
        };
    
        pool.query.mockResolvedValueOnce({ rows: [mockUser] });
    
        const res = await request(app).get('/users/1');
    
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockUser);
    });

    test('PUT /users/system-update/:userId - update lastSeen only', async () => {
        const mockUpdated = { id: 1, last_seen: '2025-06-20T00:00:00.000Z', points: 5 };
        pool.query.mockResolvedValueOnce({ rows: [mockUpdated] });

        const res = await request(app)
            .put('/users/system-update/1')
            .send({ lastSeen: '2025-06-20T00:00:00.000Z' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockUpdated);
    });

    test('PUT /users/system-update/:userId - update points only', async () => {
        const mockUpdated = { id: 1, last_seen: 'unchanged', points: 10 };
        pool.query.mockResolvedValueOnce({ rows: [mockUpdated] });

        const res = await request(app)
            .put('/users/system-update/1')
            .send({ points: 10 });

        expect(res.statusCode).toBe(200);
        expect(res.body.points).toBe(10);
    });

    test('PUT /users/system-update/:userId - no fields', async () => {
        const res = await request(app)
            .put('/users/system-update/1')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/At least one field/i);
    });

    test('PUT /users/update-password/:userId - success', async () => {
        const updatedUser = { id: 1, email: 'e1234567@u.nus.edu', password: 'hashed_new' };
        pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

        const res = await request(app)
            .put('/users/update-password/1')
            .send({ password: 'hashed_new' });

        expect(res.statusCode).toBe(200);
        expect(res.body.password).toBe('hashed_new');
    });

    test('PUT /users/update-password/:userId - user not found', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/users/update-password/999')
            .send({ password: 'irrelevant' });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('User not found');
    });
})