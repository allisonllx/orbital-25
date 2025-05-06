const express = require('express');
const app = express();
const pool = require('./db.js');
// const supabase = require('./db.js');
const bcrypt = require('bcrypt');
const port = 3000;

app.use(express.json());

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

// fetch user by ID
app.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        res.status(200).json(result.rows[0]);
        // const result = await sql`SELECT * FROM users WHERE id = ${ userId }`;
        // const { data, err } = await supbase.from('users').select('*').eq('id', userId);
        // if (err) throw err;
        // res.status(200).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// // fetch all tasks
// app.get('/tasks', async (req, res) => {
//     try {
//         const result = await pool.query('SELECT * FROM tasks');
//         res.status(200).json(result.rows);
//         // const result = await sql`SELECT * FROM tasks`;
//         // const { data, err } = await supabase.from('tasks').select('*');
//         // if (err) throw err;
//         // res.status(200).json(data);
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// })

// fetch tasks by filtering
app.get('/tasks', async (req, res) => {
    try {
        const { user_id, category, keyword, created_within, completed } = req.query;

        let baseQuery = 'SELECT * FROM tasks';
        let conditions = [];
        let values = [];

        if (user_id) {
            values.push(user_id);
            conditions.push(`user_id = $${values.length}`);
        }

        if (category) {
            values.push(category);
            conditions.push(`category = $${values.length}`);
        }

        if (keyword) {
            values.push(`%${keyword}%`);
            conditions.push(`{title ILIKE $${values.length} OR captions ILIKE $${values.length}}`);
        }

        if (created_within) {
            let interval;
            if (created_within === '24h') interval = "1 day";
            else if (created_within === '7d') interval = "7 days";
            else if (created_within === '30d') interval = "30 days";

            if (interval) {
                values.push(interval);
                conditions.push(`timestamp >= NOW() - INTERVAL $${values.length}`);
            }
        }

        if (completed) {
            values.push(completed);
            conditions.push(`completed = $${values.length}`);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND '); 
        }

        const result = await pool.query(baseQuery, values);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch a single task
app.get('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM tasks WHERE id = $1`,
            [taskId]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch all comments under a task
app.get('/tasks/:taskId/comments', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at ASC`,
            [taskId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch all messages in a chat
app.get('/chats/:user1Id/:user2Id/messages', async (req, res) => {
    const { user1Id, user2Id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2)
                                       OR (sender_id = $2 AND receiver_id = $1)
                                    ORDER BY created_at ASC`,
            [user1Id, user2Id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.messages });
    }
})

// create new user (yet to add authentication)
app.post('/users', async (req, res) => {
    const { name, email, password } = req.body;
    const last_seen = new Date().toISOString();
    const points = 0;
    try {
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

// edit task
app.put('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { category, title, caption, completed } = req.body;

    try {
        const result = await pool.query(
            `UPDATE tasks
             SET category = $1, title = $2, caption = $3, completed = $4
             WHERE id = $5
             RETURNING *`,
            [category, title, caption, completed, taskId]
        );
        if (result.rows.length == 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// update messages (for is_read)


app.listen(port, () => console.log(`Server running on port ${port}`));