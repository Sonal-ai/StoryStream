const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Optional: you can test connection here
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('MySQL Database Connected via Prisma');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };
