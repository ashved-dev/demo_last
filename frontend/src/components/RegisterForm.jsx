import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

const { Title, Text } = Typography;

const RegisterForm = ({ onSwitchToLogin, onRegistrationSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            setError(null); // Очистити попередню помилку

            const response = await apiClient.post('/auth/register', {
                name: values.name,
                email: values.email,
                password: values.password
            });

            // Якщо є callback для успішної реєстрації, використовуємо його
            if (onRegistrationSuccess) {
                onRegistrationSuccess({
                    email: values.email,
                    password: values.password,
                    ...response.user
                });
            } else {
                // Fallback до старої логіки
                message.success('Account created successfully! Please login.');
                form.resetFields();
                onSwitchToLogin();
            }
        } catch (error) {
            console.error('Registration error:', error);

            // Детальна обробка помилок
            let errorMessage = 'Registration failed';

            if (error.message) {
                errorMessage = error.message;
            }

            // Спеціальна обробка для вже існуючого користувача
            if (errorMessage.includes('Email already registered') ||
                errorMessage.includes('already exists') ||
                errorMessage.includes('duplicate')) {
                errorMessage = `This email is already registered. Please use a different email or try logging in instead.`;
            }

            setError(errorMessage);
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
                    <Title level={2}>Create Account</Title>
                    <Text type="secondary">Join Task Manager today</Text>
                </div>

                <Form
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[
                            { required: true, message: 'Please enter your full name' },
                            { min: 2, message: 'Name must be at least 2 characters' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Enter your full name"
                        />
                    </Form.Item>

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
                            { required: true, message: 'Please enter your password' },
                            { min: 8, message: 'Password must be at least 8 characters' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Create a strong password"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm Password"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                }
                            })
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Confirm your password"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={onSwitchToLogin}>
                                Back to Login
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Create Account
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text type="secondary">
                        Already have an account?{' '}
                        <Button type="link" onClick={onSwitchToLogin} style={{ padding: 0 }}>
                            Sign in here
                        </Button>
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default RegisterForm;