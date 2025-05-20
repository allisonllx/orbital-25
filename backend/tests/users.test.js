const request = require('supertest');
const app = require('../app.js');
const pool = require('../db.js');

describe('GET /users/:userId', () => {
    let testUserId;

    beforeAll(async () => {
        const res = await pool.query(
            'INSERT INTO users (name, email, password, last_seen, points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            ['Test User', 'test@gmail.com', 'hashedPassword', new Date().toISOString(), 0]
        );
        testUserId = res.rows[0].id;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await pool.end(); // clean up db connection
    });

    it('should return user data for a valid ID', async () => {
        const res = await request(app).get(`/users/${testUserId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', testUserId);
        expect(res.body).toHaveProperty('name', 'Test User');
    })

    it('should return 500 for an invalid ID', async () => {
        const res = await request(app).get('/users/-1');
        expect(res.statusCode).toBe(500);
    })
})