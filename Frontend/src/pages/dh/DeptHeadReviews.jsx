import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function DeptHeadReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/cycles/reviewer/${user.UserID}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'badge bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'badge bg-green-100 text-green-800 border-green-200',
      'Acknowledged': 'badge bg-blue-100 text-blue-800 border-blue-200'
    };
    return <span className={styles[status]}>{status}</span>;
  };

  if (loading) {
    return (
      <Layout title="Staff Reviews">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const pendingReviews = reviews.filter(r => r.Status === 'Pending');
  const completedReviews = reviews.filter(r => r.Status !== 'Pending');

  return (
    <Layout title="Staff Reviews">
      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Pending Reviews</h3>
          <div className="card">
            <div className="card-content p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Review Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingReviews.map((review) => (
                    <tr key={review.ReviewID} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-medium">{review.RevieweeName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{review.RevieweeRole}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{review.CycleName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(review.EndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(review.Status)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => navigate(`/dh/review/${review.ReviewID}`)}
                          className="btn btn-primary btn-sm"
                        >
                          Start Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Reviews</h3>
          <div className="card">
            <div className="card-content p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Review Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {completedReviews.map((review) => (
                    <tr key={review.ReviewID} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-medium">{review.RevieweeName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{review.RevieweeRole}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{review.CycleName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(review.SubmittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(review.Status)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => navigate(`/staff/review/${review.ReviewID}`)}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="card">
          <div className="card-content">
            <p className="text-center text-muted-foreground py-12">
              No staff reviews assigned yet.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
