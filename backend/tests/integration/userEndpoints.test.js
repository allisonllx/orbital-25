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

//     // Test for updating profile picture
//     test('PUT /users/update-profile-pic/:userId - success', async () => {
//         const updatedUser = {
//             id: 1,
//             profile_pic: 'https://i.pravatar.cc/300'
//         };

//         pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

//         const res = await request(app)
//             .put('/users/update-profile-pic/1')
//             .send({ profile_pic: 'https://i.pravatar.cc/300' });

//         expect(res.statusCode).toBe(200);
//         expect(res.body.profile_pic).toBe('https://i.pravatar.cc/300');
//     });

//     // Test for user not found in update profile picture (do we need this?)
//     test('PUT /users/update-profile-pic/:userId - user not found', async () => {
//         pool.query.mockResolvedValueOnce({ rows: [] });

//         const res = await request(app)
//             .put('/users/update-profile-pic/999')
//             .send({ profile_pic: 'https://i.pravatar.cc/300' });

//         expect(res.statusCode).toBe(404);
//         expect(res.body.error).toBe('User not found');
//     });

})