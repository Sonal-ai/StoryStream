const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config();

/**
 * Main connection pool for all API queries.
 * NOTE: multipleStatements is intentionally OFF here.
 * execute() uses MySQL's binary prepared-statement protocol;
 * multipleStatements uses the text protocol — mixing them
 * causes "Commands out of sync" / 500 errors on LIMIT queries.
 */
const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  port:            Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

/**
 * One-time startup routine:
 *  1. Create the database if it doesn't exist (no DB specified).
 *  2. Run schema.sql through a SEPARATE connection with multipleStatements
 *     so CREATE TABLE IF NOT EXISTS scripts work without touching the pool.
 *  3. Verify the main pool can connect.
 */
const testConnection = async () => {
  try {
    // ── Step 1: Ensure the database exists ──────────────────────────────────
    const rootConn = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port:     Number(process.env.DB_PORT) || 3306,
    });
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConn.end();

    // ── Step 2: Inject schema.sql via a dedicated multi-statement connection ─
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaConn = await mysql.createConnection({
        host:               process.env.DB_HOST,
        user:               process.env.DB_USER,
        password:           process.env.DB_PASSWORD,
        database:           process.env.DB_NAME,
        port:               Number(process.env.DB_PORT) || 3306,
        multipleStatements: true, // only here — isolated from the main pool
      });
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await schemaConn.query(schemaSql);
      console.log('✅ Base Database Schema loaded from schema.sql');

      // ── Column migrations for existing databases ──────────────────────────
      // Catches ER_DUP_FIELDNAME (1060) so re-runs are safe (idempotent).
      const migrations = [
        "ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN location      VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE users ADD COLUMN full_name     VARCHAR(100) DEFAULT NULL",
      ];
      for (const sql of migrations) {
        try { await schemaConn.query(sql); } catch (e) {
          if (e.errno !== 1060) throw e; // 1060 = "Duplicate column name" — already exists, fine
        }
      }
      await schemaConn.end();
    }

    // ── Step 3: Verify the main pool works ──────────────────────────────────
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully and Database is ready!');
    connection.release();

  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
