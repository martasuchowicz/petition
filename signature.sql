DROP TABLE IF EXISTS signature;

CREATE TABLE signature (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL CHECK (signature != ''),
    user_id INTEGER  NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

