import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  const handleLoginSuccess = (user) => {
    console.log('Login successful:', user);
    // Redirect to intended page or inbox (instead of dashboard)
    const from = location.state?.from?.pathname || '/inbox';
    navigate(from, { replace: true });
  };

  return (
      <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
      />
  );
};

export default LoginPage;