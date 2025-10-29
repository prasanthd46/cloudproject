import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';

export default function ManageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ templateName: '', description: '' });
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    questionType: 'RatingScale1-5',
    displayOrder: 1
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchTemplateDetails = async (templateId) => {
    try {
      const response = await axios.get(`/api/templates/${templateId}`);
      setSelectedTemplate(response.data.template);
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Failed to fetch template details:', error);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/templates', templateForm);
      fetchTemplates();
      setShowTemplateModal(false);
      setTemplateForm({ templateName: '', description: '' });
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/templates/${selectedTemplate.TemplateID}/questions`, questionForm);
      fetchTemplateDetails(selectedTemplate.TemplateID);
      setShowQuestionModal(false);
      setQuestionForm({ questionText: '', questionType: 'RatingScale1-5', displayOrder: questions.length + 1 });
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/templates/questions/${questionId}`);
      fetchTemplateDetails(selectedTemplate.TemplateID);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  return (
    <Layout title="Manage Templates">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Templates</h3>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="btn btn-primary btn-sm mt-2"
            >
              + New Template
            </button>
          </div>
          <div className="card-content p-0">
            <div className="divide-y divide-border">
              {templates.map((template) => (
                <div
                  key={template.TemplateID}
                  onClick={() => fetchTemplateDetails(template.TemplateID)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 ${
                    selectedTemplate?.TemplateID === template.TemplateID ? 'bg-muted' : ''
                  }`}
                >
                  <p className="font-medium">{template.TemplateName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{template.Description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Details */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="card-title">{selectedTemplate.TemplateName}</h3>
                    <p className="card-description">{selectedTemplate.Description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuestionForm({ ...questionForm, displayOrder: questions.length + 1 });
                      setShowQuestionModal(true);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    + Add Question
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.QuestionID} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="badge badge-outline">Q{idx + 1}</span>
                            <span className={`badge ${
                              q.QuestionType === 'RatingScale1-5' ? 'badge-default' : 'badge-secondary'
                            }`}>
                              {q.QuestionType}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{q.QuestionText}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.QuestionID)}
                          className="btn btn-ghost btn-sm text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No questions added yet. Click "Add Question" to get started.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content">
                <p className="text-center text-muted-foreground py-12">
                  Select a template to view questions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <h3 className="card-title">Create Template</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateForm.templateName}
                    onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary flex-1">Create</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setTemplateForm({ templateName: '', description: '' });
                    }}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <h3 className="card-title">Add Question</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question Text</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="input w-full"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Question Type</label>
                  <select
                    value={questionForm.questionType}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                    className="input w-full"
                  >
                    <option value="RatingScale1-5">Rating Scale (1-5)</option>
                    <option value="OpenText">Open Text</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={questionForm.displayOrder}
                    onChange={(e) => setQuestionForm({ ...questionForm, displayOrder: parseInt(e.target.value) })}
                    className="input w-full"
                    min="1"
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn btn-primary flex-1">Add</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionModal(false);
                      setQuestionForm({ questionText: '', questionType: 'RatingScale1-5', displayOrder: questions.length + 1 });
                    }}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
