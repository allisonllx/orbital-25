const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// fetch all tasks with filtering
router.get('/', async (req, res) => {
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
router.get('/:taskId', async (req, res) => {
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
router.get('/:taskId/comments', async (req, res) => {
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

// create new task 
router.post('/', async (req, res) => {
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
router.post('/:taskId/comments', async (req, res) => {
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

// edit task
router.put('/:taskId', async (req, res) => {
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

module.exports = router;