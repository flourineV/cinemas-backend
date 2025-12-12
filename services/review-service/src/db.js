const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({
  connectionString: config.db.connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false, // dev: tắt kiểm tra CA
  },
});

module.exports = pool;
