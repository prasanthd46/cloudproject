import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Changed back to true for Azure
    trustServerCertificate: false, // Changed back to false for Azure
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connected to Azure SQL Database');
    }
    return pool;
  } catch (err) {
    console.error('❌ Database Connection Error:', err);
    throw err;
  }
}

export { sql };
