const spicedPg = require("spiced-pg");

let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUser, dbPass } = require("./secrets");
    db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);
}

// to insert registration data into users table
exports.insertRegData = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

// to get hashed password from users table
exports.getPassword = (email) => {
    return db.query(
        `SELECT password, id FROM users
        WHERE email = $1`,
        [email]
    );
};

// to put profile data into user_profiles table
exports.insertProfileData = (age, city, url, id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [age, city, url, id]
    );
};

// check signature if user has signed
exports.sigCheck = (userId) => {
    return db.query(
        `SELECT signature FROM signature
        WHERE user_id = $1`,
        [userId]
    );
};

// put data into signatre table
exports.addSigner = (userId, signature) => {
    return db.query(
        `INSERT INTO signature (user_id, signature) VALUES ($1, $2) RETURNING id`,
        [userId, signature]
    );
};

exports.getAllSigners = () => {
    return db.query(`SELECT signature.signature, signature.user_id AS signature, users.first, users.last AS last
FROM signature
JOIN users
ON signature.user_id = users.id`);
};

// signers by city
exports.getSignersByCity = (city) => {
    return db.query(
        `SELECT user_profiles.city, users.first, users.last FROM user_profiles JOIN users ON user_profiles.user_id = users.id WHERE LOWER(city) = LOWER($1)`,
        [city]
    );
};

// selecting data from users for editing profiles
exports.dataToEdit = (id) => {
    return db.query(
        `SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE user_profiles.user_id = $1`,
        [id]
    );
};

// update without password
exports.updateProfileWithoutPw = (first, last, email, id) => {
    return db.query(
        `UPDATE users SET first=$1, last = $2, email=$3 WHERE users.id = $4 RETURNING *`,
        [first, last, email, id]
    );
};

// updae with password
exports.updateProfileWithPw = (first, last, email, password, id) => {
    return db.query(
        `UPDATE users SET first=$1, last = $2, email=$3, password=$4 WHERE users.id = $5 RETURNING *`,
        [first, last, email, password, id]
    );
};

// upsert for users profiles
exports.upsertUserProfiles = (age, city, url, id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id)
DO UPDATE SET age = $1, city = $2, url= $3, id=$4 RETURNING *`,
        [age, city, url, id]
    );
};
