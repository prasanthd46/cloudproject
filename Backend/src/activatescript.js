import bcrypt from 'bcrypt';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false }
};

const demoUsers = [
  'admin@hospital.com',
  'rajesh@hospital.com',
  'priya@hospital.com',
  'amit@hospital.com',
  'sita@hospital.com',
  'neha@hospital.com'
];

async function activateUsers() {
  try {
    const pool = await sql.connect(config);
    
    // Hash password "123" once
    const hashedPassword = await bcrypt.hash('123', 10);
    console.log('🔐 Password hash created for: 123\n');
    
    for (const email of demoUsers) {
      await pool.request()
        .input('email', email)
        .input('password', hashedPassword)
        .query(`
          UPDATE Users 
          SET PasswordHash = @password, 
              PasswordSet = 1, 
              AccountStatus = 'Active'
          WHERE Email = @email
        `);
      
      console.log(`✅ Activated: ${email} (password: 123)`);
    }
    
    console.log('\n🎉 All demo users activated!');
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    demoUsers.forEach(email => {
      console.log(`Email: ${email} | Password: 123`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateUsers();
