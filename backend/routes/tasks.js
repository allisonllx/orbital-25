const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const { generateEmbeddings } = require('../utils');
const authenticate = require('../middlewares/auth');
const { tasksWriteLimiter } = require('../middlewares/rateLimiter');

router.use(authenticate);

// fetch all tasks with filtering and semantic search capabilities
router.get('/', async (req, res) => {
    try {
        const { q, user_id, category, created_within, completed } = req.query;
        const categories = Array.isArray(category) ? category : category ? [category] : [];

        let values = [];
        let filters = [];

        // user filter
        if (user_id) {
            values.push(user_id);
            filters.push(`user_id = $${values.length}`);
        }

        // category filter
        if (categories.length) {
            values.push(categories);
            filters.push(`category && $${values.length}::text[]`); // contains any of the categories listed
        }

        // created within filter
        if (created_within) {
            let interval;
            if (created_within === '24h') interval = "1 day";
            else if (created_within === '7d') interval = "7 days";
            else if (created_within === '30d') interval = "30 days";

            if (interval) {
                values.push(interval);
                filters.push(`created_at >= NOW() - ($${values.length})::interval`);
            }
        }

        // completed filter
        if (completed) {
            values.push(completed);
            filters.push(`completed = $${values.length}`);
        }

        // semantic search
        if (q) {
            const embedding = await generateEmbeddings(q);
            const vectorString = `[${embedding.join(',')}]`;
            values.push(vectorString);
            const vectorClause = `embedding IS NOT NULL ORDER BY embedding <=> $${values.length} ASC`; // using cosine distance

            let whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : "";
            const result = await pool.query(
                `SELECT tasks.*, users.name AS user_name
                FROM tasks
                JOIN users ON tasks.user_id = users.id
                ${whereClause}
                ${whereClause ? 'AND' : 'WHERE'} ${vectorClause}
                LIMIT 20
                `,
                values
            );

            return res.status(200).json(result.rows);
        }

        // fallback if there is no q (aka keyword)
        let whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : "";
        const result = await pool.query(`
            SELECT tasks.*, users.name AS user_name
            FROM tasks
            JOIN users ON tasks.user_id = users.id
            ${whereClause}
            ORDER BY tasks.created_at DESC
        `, values);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch all saved tasks by a user
router.get('/saved', async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `SELECT tasks.*, users.name AS user_name
       FROM saved_tasks
       JOIN tasks ON saved_tasks.task_id = tasks.id
       JOIN users ON tasks.user_id = users.id
       WHERE saved_tasks.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching saved tasks:', err);
    res.status(500).json({ error: 'Failed to fetch saved tasks' });
  }
});

// fetch a single task
router.get('/:taskId', async (req, res) => {
    const { taskId } = req.params;
    try {
        const result = await pool.query(
            `SELECT tasks.*, users.name AS user_name 
             FROM tasks 
             JOIN users ON tasks.user_id = users.id 
             WHERE tasks.id = $1`,
            [taskId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// fetch all comments under a task
router.get('/:taskId/comments', async (req, res) => {
    const { taskId } = req.params;
    try {
         const result = await pool.query(
            `SELECT comments.*, users.name AS user_name
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.task_id = $1
            ORDER BY comments.created_at ASC`,
            [taskId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// create new task 
router.post('/', tasksWriteLimiter, async (req, res) => {
    const { user_id, category, title, caption } = req.body;
    if (!user_id || !category || !title || !caption) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const timestamp = new Date().toISOString();
    const completed = false;

    const textToEmbed = `${title} ${caption}`;
    const embedding = await generateEmbeddings(textToEmbed);
    const vectorString = `[${embedding.join(',')}]`;

    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, category, title, caption, created_at, completed, embedding) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [user_id, category, title, caption, timestamp, completed, vectorString]
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
router.put('/:taskId', tasksWriteLimiter, async (req, res) => {
    const { taskId } = req.params;
    const { category, title, caption, completed } = req.body;

    // update embeddings
    const textToEmbed = `${title} ${caption}`;
    const embedding = await generateEmbeddings(textToEmbed);
    const vectorString = `[${embedding.join(',')}]`;

    try {
        const result = await pool.query(
            `UPDATE tasks
             SET category = $1, title = $2, caption = $3, completed = $4, embedding = $5
             WHERE id = $6
             RETURNING *`,
            [category, title, caption, completed, vectorString, taskId]
        );
        if (result.rows.length == 0) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// delete task
router.delete('/:taskId', authenticate, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [taskId, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized or task not found' });
    }

    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});


module.exports = router;