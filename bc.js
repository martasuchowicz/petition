const bcrypt = require("bcryptjs");
const { promisify } = require("util");

const hash = promisify(bcrypt.hash);
const genSalt = promisify(bcrypt.genSalt);

module.exports.hash = (password) =>
    genSalt().then((salt) => hash(password, salt));

module.exports.compare = promisify(bcrypt.compare);
