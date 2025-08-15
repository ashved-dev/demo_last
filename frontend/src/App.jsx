import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ListView from './pages/ListView'
import './App.css'

const theme = {
    token: {
        colorPrimary: '#1677ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
}

// Component that redirects to Inbox
const InboxRedirect = () => {
    return <Navigate to="/inbox" replace />;
};

function App() {
    return (
        <ConfigProvider theme={theme}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Redirect to Inbox by default */}
                        <Route
                            path="/inbox"
                            element={
                                <PrivateRoute>
                                    <DashboardLayout>
                                        <ListView />
                                    </DashboardLayout>
                                </PrivateRoute>
                            }
                        />

                        {/* List view route */}
                        <Route
                            path="/list/:listId"
                            element={
                                <PrivateRoute>
                                    <DashboardLayout>
                                        <ListView />
                                    </DashboardLayout>
                                </PrivateRoute>
                            }
                        />

                        {/* Redirect root and dashboard to inbox */}
                        <Route path="/" element={<Navigate to="/inbox" replace />} />
                        <Route path="/dashboard" element={<Navigate to="/inbox" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    )
}

export default App