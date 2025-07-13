const express = require('express');
const app = express();
const pool = require('./db.js');
const authRouter = require('./routes/auth.js');
const userRouter = require('./routes/users.js');
const taskRouter = require('./routes/tasks.js');
const chatRouter = require('./routes/chats.js');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const {
    authLimiter,
    usersLimiter,
    tasksReadLimiter,
  } = require('./rateLimiter');

app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authLimiter, authRouter);
app.use('/users', usersLimiter, userRouter);
app.use('/tasks', tasksReadLimiter, taskRouter);
app.use('/chats', chatRouter);

app.get("/", async (req, res) => {
    res.json({ message: "Welcome to the API!" });
})

// check db connection
app.get('/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT 1');
        res.status(200).send('Database connected');
    } catch (err) {
        console.error('DB health check failed:', err);
        res.status(500).json({ error: err.message });
    }
})

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;