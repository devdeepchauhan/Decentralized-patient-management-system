import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';

import Home from './pages/Home';
import Login from './pages/Login';
import DashboardDoctor from './pages/DashboardDoctor';
import DashboardPatient from './pages/DashboardPatient';
import DashboardStaff from './pages/DashboardStaff';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/dashboard/doctor/*" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DashboardDoctor />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/patient/*" element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <DashboardPatient />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/staff/*" element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <DashboardStaff />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </Web3Provider>
    </AuthProvider>
  );
}

export default App;
