const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sendResetEmail = require('../services/mailer');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const pool = require('../db/index');
const { cleanUser } = require('../utils');

const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.connect().catch(console.error);

// register endpoint
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const last_seen = new Date().toISOString();
    const points = 0;
    const emailRe = /^e\d{7}@u.nus.edu$/;
    if (!emailRe.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    try {
        const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email is already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds
        const result = await pool.query(
            'INSERT INTO users (name, email, password, last_seen, points) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, hashedPassword, last_seen, points]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.status(201).json({
            message: "User created successfully",
            token,
            content: cleanUser(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.status(200).json({ 
            message: 'Login successful', 
            token,
            content: cleanUser(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// forgot password endpoint (send verification code)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Missing email' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Email not registered' }); // only allow registered emails to reset password
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const ttl = 10 * 60; // 10 minutes

        await redis.set(`reset:${email}`, code, { EX: ttl });

        await sendResetEmail(email, code);
        res.status(200).json({ message: 'Verification code sent' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email: ' + err.message });
    }
})

// verify reset code endpoint
router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Missing email or code' });
    }

    try {
        const storedCode = await redis.get(`reset:${email}`);

        if (!storedCode || code != storedCode) {
            res.status(400).json({ error: 'Invalid or expired code '});
        }

        await redis.del(`reset:${email}`);
        res.status(200).json({ message: 'Code verified' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;