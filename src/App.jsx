import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/UserDashboard';
import AdminPanel  from './pages/AdminDashboard';
import IssueForm   from './pages/IssueForm';
import RequireAuth from './components/RequireAuth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* protected user dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* protected issue form */}
        <Route
          path="/issue-form"
          element={
            <RequireAuth>
              <IssueForm />
            </RequireAuth>
          }
        />

        {/* protected admin area */}
        <Route
          path="/admin"
          element={
            <RequireAuth requiredRole="admin">
              <AdminPanel />
            </RequireAuth>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
