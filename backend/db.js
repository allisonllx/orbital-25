require('dotenv').config({ path: '../.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: { rejectUnauthorized: false },
});

console.log(process.env.DB_URL);

module.exports = pool;

// const { createClient } = require('@supabase/supabase-js');

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_KEY;

// console.log('supabase url', supabaseUrl);

// const supabase = createClient(supabaseUrl, supabaseKey);

// module.exports = supabase;