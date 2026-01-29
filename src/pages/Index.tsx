import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  // If user is already logged in, redirect immediately
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show AuthForm immediately - it handles its own loading state if needed
  // Only show loader if we're still checking auth AND there might be a user session
  if (loading) {
    // Return AuthForm directly to avoid flash - it will redirect once auth resolves
    return <AuthForm />;
  }

  return <AuthForm />;
};

export default Index;
