import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function PrivateRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullscreen message="Vérification des permissions..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#DC2626', marginBottom: '1rem' }}>Accès refusé</h1>
        <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.75rem 2rem',
            background: '#14B8A6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Retour
        </button>
      </div>
    );
  }

  return children;
}

export default PrivateRoute;
