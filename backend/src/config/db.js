const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initializeSchema = async () => {
  try {
    const connection = await pool.getConnection();

    // Database creation
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Posts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Posts (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        text TEXT NOT NULL,
        imageUrl VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // Comments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Comments (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        postId VARCHAR(36) NOT NULL,
        text TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      )
    `);

    // Hashtags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Hashtags (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        count INT DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Likes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Likes (
        userId VARCHAR(36) NOT NULL,
        postId VARCHAR(36) NOT NULL,
        PRIMARY KEY (userId, postId),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      )
    `);

    // Follows table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Follows (
        followerId VARCHAR(36) NOT NULL,
        followingId VARCHAR(36) NOT NULL,
        PRIMARY KEY (followerId, followingId),
        FOREIGN KEY (followerId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (followingId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // PostHashtags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PostHashtags (
        postId VARCHAR(36) NOT NULL,
        hashtagId VARCHAR(36) NOT NULL,
        PRIMARY KEY (postId, hashtagId),
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE,
        FOREIGN KEY (hashtagId) REFERENCES Hashtags(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('Database Schema Initialized');
  } catch (error) {
    console.error('Initial Schema Error: ', error);
  }
};

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected via mysql2 pool');
    connection.release();
    
    // Auto-initialize tables
    await initializeSchema();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
