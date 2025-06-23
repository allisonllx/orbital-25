const request = require('supertest');
const app = require('../../app');
const pool = require('../../db.jd');
const sendResetEmail = require('../../mailer');
const redis = require('redis');

jest.mock('../../db.js');
jest.mock('../../mailer');

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};
jest.mock('redis', () => ({ createClient: () => mockRedis }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Endpoints', () => {
  test('POST /register - success', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // simulates: no user with the same email
      .mockResolvedValueOnce({ rows: [{ // simulates: insert success
        id: 1,
        name: 'Alice',
        email: 'e1234567@u.nus.edu',
        password: 'hashed_password',
        last_seen: '2025-01-01T00:00:00.000Z',
        points: 0,
        interests: []
    }] }); // mock result

    const res = await request(app)
      .post('/register')
      .send({ name: 'Alice', email: 'e1234567@u.nus.edu', password: 'password' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User created successfully');
  });

  test('POST /register - invalid email format', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: 'Alice', email: 'invalid@nus.edu', password: 'password' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid email format');
  });

  test('POST /register - email already exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{}] }); // simulates: user already exists (since array length > 0)

    const res = await request(app)
      .post('/register')
      .send({ name: 'Bob', email: 'e1234567@u.nus.edu', password: 'pass' });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Email is already registered');
  });

  test('POST /login - success', async () => {
    const hashed = await require('bcrypt').hash('secret', 10);
    pool.query.mockResolvedValueOnce({ rows: [{ email: 'e1234567@u.nus.edu', password: hashed }] });

    const res = await request(app)
      .post('/login')
      .send({ email: 'e1234567@u.nus.edu', password: 'secret' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful');
  });

  test('POST /login - invalid password', async () => {
    const hashed = await require('bcrypt').hash('secret', 10);
    pool.query.mockResolvedValueOnce({ rows: [{ email: 'e1234567@u.nus.edu', password: hashed }] });

    const res = await request(app)
      .post('/login')
      .send({ email: 'e1234567@u.nus.edu', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('POST /forgot-password - sends code', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ email: 'e1234567@u.nus.edu' }] });
    sendResetEmail.mockResolvedValueOnce();

    const res = await request(app)
      .post('/forgot-password')
      .send({ email: 'e1234567@u.nus.edu' });

    expect(res.statusCode).toBe(200);
    expect(sendResetEmail).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalled();
  });

  test('POST /verify-reset-code - success', async () => {
    mockRedis.get.mockResolvedValueOnce('123456');
    const res = await request(app)
      .post('/verify-reset-code')
      .send({ email: 'e1234567@u.nus.edu', code: '123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Code verified');
    expect(mockRedis.del).toHaveBeenCalled();
  });

  test('POST /verify-reset-code - invalid code', async () => {
    mockRedis.get.mockResolvedValueOnce('654321');
    const res = await request(app)
      .post('/verify-reset-code')
      .send({ email: 'e1234567@u.nus.edu', code: '123456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid or expired code');
  });
});
