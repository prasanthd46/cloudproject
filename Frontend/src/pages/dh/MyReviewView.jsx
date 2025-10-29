import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx'; // Use final AuthContext
import { Loader2, AlertTriangle, MessageSquare, CheckSquare, UserCheck } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000/api';

const MyReviewView = () => {
    const { reviewId } = useParams();
    // Removed showSuccess state, as we navigate away
    const navigate = useNavigate();
    // Use the correct context values
    const { userEmail, userRole, dbUserId, loading: authLoading } = useAuth();

    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the acknowledgement
    const [dhComments, setDhComments] = useState(''); // Dept Head's comments
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) {
            setLoading(true); return;
        }
        // Ensure user is a Dept Head and has ID
        if (!userEmail || userRole !== 'Dept Head' || !dbUserId) {
            setError("Access denied or user ID not found.");
            setLoading(false);
            return;
        }

        const fetchReviewDetails = async () => {
            if (!reviewId) {
                setError("No Review ID provided in the URL."); setLoading(false); return;
            }

            setLoading(true); setError(null);
            try {
                // Use the SAME staff-reviews endpoint, as it fetches reviews where the user is the REVIEWEE
                const listResponse = await axios.get(`${API_BASE_URL}/cycles/staff-reviews?userId=${dbUserId}`);
                const detailedReview = listResponse.data.find(r => r.ReviewID === parseInt(reviewId));

                if (detailedReview && (detailedReview.Status === 'Completed' || detailedReview.Status === 'Acknowledged')) {
                    setReview(detailedReview);
                    if (detailedReview.StaffComments) { // Field name is still StaffComments in DB
                        setDhComments(detailedReview.StaffComments);
                    }
                } else {
                    setError("Review not found, not yet completed by HR, or feedback is missing.");
                }
            } catch (err) {
                console.error("Error fetching DH's review details:", err);
                setError("Failed to load your review details.");
            } finally {
                setLoading(false);
            }
        };

        fetchReviewDetails();
    }, [reviewId, userEmail, userRole, dbUserId, authLoading]);

    // --- *** CORRECTED SUBMISSION HANDLER *** ---
    const handleAcknowledge = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Call the REAL PUT endpoint
            await axios.put(`${API_BASE_URL}/cycles/review/acknowledge/${reviewId}`, {
                staffComments: dhComments // Backend expects 'staffComments' field name
            });
            
            // Success: Show an alert and navigate back to the dashboard
            alert("Review Acknowledged Successfully!");
            navigate('/dh/dashboard'); // Navigate back to the DH dashboard

        } catch (err) {
            console.error("Error acknowledging review:", err);
            setSubmitError(err.response?.data?.message || "Failed to submit acknowledgement.");
            setIsSubmitting(false); // Only set submitting to false on error
        }
        // No finally block needed, as navigation happens on success
    };
    // --- *** END CORRECTION *** ---

    // Helper to format ratings
    const formatRating = (value) => {
        const ratingMap = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Outstanding' };
        return ratingMap[value] || value;
    };

    // --- Loading and Error States ---
    if (loading || authLoading) return (
        <div className="flex h-[calc(100vh-theme(space.20))] items-center justify-center p-10 text-center text-lg text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />Loading Your Performance Review...
        </div>
    );
     if (error) return (
        <div className="p-10 m-5 text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center shadow-md">
            <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />Error: {error}
        </div>
    );
    if (!review) return (
        <div className="p-10 text-center text-gray-500">Your review is not yet complete or available.</div>
    );

    const isAcknowledged = review.Status === 'Acknowledged';

    return (
        <div className="p-6 md:p-8 space-y-8 bg-white min-h-screen max-w-4xl mx-auto">
            <header className="border-b pb-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 flex items-center">
                    <UserCheck className="w-8 h-8 mr-3 text-indigo-600"/> Your Performance Review
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                    <strong>Review Cycle:</strong> <span className="font-semibold">{review.CycleName}</span>
                    <span className="mx-4 text-gray-400">|</span>
                    <strong>Completed By (HR):</strong> <span className="font-semibold">{review.ReviewerFirstName} {review.ReviewerLastName}</span>
                </p>
                 <p className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${isAcknowledged ? 'text-blue-600' : 'text-green-600'}`}>{review.Status}</span>
                 </p>
            </header>

            {/* GenAI Summary & Sentiment */}
            {review.GenAI_Summary && (
                <Card className="p-6 border-l-4 border-green-500 bg-green-50 shadow-md">
                    <h3 className="text-xl font-semibold text-green-800 mb-2">AI Summary of HR's Comments</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{review.GenAI_Summary}</p>
                    {typeof review.GenAI_SentimentScore === 'number' && (
                        <div className="mt-4 text-sm font-semibold">
                            Sentiment: {' '}
                            <span className={review.GenAI_SentimentScore >= 0.1 ? "text-green-600" : (review.GenAI_SentimentScore <= -0.1 ? "text-red-600" : "text-gray-600")}>
                                {review.GenAI_SentimentScore.toFixed(2)}
                                ({review.GenAI_SentimentScore >= 0.1 ? "Positive" : (review.GenAI_SentimentScore <= -0.1 ? "Negative" : "Neutral")})
                            </span>
                        </div>
                    )}
                </Card>
            )}

            {/* HR's Overall Comments */}
            {review.ManagerOverallComments && (
                 <Card className="p-6 shadow-md border-l-4 border-gray-400 bg-gray-50">
                     <h3 className="text-xl font-semibold mb-3 text-gray-800">HR Admin's Overall Comments</h3>
                     <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-700">
                        {review.ManagerOverallComments}
                    </div>
                </Card>
            )}

            {/* Detailed Feedback */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 pt-6 border-t mt-8">Detailed Feedback from HR</h2>
                {/* Check if FinalReviewData exists AND is an array AND is not empty */}
                {!review.FinalReviewData || !Array.isArray(review.FinalReviewData) || review.FinalReviewData.length === 0 ? (
                    <p className="text-gray-500 italic">No detailed feedback items were provided in this review.</p>
                ) : (
                    review.FinalReviewData.map((item, index) => (
                        <Card key={index} className="p-6 shadow-md border-l-4 border-indigo-500 bg-gray-50">
                            <h3 className="text-xl font-semibold mb-3 text-gray-800">{item.questionText}</h3>
                            {/* Check for rating (including 0) */}
                            {item.ratingValue != null && (
                                <div className="mb-3">
                                    <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                        Rating: {formatRating(item.ratingValue)}
                                    </span>
                                </div>
                            )}
                            {/* Check for text answer */}
                            {item.answerText && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-700 mt-4 mb-2">HR Feedback:</h4>
                                    <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-700">
                                        {item.answerText}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* --- Dept Head Acknowledgement Section --- */}
            <div className="pt-8 border-t mt-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Acknowledgement</h2>
                {isAcknowledged ? (
                    <Card className="p-6 bg-blue-50 border-l-4 border-blue-500">
                        <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                            <CheckSquare className="w-5 h-5 mr-2" /> Review Acknowledged
                        </h3>
                        <p className="text-gray-700 mb-4">You have acknowledged this review. Your comments:</p>
                        {review.StaffComments ? ( // Still uses StaffComments field
                             <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap text-gray-700">
                                {review.StaffComments}
                            </div>
                        ) : ( <p className="text-gray-500 italic">No comments were added.</p> )}
                    </Card>
                ) : (
                    <Card className="p-6 bg-yellow-50 border-l-4 border-yellow-500">
                        <h3 className="text-xl font-semibold text-yellow-800 mb-3 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2" /> Add Your Comments & Acknowledge
                        </h3>
                        <p className="text-gray-700 mb-4">
                            Review the feedback from HR. You can add comments before acknowledging receipt.
                        </p>
                        <textarea
                            id="dhComments"
                            rows="6"
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Add your comments here (optional)..."
                            value={dhComments}
                            onChange={(e) => setDhComments(e.target.value)}
                        />
                        <div className="mt-6 text-right">
                            <Button
                                onClick={handleAcknowledge}
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Acknowledge Review"}
                            </Button>
                        </div>
                        {submitError && (
                            <div className="mt-4 text-red-600 text-center font-medium">{submitError}</div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MyReviewView;