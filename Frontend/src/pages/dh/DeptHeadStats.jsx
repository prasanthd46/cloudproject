import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DeptHeadStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/dh/team-stats/${user.UserID}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Team Statistics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Team Statistics">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Average Team Performance by Question</h3>
          <p className="card-description">
            Overview of your team's performance across different evaluation criteria
          </p>
        </div>
        <div className="card-content">
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="QuestionText" 
                  angle={-45} 
                  textAnchor="end" 
                  height={150} 
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="AvgRating" fill="hsl(221.2 83.2% 53.3%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No performance data available yet. Complete some reviews to see statistics.
            </p>
          )}
        </div>
      </div>

      {/* Stats Table */}
      {stats.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Detailed Statistics</h3>
          </div>
          <div className="card-content p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Average Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Performance Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.map((stat, idx) => {
                  const rating = parseFloat(stat.AvgRating);
                  let level = 'Needs Improvement';
                  let levelColor = 'text-red-600';
                  
                  if (rating >= 4) {
                    level = 'Excellent';
                    levelColor = 'text-green-600';
                  } else if (rating >= 3) {
                    level = 'Good';
                    levelColor = 'text-blue-600';
                  } else if (rating >= 2) {
                    level = 'Fair';
                    levelColor = 'text-yellow-600';
                  }

                  return (
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{stat.QuestionText}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold">
                        {rating.toFixed(2)} / 5.00
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-medium ${levelColor}`}>
                        {level}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
