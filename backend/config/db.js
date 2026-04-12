const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Creates a MySQL connection pool for efficient connection management.
 * Using pool instead of single connection to handle concurrent requests.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'storystream',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,       // Max concurrent connections in pool
  queueLimit: 0,             // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Tests the database connection on startup.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
