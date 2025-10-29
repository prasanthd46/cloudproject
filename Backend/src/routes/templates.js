import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT * FROM ReviewTemplates');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template with questions
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const template = await pool.request()
      .input('id', req.params.id)
      .query('SELECT * FROM ReviewTemplates WHERE TemplateID = @id');
    
    const questions = await pool.request()
      .input('id', req.params.id)
      .query('SELECT * FROM TemplateQuestions WHERE TemplateID = @id ORDER BY DisplayOrder');
    
    res.json({
      template: template.recordset[0],
      questions: questions.recordset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const { templateName, description } = req.body;
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', templateName)
      .input('desc', description)
      .query('INSERT INTO ReviewTemplates (TemplateName, Description) VALUES (@name, @desc); SELECT SCOPE_IDENTITY() AS TemplateID');
    
    res.json({ success: true, templateId: result.recordset[0].TemplateID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add question to template
router.post('/:id/questions', async (req, res) => {
  try {
    const { questionText, questionType, displayOrder } = req.body;
    const pool = await getConnection();
    await pool.request()
      .input('templateId', req.params.id)
      .input('text', questionText)
      .input('type', questionType)
      .input('order', displayOrder)
      .query('INSERT INTO TemplateQuestions (TemplateID, QuestionText, QuestionType, DisplayOrder) VALUES (@templateId, @text, @type, @order)');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', req.params.questionId)
      .query('DELETE FROM TemplateQuestions WHERE QuestionID = @id');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
