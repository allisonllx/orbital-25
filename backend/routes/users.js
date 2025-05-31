const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// fetch user by ID
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// edit user profile (for updating last_seen and points)
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { lastSeen, points } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users
             SET last_seen = $1, points = $2
             WHERE id = $3
             RETURNING *`,
            [lastSeen, points, userId]
        );
        if (results.rows.length == 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;