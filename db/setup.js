require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function setup() {
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf8"
  );

  try {
    await pool.query(schema);
    console.log("Database schema created successfully.");
  } catch (err) {
    console.error("Failed to set up database:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
