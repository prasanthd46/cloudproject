import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT u.*, d.DepartmentName 
      FROM Users u
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dept heads only
router.get('/dept-heads', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query("SELECT UserID, FullName, Email FROM Users WHERE Role = 'Dept Head'");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { fullName, email, role, departmentId } = req.body;
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', fullName)
      .input('email', email)
      .input('role', role)
      .input('dept', departmentId || null)
      .query('INSERT INTO Users (FullName, Email, Role, DepartmentID) VALUES (@name, @email, @role, @dept); SELECT SCOPE_IDENTITY() AS UserID');
    
    res.json({ success: true, userId: result.recordset[0].UserID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { fullName, email, role, departmentId } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .input('name', fullName)
      .input('email', email)
      .input('role', role)
      .input('dept', departmentId || null)
      .query('UPDATE Users SET FullName = @name, Email = @email, Role = @role, DepartmentID = @dept WHERE UserID = @id');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Users WHERE UserID = @id');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
