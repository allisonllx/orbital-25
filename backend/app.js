const express = require('express');
const app = express();
const pool = require('./db');

app.use(express.json());

// fetch user by ID
app.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// fetch all tasks
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch tasks by filtering
app.get('/tasks', async (req, res) => {
    try {
        const { user_id, category, keyword, created_within, completed } = req.query;

        let baseQuery = 'SELECT * FROM tasks';
        let conditions = [];
        let values = [];

        if (user_id) {
            values.push(user_id);
            conditions.push(`user_id = ${values.length}`);
        }

        if (category) {
            values.push(category);
            conditions.push(`category = ${values.length}`);
        }

        if (keyword) {
            values.push(`%${keyword}%`);
            conditions.push(`{title LIKE ${values.length} OR captions LIKE ${values.length}}`);
        }

        if (created_within) {
            let interval;
            if (created_within === '24h') interval = "1 day";
            else if (created_within === '7d') interval = "7 days";
            else if (created_within === '30d') interval = "30 days";

            if (interval) {
                values.push(interval);
                conditions.push(`timestamp >= NOW() - INTERVAL ${values.length}`);
            }
        }

        if (completed) {
            values.push(completed);
            conditions.push(`completed = ${values.length}`);
        }

        if (conditions.length > 0) {
            baseQuery += 'WHERE ' + conditions.join(' AND '); 
        }

        const result = await pool.query(baseQuery, values);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch a single task
app.get('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = pool.query(
            `SELECT * FROM tasks WHERE id = $1`,
            [taskId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.json({ error: err.message });
    }
})

// fetch all comments under a task
app.get('/tasks/:taskId/comments', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = pool.query(
            `SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`,
            [taskId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch all messages in a chat
app.get('/chats/:user1Id/:user2Id/messages', async (req, res) => {
    const { user1Id, user2Id } = req.params;
    try {
        const result = pool.query(
            `SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2)
                                       OR (sender_id = $2 AND receiver_id = $1)
                                    ORDER BY created_at ASC`,
            [user1Id, user2Id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.messages });
    }
})

// create new task 
app.post('/tasks', async (req, res) => {
    const { user_id, category, title, caption } = req.body;
    if (!user_id || !category || !title || !caption) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const timestamp = new Date().toISOString();
    const completed = false;

    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, category, title, caption, created_at, completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, category, title, caption, timestamp, completed]
        );
        res.status(201).json({
            message: "Task created successfully",
            content: result.rows[0]
        });
    } catch (err) {
        console.log('Error executing query', err.stack);
        res.status(500).json({ error: err.message });
    }
});

// create new comment
app.post('/tasks/:taskId/comments', async (req, res) => {
    const { taskId } = req.params;
    const { userId, content } = req.body;
    if (!userId || !taskId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    const timestamp = new Date().toISOString();

    try {
        const result = await pool.query(
            `INSERT INTO comments (user_id, task_id, created_at, content) VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, taskId, timestamp, content]
        );
        res.status(201).json({
            message: "Comment created successfully",
            content: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// create new message in chat
app.post('/chats/:sender_id/:receiver_id/messages', async (req, res) => {
    const { sender_id, receiver_id } = req.params;
    const { content } = req.body;
    if (!sender_id || !receiver_id || !content) {
        res.status(400).json({ error: "Missing required fields" });
    }
    
    const timestamp = new Date().toISOString();
    const is_read = false;

    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sender_id, receiver_id, content, timestamp, is_read]
        );
        res.status(201).json({
            message: "Comment created successfully",
            content: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// edit user profile (for last_seen)

// edit post

// update messages (for is_read)


app.listen(port, () => console.log(`Server running on port ${port}`));