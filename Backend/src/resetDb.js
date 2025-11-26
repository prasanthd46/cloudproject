import sql from 'mssql';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false }
};

async function forceReset() {
  try {
    console.log('🔌 Connecting...');
    const pool = await sql.connect(config);

    console.log('🔥 DELETING OLD TABLES...');
    await pool.request().query(`
      UPDATE Departments SET HeadUserID = NULL;
      DROP TABLE IF EXISTS ReviewAnswers;
      DROP TABLE IF EXISTS Reviews;
      DROP TABLE IF EXISTS CycleDepartments;
      DROP TABLE IF EXISTS ReviewCycles;
      DROP TABLE IF EXISTS TemplateQuestions;
      DROP TABLE IF EXISTS ReviewTemplates;
      DROP TABLE IF EXISTS Users;
      DROP TABLE IF EXISTS Departments;
    `);

    console.log('✅ Tables deleted. Now restart your server!');
    console.log('The server.js will see "0 tables" and create the new ones correctly.');
    
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

forceReset();