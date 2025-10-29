import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Signup from './pages/Signup';
import HRDashboard from './pages/hr/HRDashboard';
import ManageDepartments from './pages/hr/ManageDepartments';
import ManageUsers from './pages/hr/ManageUsers';
import ManageTemplates from './pages/hr/ManageTemplates';
import ManageCycles from './pages/hr/ManageCycles';
import ReviewDeptHeads from './pages/hr/ReviewDeptHead';
import DeptHeadDashboard from './pages/dh/DeptHeadDashboard';
import DeptHeadReviews from './pages/dh/DeptHeadReviews';
import ReviewForm from './pages/dh/ReviewForm';
import DeptHeadStats from './pages/dh/DeptHeadStats';
import StaffReviews from './pages/staff/StaffReviews';
import StaffReviewView from './pages/staff/StaffReviewView';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signup />} />
          {/* HR Admin Routes */}
          <Route path="/hr/dashboard" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/hr/departments" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <ManageDepartments />
            </ProtectedRoute>
          } />
          <Route path="/hr/users" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <ManageUsers />
            </ProtectedRoute>
          } />
          <Route path="/hr/templates" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <ManageTemplates />
            </ProtectedRoute>
          } />
          <Route path="/hr/cycles" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <ManageCycles />
            </ProtectedRoute>
          } />
          <Route path="/hr/review-dept-heads" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <ReviewDeptHeads />
            </ProtectedRoute>
          } />
          
          {/* Dept Head Routes */}
          <Route path="/dh/dashboard" element={
            <ProtectedRoute allowedRoles={['Dept Head']}>
              <DeptHeadDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dh/reviews" element={
            <ProtectedRoute allowedRoles={['Dept Head']}>
              <DeptHeadReviews />
            </ProtectedRoute>
          } />
          <Route path="/dh/review/:reviewId" element={
            <ProtectedRoute allowedRoles={['Dept Head', 'HR Admin']}>
              <ReviewForm />
            </ProtectedRoute>
          } />
          <Route path="/dh/stats" element={
            <ProtectedRoute allowedRoles={['Dept Head']}>
              <DeptHeadStats />
            </ProtectedRoute>
          } />
          <Route path="/dh/my-reviews" element={
            <ProtectedRoute allowedRoles={['Dept Head']}>
              <StaffReviews />
            </ProtectedRoute>
          } />
          <Route path="/hr/view-review/:reviewId" element={
            <ProtectedRoute allowedRoles={['HR Admin']}>
              <StaffReviewView />
            </ProtectedRoute>
          } />
          {/* Staff Routes */}
          <Route path="/staff/reviews" element={
            <ProtectedRoute allowedRoles={['Staff']}>
              <StaffReviews />
            </ProtectedRoute>
          } />
          <Route path="/staff/review/:reviewId" element={
            <ProtectedRoute allowedRoles={['Staff', 'Dept Head']}>
              <StaffReviewView />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
