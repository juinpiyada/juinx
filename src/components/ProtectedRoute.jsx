import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    // Not authenticated, redirect to login
    return <Navigate to="/login?redirected=true" replace />;
  }
  return children;
};

export default ProtectedRoute;
