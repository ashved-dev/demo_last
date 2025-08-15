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

// Dashboard content component
const DashboardContent = () => (
    <div style={{ padding: '24px' }}>
      <h1>Welcome to Task Manager</h1>
      <p>Select a list from the sidebar to view and manage your tasks.</p>
      <div style={{ marginTop: '32px' }}>
        <h3>Getting Started:</h3>
        <ul>
          <li>📝 Click on "Inbox" to view your default task list</li>
          <li>➕ Create new lists using the sidebar</li>
          <li>✅ Add tasks and track your productivity</li>
          <li>⏰ Set due dates and priorities</li>
        </ul>
      </div>
    </div>
)

function App() {
  return (
      <ConfigProvider theme={theme}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes with DashboardLayout */}
              <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardLayout>
                        <DashboardContent />
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

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ConfigProvider>
  )
}

export default App