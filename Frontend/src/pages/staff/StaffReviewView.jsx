import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function StaffReviewView() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviewData, setReviewData] = useState(null);
  const [acknowledgementComments, setAcknowledgementComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviewDetails();
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      const response = await axios.get(`/api/cycles/review/${reviewId}`);
      setReviewData(response.data);
      setAcknowledgementComments(response.data.review.StaffAcknowledgementComments || '');
    } catch (error) {
      console.error('Failed to fetch review details:', error);
    } finally {
      setLoading(false);
    }
  };

const handleAcknowledge = async () => {
  if (!acknowledgementComments.trim()) {
    alert('Please provide your acknowledgement comments.');
    return;
  }

  setSubmitting(true);
  try {
    await axios.put(`/api/cycles/review/acknowledge/${reviewId}`, {
      acknowledgementComments
    });
    alert('Review acknowledged successfully!');
    
    // Navigate based on user role
    if (user.Role === 'HR Admin') {
      navigate('/hr/review-dept-heads');
    } else if (user.Role === 'Dept Head') {
      navigate('/dh/my-reviews');  // ✅ Fixed for dept heads
    } else {
      navigate('/staff/reviews');
    }
  } catch (error) {
    console.error('Failed to acknowledge review:', error);
    alert('Failed to acknowledge review. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <Layout title="Review Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const { review, questions, answers } = reviewData;
  const isCompleted = review.Status === 'Completed' || review.Status === 'Acknowledged';
  const isAcknowledged = review.Status === 'Acknowledged';

  return (
    <Layout title="Performance Review">
      <div className="max-w-4xl mx-auto">
        {/* Review Header */}
        <div className="card mb-6">
          <div className="card-content pt-6 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{review.CycleName}</h2>
                <p className="text-muted-foreground mt-1">Reviewed by: {review.ReviewerName}</p>
                {review.SubmittedAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted: {new Date(review.SubmittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className={`badge ${
                isAcknowledged ? 'badge-default' : 'bg-green-100 text-green-800 border-green-200'
              }`}>
                {review.Status}
              </span>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {review.GenAI_Summary && (
          <div className="card mb-6 border-l-4 border-l-primary">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="card-title">AI-Generated Summary</h3>
              </div>
              <p className="card-description">Key highlights from your review</p>
            </div>
            <div className="card-content">
              <p className="text-sm leading-relaxed">{review.GenAI_Summary}</p>
            </div>
          </div>
        )}

        {/* Manager Comments */}
        {review.ManagerOverallComments && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Overall Comments</h3>
            </div>
            <div className="card-content">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.ManagerOverallComments}</p>
            </div>
          </div>
        )}

        {/* Question Answers */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Detailed Feedback</h3>
          </div>
          <div className="card-content space-y-6">
            {questions.map((question, idx) => {
              const answer = answers.find(a => a.QuestionID === question.QuestionID);
              
              return (
                <div key={question.QuestionID} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-3 mb-3">
                    <span className="badge badge-outline flex-shrink-0">Q{idx + 1}</span>
                    <p className="font-medium text-sm">{question.QuestionText}</p>
                  </div>
                  
                  {question.QuestionType === 'RatingScale1-5' ? (
                    <div className="ml-11">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <div
                              key={rating}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                answer?.AnswerRating >= rating
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {rating}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium ml-4">
                          {answer?.AnswerRating}/5
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-11 bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{answer?.AnswerText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Acknowledgement Section - Only for Reviewee (Staff/Dept Head being reviewed) */}
        {isCompleted && user?.UserID === review.RevieweeID && (
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">
                {isAcknowledged ? 'Your Acknowledgement' : 'Acknowledge This Review'}
              </h3>
              <p className="card-description">
                {isAcknowledged 
                  ? 'You acknowledged this review on ' + new Date(review.AcknowledgedAt).toLocaleDateString()
                  : 'Please acknowledge that you have read and understood this review'
                }
              </p>
            </div>
            <div className="card-content">
              <textarea
                value={acknowledgementComments}
                onChange={(e) => setAcknowledgementComments(e.target.value)}
                className="input w-full"
                rows={4}
                placeholder="Add any comments or questions about this review..."
                disabled={isAcknowledged}
              />
              {!isAcknowledged && (
                <button
                  onClick={handleAcknowledge}
                  disabled={submitting}
                  className="btn btn-primary mt-4"
                >
                  {submitting ? 'Acknowledging...' : 'Acknowledge Review'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* HR Admin View - Read Only */}
        {user?.Role === 'HR Admin' && user?.UserID !== review.RevieweeID && (
          <div className="card mb-6 border-l-4 border-l-blue-500">
            <div className="card-content pt-6 pb-6">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">HR Admin View</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You are viewing this review as HR Admin. Only the reviewee can acknowledge this review.
                  </p>
                  {review.StaffAcknowledgementComments && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Staff Acknowledgement:</p>
                      <p className="text-sm bg-muted/50 rounded-lg p-3">{review.StaffAcknowledgementComments}</p>
                      {review.AcknowledgedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Acknowledged on {new Date(review.AcknowledgedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
          >
            ← Back to Reviews
          </button>
        </div>
      </div>
    </Layout>
  );
}
