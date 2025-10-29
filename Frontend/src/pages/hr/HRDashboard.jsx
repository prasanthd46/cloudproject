import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HRDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [avgRatings, setAvgRatings] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, ratingsRes, deptRes] = await Promise.all([
        axios.get('/api/hr/dashboard-metrics'),
        axios.get('/api/hr/avg-ratings-by-question'),
        axios.get('/api/hr/reviews-by-department')
      ]);
      
      setMetrics(metricsRes.data);
      setAvgRatings(ratingsRes.data);
      setDeptStats(deptRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="HR Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="HR Dashboard">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold mt-2">{metrics?.totalReviews || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{metrics?.completedReviews || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold mt-2">{metrics?.pendingReviews || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold mt-2">{metrics?.completionRate || 0}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Ratings by Question */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Average Ratings by Question</h3>
            <p className="card-description">Overall performance across all questions</p>
          </div>
          <div className="card-content">
            {avgRatings.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={avgRatings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="QuestionText" angle={-45} textAnchor="end" height={120} interval={0} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="AvgRating" fill="hsl(221.2 83.2% 53.3%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No rating data available</p>
            )}
          </div>
        </div>

        {/* Reviews by Department */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Reviews by Department</h3>
            <p className="card-description">Completion status across departments</p>
          </div>
          <div className="card-content">
            {deptStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="DepartmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="TotalReviews" fill="hsl(221.2 83.2% 53.3%)" name="Total" />
                  <Bar dataKey="CompletedReviews" fill="hsl(142.1 76.2% 36.3%)" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No department data available</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );

}
