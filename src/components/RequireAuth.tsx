import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children, requiredRole }) {
  const location = useLocation();
  const userId   = localStorage.getItem('userId');
  const role     = localStorage.getItem('role');

  // 1) not logged in?
  if (!userId) {
    return (
      <Navigate
        to={`/login?redirected=true&from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // 2) wrong role?
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3) all good
  return children;
}
