import express from 'express';
import { getConnection } from '../config/db.js';
import { summarizeText } from '../services/azureAI.js';

const router = express.Router();

// Create review cycle
router.post('/', async (req, res) => {
  try {
    const { cycleName, startDate, endDate, templateId, deptHeadTemplateId, departmentIds } = req.body;
    const pool = await getConnection();
    
    // Create cycle
    const cycleResult = await pool.request()
      .input('name', cycleName)
      .input('start', startDate)
      .input('end', endDate)
      .input('templateId', templateId)
      .input('deptHeadTemplateId', deptHeadTemplateId)
      .query(`
        INSERT INTO ReviewCycles (CycleName, StartDate, EndDate, TemplateID, DeptHeadTemplateID)
        VALUES (@name, @start, @end, @templateId, @deptHeadTemplateId);
        SELECT SCOPE_IDENTITY() AS CycleID
      `);
    
    const cycleId = cycleResult.recordset[0].CycleID;
    
    // Link departments
    for (const deptId of departmentIds) {
      await pool.request()
        .input('cycleId', cycleId)
        .input('deptId', deptId)
        .query('INSERT INTO CycleDepartments (CycleID, DepartmentID) VALUES (@cycleId, @deptId)');
      
      // Get dept head
      const deptHead = await pool.request()
        .input('deptId', deptId)
        .query('SELECT HeadUserID FROM Departments WHERE DepartmentID = @deptId');
      
      if (deptHead.recordset[0].HeadUserID) {
        const headUserId = deptHead.recordset[0].HeadUserID;
        
        // Create review for dept head (reviewer = HR Admin with UserID 1)
        await pool.request()
          .input('cycleId', cycleId)
          .input('revieweeId', headUserId)
          .input('reviewerId', 1) // HR Admin
          .input('templateId', deptHeadTemplateId)
          .query('INSERT INTO Reviews (CycleID, RevieweeID, ReviewerID, TemplateID, Status) VALUES (@cycleId, @revieweeId, @reviewerId, @templateId, \'Pending\')');
        
        // Get all staff in department
        const staff = await pool.request()
          .input('deptId', deptId)
          .query("SELECT UserID FROM Users WHERE DepartmentID = @deptId AND Role = 'Staff'");
        
        // Create reviews for each staff member (reviewer = dept head)
        for (const staffMember of staff.recordset) {
          await pool.request()
            .input('cycleId', cycleId)
            .input('revieweeId', staffMember.UserID)
            .input('reviewerId', headUserId)
            .input('templateId', templateId)
            .query('INSERT INTO Reviews (CycleID, RevieweeID, ReviewerID, TemplateID, Status) VALUES (@cycleId, @revieweeId, @reviewerId, @templateId, \'Pending\')');
        }
      }
    }
    
    res.json({ success: true, cycleId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews assigned to a reviewer
router.get('/reviewer/:userId', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', req.params.userId)
      .query(`
        SELECT 
          r.ReviewID, r.Status, r.SubmittedAt,
          u.FullName AS RevieweeName, u.Role AS RevieweeRole,
          d.DepartmentName,
          rc.CycleName, rc.StartDate, rc.EndDate,
          rt.TemplateName
        FROM Reviews r
        JOIN Users u ON r.RevieweeID = u.UserID
        LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
        JOIN ReviewCycles rc ON r.CycleID = rc.CycleID
        JOIN ReviewTemplates rt ON r.TemplateID = rt.TemplateID
        WHERE r.ReviewerID = @userId
        ORDER BY r.Status, rc.EndDate
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a reviewee (staff viewing their own reviews)
router.get('/reviewee/:userId', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', req.params.userId)
      .query(`
        SELECT 
          r.ReviewID, r.Status, r.SubmittedAt, r.AcknowledgedAt,
          u.FullName AS ReviewerName,
          rc.CycleName, rc.StartDate, rc.EndDate,
          rt.TemplateName
        FROM Reviews r
        JOIN Users u ON r.ReviewerID = u.UserID
        JOIN ReviewCycles rc ON r.CycleID = rc.CycleID
        JOIN ReviewTemplates rt ON r.TemplateID = rt.TemplateID
        WHERE r.RevieweeID = @userId
        ORDER BY r.Status, rc.EndDate DESC
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single review details
router.get('/review/:reviewId', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const review = await pool.request()
      .input('id', req.params.reviewId)
      .query(`
        SELECT 
          r.*,
          reviewer.FullName AS ReviewerName,
          reviewee.FullName AS RevieweeName,
          rc.CycleName,
          rt.TemplateName
        FROM Reviews r
        JOIN Users reviewer ON r.ReviewerID = reviewer.UserID
        JOIN Users reviewee ON r.RevieweeID = reviewee.UserID
        JOIN ReviewCycles rc ON r.CycleID = rc.CycleID
        JOIN ReviewTemplates rt ON r.TemplateID = rt.TemplateID
        WHERE r.ReviewID = @id
      `);
    
    const questions = await pool.request()
      .input('templateId', review.recordset[0].TemplateID)
      .query('SELECT * FROM TemplateQuestions WHERE TemplateID = @templateId ORDER BY DisplayOrder');
    
    const answers = await pool.request()
      .input('reviewId', req.params.reviewId)
      .query('SELECT * FROM ReviewAnswers WHERE ReviewID = @reviewId');
    
    res.json({
      review: review.recordset[0],
      questions: questions.recordset,
      answers: answers.recordset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit review (with AI summarization) - FIXED
router.put('/review/submit/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { answers, overallComments } = req.body;
    const pool = await getConnection();
    
    // Get review details for personalization
    const reviewResult = await pool.request()
      .input('reviewId', reviewId)
      .query(`
        SELECT r.*, u.FullName as RevieweeName 
        FROM Reviews r
        JOIN Users u ON r.RevieweeID = u.UserID
        WHERE r.ReviewID = @reviewId
      `);

    if (reviewResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = reviewResult.recordset[0];
    
    // Generate AI summary
    console.log('📝 Generating AI summary...');
    const aiResult = await summarizeText(overallComments);
    let genAI_Summary = aiResult.summary;

    // Personalize summary with reviewee's name
    const nameParts = review.RevieweeName.split(' ');
    const revieweeFirstName = nameParts.length > 1 ? nameParts[1] : nameParts[0];
    
    if (genAI_Summary && !genAI_Summary.toLowerCase().includes(revieweeFirstName.toLowerCase())) {
      genAI_Summary = `${revieweeFirstName} ${genAI_Summary.charAt(0).toLowerCase()}${genAI_Summary.slice(1)}`;
    }
    
    console.log('✅ AI Summary generated:', genAI_Summary.substring(0, 100) + '...');
    
    // Update review status
    await pool.request()
      .input('reviewId', reviewId)
      .input('overallComments', overallComments)
      .input('genAI_Summary', genAI_Summary)
      .query(`
        UPDATE Reviews 
        SET Status = 'Completed',
            ManagerOverallComments = @overallComments,
            GenAI_Summary = @genAI_Summary,
            SubmittedAt = GETDATE()
        WHERE ReviewID = @reviewId
      `);
    
    // Insert answers
    for (const answer of answers) {
      await pool.request()
        .input('reviewId', reviewId)
        .input('questionId', answer.QuestionID)
        .input('answerText', answer.AnswerText || null)
        .input('answerRating', answer.AnswerRating || null)
        .query(`
          INSERT INTO ReviewAnswers (ReviewID, QuestionID, AnswerText, AnswerRating)
          VALUES (@reviewId, @questionId, @answerText, @answerRating)
        `);
    }
    
    res.json({ 
      success: true, 
      message: 'Review submitted successfully',
      aiSummary: genAI_Summary
    });
  } catch (error) {
    console.error('❌ Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review: ' + error.message });
  }
});
router.post('/test-ai-summary', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('Testing AI summarization with text:', text.substring(0, 100) + '...');
    
    const result = await summarizeText(text);
    
    res.json({
      success: true,
      original: text,
      summary: result.summary,
      sentences: result.sentences
    });
    
  } catch (error) {
    console.error('Test AI error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Acknowledge review (by staff)
router.put('/review/acknowledge/:reviewId', async (req, res) => {
  try {
    const { acknowledgementComments } = req.body;
    const pool = await getConnection();
    
    await pool.request()
      .input('reviewId', req.params.reviewId)
      .input('comments', acknowledgementComments)
      .query('UPDATE Reviews SET Status = \'Acknowledged\', StaffAcknowledgementComments = @comments, AcknowledgedAt = GETDATE() WHERE ReviewID = @reviewId');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
