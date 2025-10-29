import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../../components/Card'; // Adjust path if needed
import { Loader2, AlertTriangle, ListChecks, Calendar, User, Users, FileText } from 'lucide-react'; // Added icons
import { Link } from 'react-router-dom'; // To link to individual reviews

const API_BASE_URL = 'http://localhost:3000/api';

const HRAllReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllReviews = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch data from the new endpoint
                const response = await axios.get(`${API_BASE_URL}/hr/all-reviews`);
                setReviews(response.data);
            } catch (err) {
                console.error("Error fetching all reviews:", err);
                setError(err.response?.data?.error || "Failed to load review data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllReviews();
    }, []); // Fetch only once on mount

    // --- Helper Functions ---
    const getStatusInfo = (status) => {
        if (status === 'Completed') return { text: 'Completed', color: 'bg-green-100 text-green-800' };
        if (status === 'Acknowledged') return { text: 'Acknowledged', color: 'bg-blue-100 text-blue-800' };
        if (status === 'Pending') return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
        return { text: status, color: 'bg-gray-100 text-gray-800' }; // Default
    };

    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-400 italic">N/A</span>;
        try {
            return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return <span className="text-red-500">Invalid Date</span>; }
    }

    // --- Render Logic ---
    if (loading) return (
        <div className="flex h-[calc(100vh-theme(space.20))] items-center justify-center p-10 text-center text-lg text-indigo-600">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />Loading All Reviews...
        </div>
    );

    if (error) return (
        <div className="p-10 m-5 text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-center shadow-md">
            <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />Error: {error}
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
            <header className="border-b border-gray-200 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                   <ListChecks className="w-8 h-8 mr-3 text-indigo-600"/> All Performance Reviews
                </h1>
                <p className="text-gray-600 mt-1">
                    A comprehensive list of all reviews across cycles and departments.
                </p>
            </header>

            <Card className="shadow-xl bg-white overflow-hidden p-0"> {/* Remove Card padding */}
                 <h2 className="text-xl font-semibold text-gray-800 p-6 border-b sr-only"> {/* Screen reader only */}
                    Review List
                 </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                {/* Adjust columns as needed */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reviewee</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reviewer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cycle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                {/* Add more columns if needed: Template, Completion Date, etc. */}
                                {/* Maybe an action column to view details? */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic"> {/* Adjusted colSpan */}
                                        No reviews found in the system.
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => {
                                    const statusInfo = getStatusInfo(review.Status);
                                    return (
                                        <tr key={review.ReviewID} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{review.RevieweeName || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{review.ReviewerName || <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{review.DepartmentName || <span className="text-gray-400 italic">N/A</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{review.CycleName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(review.DueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </td>
                                            {/* Example Action Link (Optional):
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/hr/review/${review.ReviewID}`} className="text-indigo-600 hover:text-indigo-900">
                                                    View
                                                </Link>
                                            </td>
                                            */}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                 {/* Optional: Add Pagination controls here if the list becomes very long */}
            </Card>
        </div>
    );
};

export default HRAllReviews;