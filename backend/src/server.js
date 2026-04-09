const app = require('./app');
const { connectDB } = require('./config/db');

require('dotenv').config();

const PORT = process.env.PORT;

// Connect to database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
