import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (user?.Role === 'HR Admin') {
      return [
        { path: '/hr/dashboard', label: 'Dashboard' },
        { path: '/hr/departments', label: 'Departments' },
        { path: '/hr/users', label: 'Users' },
        { path: '/hr/templates', label: 'Templates' },
        { path: '/hr/cycles', label: 'Review Cycles' },
        { path: '/hr/review-dept-heads', label: 'Review Dept Heads' },
      ];
    } else if (user?.Role === 'Dept Head') {
      return [
        { path: '/dh/dashboard', label: 'Dashboard' },
        { path: '/dh/reviews', label: 'Staff Reviews' },
        { path: '/dh/stats', label: 'Team Stats' },
        { path: '/dh/my-reviews', label: 'My Reviews' },
      ];
    } else if (user?.Role === 'Staff') {
      return [
        { path: '/staff/reviews', label: 'My Reviews' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-slate-900">
                Medical Staff Review System
              </h1>
              <nav className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.FullName}</p>
                <p className="text-xs text-slate-500">{user?.Role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
