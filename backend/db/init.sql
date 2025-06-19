CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    last_seen TIMESTAMPTZ,
    points INTEGER DEFAULT 0,
    interests TEXT[] DEFAULT [] 
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category TEXT NOT NULL, 
    embedding VECTOR(1536), 
    title TEXT NOT NULL,
    caption TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    content TEXT NOT NULL
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'text'
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    user1_id INTEGER REFERENCES users(id),
    user2_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- add index on the embedding column
SET maintenance_work_mem = '128MB';
CREATE INDEX ON tasks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);