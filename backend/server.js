const app = require('./app');
const { testConnection } = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

/**
 * Starts the HTTP server after verifying database connectivity.
 * If the DB connection fails, the process exits with code 1.
 */
const startServer = async () => {
  // Test DB connection before accepting requests
  await testConnection();

  app.listen(PORT, () => {
    console.log(`\n🚀 StoryStream API Server running on port ${PORT}`);
    console.log(`📍 Environment : ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
