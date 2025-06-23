const express = require('express');
const app = express();
const pool = require('./db.js');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/users.js');
const taskRoutes = require('./routes/tasks.js');
const chatRoutes = require('./routes/chats.js');
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
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

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;