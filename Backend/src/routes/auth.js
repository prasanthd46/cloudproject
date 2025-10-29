import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConnection } from '../config/db.js';

const router = express.Router();

// ========================
// 1. SIGNUP ENDPOINT
// ========================
// Purpose: Activate account for users added by HR
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const pool = await getConnection();
    
    // Step 1: Check if user exists (email must be added by HR first)
    const userCheck = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'Email not found. Please contact HR to add you to the system first.' 
      });
    }
    
    const user = userCheck.recordset[0];
    
    // Step 2: Check if password already set (account already activated)
    if (user.PasswordSet === 1) {
      return res.status(400).json({ 
        error: 'Account already activated. Please use login instead.' 
      });
    }
    
    // Step 3: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Step 4: Update user with password and activate account
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
    
    res.json({ 
      success: true, 
      message: 'Account activated successfully! You can now login.' 
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ========================
// 2. LOGIN ENDPOINT
// ========================
// Purpose: Authenticate users and return JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const pool = await getConnection();
    
    // Step 1: Find user by email
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.recordset[0];
    
    // Step 2: Check if password is set (account activated)
    if (user.PasswordSet === 0) {
      return res.status(403).json({ 
        error: 'Account not activated. Please complete signup first.',
        needsSignup: true 
      });
    }
    
    // Step 3: Check if account is active
    if (user.AccountStatus !== 'Active') {
      return res.status(403).json({ 
        error: 'Account is inactive. Please contact HR.' 
      });
    }
    
    // Step 4: Verify password
    const validPassword = await bcrypt.compare(password, user.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Step 5: Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.UserID, 
        role: user.Role,
        email: user.Email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );
    const userInfo = {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Role: user.Role,
        DepartmentId: user.DepartmentID
      }
    console.log('User logged in:', userInfo);
    // Step 6: Return token and user info
    res.json({
      success: true,
      token,
      user: userInfo
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ========================
// 3. VERIFY TOKEN (Optional)
// ========================
// Purpose: Check if user is authenticated
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    res.json({ valid: true, userId: decoded.userId, role: decoded.role });
    
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
