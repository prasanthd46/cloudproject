import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function ReviewForm() {
  const { user } = useAuth();
  const { reviewId } = useParams();
  const navigate = useNavigate();
  
  const [reviewData, setReviewData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [overallComments, setOverallComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviewDetails();
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      const response = await axios.get(`/api/cycles/review/${reviewId}`);
      setReviewData(response.data);
      
      // Initialize answers array
      const initialAnswers = response.data.questions.map(q => ({
        questionId: q.QuestionID,
        answer: q.QuestionType === 'RatingScale1-5' ? 0 : ''
      }));
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Failed to fetch review details:', error);
      alert('Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value, questionType) => {
    setAnswers(prev => 
      prev.map(a => 
        a.questionId === questionId 
          ? { ...a, answer: questionType === 'RatingScale1-5' ? parseInt(value) : value }
          : a
      )
    );
  };

  const validateForm = () => {
    const { questions } = reviewData;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers.find(a => a.questionId === question.QuestionID);
      
      if (question.QuestionType === 'RatingScale1-5' && (!answer || answer.answer === 0)) {
        alert(`Please provide a rating for question ${i + 1}`);
        return false;
      }
      
      if (question.QuestionType === 'OpenText' && (!answer || !answer.answer.trim())) {
        alert(`Please provide an answer for question ${i + 1}`);
        return false;
      }
    }
    
    if (!overallComments.trim()) {
      alert('Please provide overall comments');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        answers: answers.map(a => ({
          QuestionID: a.questionId,
          AnswerText: reviewData.questions.find(q => q.QuestionID === a.questionId)?.QuestionType === 'OpenText' ? a.answer : null,
          AnswerRating: reviewData.questions.find(q => q.QuestionID === a.questionId)?.QuestionType === 'RatingScale1-5' ? a.answer : null
        })),
        overallComments: overallComments
      };

      await axios.put(`/api/cycles/review/submit/${reviewId}`, payload);
      
      alert('Review submitted successfully!');
      
      // Navigate based on user role
      if (user.Role === 'HR Admin') {
        navigate('/hr/review-dept-heads');
      } else if (user.Role === 'Dept Head') {
        navigate('/dh/reviews');
      } else {
        navigate('/staff/reviews');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Performance Review">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const { review, questions } = reviewData;

  return (
    <Layout title="Performance Review">
      <div className="max-w-4xl mx-auto">
        {/* Review Header */}
        <div className="card mb-6">
          <div className="card-content pt-6 pb-6">
            <h2 className="text-2xl font-bold">{review.CycleName}</h2>
            <p className="text-muted-foreground mt-1">
              Reviewing: <span className="font-medium">{review.RevieweeName}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Template: {review.TemplateName}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Review Questions</h3>
            <p className="card-description">Please answer all questions carefully and provide constructive feedback</p>
          </div>
          <div className="card-content space-y-8">
            {questions.map((question, idx) => {
              const answer = answers.find(a => a.questionId === question.QuestionID);
              
              return (
                <div key={question.QuestionID} className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="badge badge-outline flex-shrink-0">Q{idx + 1}</span>
                    <p className="font-medium text-sm pt-0.5">{question.QuestionText}</p>
                  </div>
                  
                  {question.QuestionType === 'RatingScale1-5' ? (
                    <div className="ml-11">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => handleAnswerChange(question.QuestionID, rating, 'RatingScale1-5')}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                              answer?.answer >= rating
                                ? 'bg-primary text-white scale-110'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                        {answer?.answer > 0 && (
                          <span className="ml-4 text-sm font-medium">
                            {answer.answer}/5
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 ml-1 mr-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-11">
                      <textarea
                        value={answer?.answer || ''}
                        onChange={(e) => handleAnswerChange(question.QuestionID, e.target.value, 'OpenText')}
                        className="input w-full"
                        rows={4}
                        placeholder="Provide detailed feedback..."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Comments */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Overall Comments</h3>
            <p className="card-description">Provide a comprehensive summary of the performance review</p>
          </div>
          <div className="card-content">
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              className="input w-full"
              rows={6}
              placeholder="Provide overall feedback, strengths, areas for improvement, and recommendations..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            disabled={submitting}
          >
            ← Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
