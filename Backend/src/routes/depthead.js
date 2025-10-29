import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Dept Head Dashboard Metrics
router.get('/dashboard-metrics/:userId', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const totalReviews = await pool.request()
      .input('userId', req.params.userId)
      .query('SELECT COUNT(*) AS Total FROM Reviews WHERE ReviewerID = @userId');
    
    const pendingReviews = await pool.request()
      .input('userId', req.params.userId)
      .query("SELECT COUNT(*) AS Pending FROM Reviews WHERE ReviewerID = @userId AND Status = 'Pending'");
    
    const completedReviews = await pool.request()
      .input('userId', req.params.userId)
      .query("SELECT COUNT(*) AS Completed FROM Reviews WHERE ReviewerID = @userId AND Status IN ('Completed', 'Acknowledged')");
    
    res.json({
      totalReviews: totalReviews.recordset[0].Total,
      pendingReviews: pendingReviews.recordset[0].Pending,
      completedReviews: completedReviews.recordset[0].Completed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Team stats (average ratings for dept head's team)
router.get('/team-stats/:userId', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', req.params.userId)
      .query(`
        SELECT 
          tq.QuestionText,
          AVG(CAST(ra.AnswerRating AS FLOAT)) AS AvgRating
        FROM ReviewAnswers ra
        JOIN Reviews r ON ra.ReviewID = r.ReviewID
        JOIN TemplateQuestions tq ON ra.QuestionID = tq.QuestionID
        WHERE r.ReviewerID = @userId AND ra.AnswerRating IS NOT NULL
        GROUP BY tq.QuestionText
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
