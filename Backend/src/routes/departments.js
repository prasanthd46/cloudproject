import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Get all departments
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT d.*, u.FullName AS HeadName 
      FROM Departments d
      LEFT JOIN Users u ON d.HeadUserID = u.UserID
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create department
router.post('/', async (req, res) => {
  try {
    const { departmentName, headUserId } = req.body;
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', departmentName)
      .input('head', headUserId || null)
      .query('INSERT INTO Departments (DepartmentName, HeadUserID) VALUES (@name, @head); SELECT SCOPE_IDENTITY() AS DepartmentID');
    
    res.json({ success: true, departmentId: result.recordset[0].DepartmentID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { departmentName, headUserId } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .input('name', departmentName)
      .input('head', headUserId || null)
      .query('UPDATE Departments SET DepartmentName = @name, HeadUserID = @head WHERE DepartmentID = @id');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.id)
      .query('DELETE FROM Departments WHERE DepartmentID = @id');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
