const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const authenticate = require('../middlewares/auth');

router.use(authenticate);

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

// edit user profile (by user) (TODO)

// update profile picture 
router.put('/update-profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { profile_pic } = req.body;

    if (!profile_pic) {
        return res.status(400).json({ error: "Profile picture URL is required" });
    }

    try {
        const result = await pool.query(
            "UPDATE users SET profile_pic = $1 WHERE id = $2 RETURNING *",
            [profile_pic, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);       
    } catch (err) {
        res.status(500).json({ error: err.message });   
    }
})


// edit user profile (for updating last_seen and points by the system)
router.put('/system-update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { lastSeen, points } = req.body;

    if ( lastSeen == undefined && points == undefined) {
        return res.status(400).json({ error: "At least one field (lastSeen or points) should be provided" })
    }

    try {
        const fields = [];
        const values = [];
        let index = 1;

        if (lastSeen !== undefined) {
            fields.push(`last_seen = $${index++}`);
            values.push(lastSeen);
        }

        if (points !== undefined) {
            fields.push(`points = $${index++}`);
            values.push(points);
        }

        values.push(userId); // last parameter is always userId

        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;

// update password (for forgot password)
router.put('/update-password/:userId', async (req, res) => {
    const { userId } = req.params;
    const { password } = req.body;

    try {
        const result = await pool.query(
            "UPDATE users SET password = $1 WHERE id = $2 RETURNING *",
            [password, userId]
        );
        if (result.rows.length == 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})