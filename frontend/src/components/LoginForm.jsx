import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Alert } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null); // Очистити попередню помилку

      const response = await login({
        email: values.email,
        password: values.password
      });

      message.success(`Welcome back, ${response.user.name}!`);
      form.resetFields();
      onLoginSuccess(response.user);
    } catch (error) {
      console.error('Login error:', error);

      // Детальна обробка помилок
      let errorMessage = 'Login failed';
      let errorType = 'error';

      if (error.message) {
        errorMessage = error.message;
      }

      // Специфічні повідомлення для різних типів помилок
      if (errorMessage.includes('Invalid email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        errorType = 'warning';
      } else if (errorMessage.includes('Email is required')) {
        errorMessage = 'Please enter your email address.';
      } else if (errorMessage.includes('Password is required')) {
        errorMessage = 'Please enter your password.';
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
        errorType = 'info';
      } else if (errorMessage.includes('Network Error') || errorMessage.includes('500')) {
        errorMessage = 'Server connection failed. Please try again in a moment.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Login service is temporarily unavailable. Please try again later.';
      }

      setError({ message: errorMessage, type: errorType });
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>Welcome Back</Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
              <Alert
                  message={error.message}
                  type={error.type}
                  showIcon
                  style={{ marginBottom: 16 }}
                  action={
                    error.message.includes('No account found') ? (
                        <Button size="small" type="link" onClick={onSwitchToRegister}>
                          Create account
                        </Button>
                    ) : null
                  }
              />
          )}

          <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
          >
            <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
            >
              <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter your password' }
                ]}
            >
              <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{ width: '100%' }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Button type="link" onClick={onSwitchToRegister} style={{ padding: 0 }}>
                Create one here
              </Button>
            </Text>
          </div>

          {/* Додаткова інформація для debug */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Having trouble? Make sure you're using the same email and password you registered with.
            </Text>
          </div>
        </Card>
      </div>
  );
};

export default LoginForm;