import React from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  const handleRegistrationSuccess = async (userData) => {
    try {
      // Показуємо повідомлення про успішну реєстрацію
      message.success('Account created successfully! Logging you in...');

      // Автоматично логінимо користувача після реєстрації
      const loginResponse = await login({
        email: userData.email,
        password: userData.password
      });

      // Перенаправляємо на дашборд
      message.success(`Welcome, ${loginResponse.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Якщо автоматичний логін не вдався, перенаправляємо на сторінку логіну
      navigate('/login');
    }
  };

  return (
      <RegisterForm
          onSwitchToLogin={handleSwitchToLogin}
          onRegistrationSuccess={handleRegistrationSuccess}
      />
  );
};

export default RegisterPage;