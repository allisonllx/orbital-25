const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const pool = require('./db.js');
const userRoutes = require('./routes/users.js');
const taskRoutes = require('./routes/tasks.js');
const chatRoutes = require('./routes/chats.js');
const sendResetEmail = require('./mailer.js');
const { createClient } = require('redis');
const cors = require('cors');

const redis = createClient();
redis.connect().catch(console.error);

app.use(express.json());
app.use(cors());
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/chats', chatRoutes);

app.get("/", async (req, res) => {
    res.json({ message: "Welcome to the API!" });
})

// check db connection
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1');
        res.status(200).send('Database connected');
    } catch (err) {
        res.status(500).send(err.message);
    }
})

// register endpoint
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const last_seen = new Date().toISOString();
    const points = 0;
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
        res.status(201).json({
            message: "User created successfully",
            content: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// login endpoint
app.post('/login', async (req, res) => {
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

        res.status(200).json({ message: 'Login successful', content: user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// forgot password endpoint (send verification code)
app.post('/forgot-password', async (req, res) => {
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
app.post('/verify-reset-code', async (req, res) => {
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

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;