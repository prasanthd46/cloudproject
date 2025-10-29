import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// HR Dashboard Metrics
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const totalReviews = await pool.request()
      .query('SELECT COUNT(*) AS Total FROM Reviews');
    
    const completedReviews = await pool.request()
      .query("SELECT COUNT(*) AS Completed FROM Reviews WHERE Status = 'Completed' OR Status = 'Acknowledged'");
    
    const pendingReviews = await pool.request()
      .query("SELECT COUNT(*) AS Pending FROM Reviews WHERE Status = 'Pending'");
    
    const overdueReviews = await pool.request()
      .query(`
        SELECT COUNT(*) AS Overdue 
        FROM Reviews r
        JOIN ReviewCycles rc ON r.CycleID = rc.CycleID
        WHERE r.Status = 'Pending' AND rc.EndDate < GETDATE()
      `);
    
    res.json({
      totalReviews: totalReviews.recordset[0].Total,
      completedReviews: completedReviews.recordset[0].Completed,
      pendingReviews: pendingReviews.recordset[0].Pending,
      overdueReviews: overdueReviews.recordset[0].Overdue,
      completionRate: totalReviews.recordset[0].Total > 0 
        ? ((completedReviews.recordset[0].Completed / totalReviews.recordset[0].Total) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Average ratings by question
router.get('/avg-ratings-by-question', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        tq.QuestionText,
        AVG(CAST(ra.AnswerRating AS FLOAT)) AS AvgRating,
        COUNT(*) AS ResponseCount
      FROM ReviewAnswers ra
      JOIN TemplateQuestions tq ON ra.QuestionID = tq.QuestionID
      WHERE ra.AnswerRating IS NOT NULL
      GROUP BY tq.QuestionText
      ORDER BY AvgRating DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reviews by department
router.get('/reviews-by-department', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        d.DepartmentName,
        COUNT(r.ReviewID) AS TotalReviews,
        SUM(CASE WHEN r.Status = 'Completed' OR r.Status = 'Acknowledged' THEN 1 ELSE 0 END) AS CompletedReviews
      FROM Reviews r
      JOIN Users u ON r.RevieweeID = u.UserID
      JOIN Departments d ON u.DepartmentID = d.DepartmentID
      GROUP BY d.DepartmentName
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
