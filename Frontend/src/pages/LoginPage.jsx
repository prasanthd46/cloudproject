import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ADD THIS

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // ADD THIS

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      // Use AuthContext login instead of localStorage directly
      console.log(response.data.user)
      login(response.data.user); // CHANGED
  
      localStorage.setItem('token', response.data.token);
      
      // Redirect based on role
      const { Role } = response.data.user;
      console.log('Redirecting user with role:', Role);
      
      if (Role === 'HR Admin') {
        console.log('Navigating to /hr/dashboard');
        navigate('/hr/dashboard');
      } else if (Role === 'Dept Head') {
        console.log('Navigating to /dh/dashboard');
        navigate('/dh/dashboard');
      } else if (Role === 'Staff') {
        console.log('Navigating to /staff/reviews');
        navigate('/staff/reviews');
      } else {
        console.error('Unknown role:', Role);
        setError('Unknown user role. Contact administrator.');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.needsSignup) {
        setError('Please activate your account first. Redirecting to signup...');
        setTimeout(() => navigate('/signup'), 2000);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login to your account</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@hospital.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            New user?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
              Activate your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
