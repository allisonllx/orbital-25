require('dotenv').config({ path: '../.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

// console.log(process.env.DB_URL);

module.exports = pool;