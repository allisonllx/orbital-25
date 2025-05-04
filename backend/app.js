const express = require('express');
const app = express();
const pool = require('./db');

app.use(express.json());

// get user by ID
app.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM USERS WHERE id = $1', [userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// create new task 
app.post('/tasks', async (req, res) => {
    const { user_id, category, title, caption } = req.body;
    if (!user_id || !category || !title || !caption) {
        return res.status(400).json({error: "Missing required fields"});
    }

    const timestamp = new Date().toISOString();
    const completed = false;

    try {
        const result = await pool.query(
            'INSERT INTO tasks (title, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, category, title, caption, timestamp, completed]
        );
        res.status(201).json({
            message: "Task created successfully",
            task: result.rows[0]
        });
    } catch (err) {
        console.log('Error executing query', err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));