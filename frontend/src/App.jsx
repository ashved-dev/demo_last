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

// Світла тема з чорними акцентами
const blackAccentTheme = {
    token: {
        // Основні кольори - чорний замість синього
        colorPrimary: '#000000',           // Головний колір - чорний
        colorPrimaryHover: '#262626',      // Ховер стан
        colorPrimaryActive: '#434343',     // Активний стан

        // Статусні кольори залишаємо
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#000000',

        // Фонові кольори - світлі
        colorBgBase: '#ffffff',            // Основний фон
        colorBgContainer: '#ffffff',       // Фон контейнерів
        colorBgElevated: '#ffffff',        // Фон модальних вікон
        colorBgLayout: '#f5f5f5',          // Фон layout
        colorBgSpotlight: '#fafafa',       // Фон для виділення

        // Текстові кольори
        colorText: '#000000',              // Основний текст - чорний
        colorTextSecondary: '#666666',     // Вторинний текст
        colorTextTertiary: '#999999',      // Третинний текст
        colorTextQuaternary: '#cccccc',    // Четвертинний текст

        // Кольори рамок
        colorBorder: '#d9d9d9',            // Основні рамки
        colorBorderSecondary: '#f0f0f0',   // Вторинні рамки

        // Параметри дизайну
        borderRadius: 8,
        borderRadiusLG: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',

        // Кольори для кнопок
        controlItemBgHover: '#f5f5f5',
        controlItemBgActive: '#000000',
        controlItemBgActiveHover: '#262626',

        // Налаштування типографії
        fontSize: 14,
        fontSizeHeading1: 32,
        fontSizeHeading2: 24,
        fontSizeHeading3: 18,
        fontWeightStrong: 600,

        // Лінки теж чорні
        colorLink: '#000000',
        colorLinkHover: '#262626',
        colorLinkActive: '#434343',

        // Заповнення кольори
        colorFillAlter: '#fafafa',
        colorFillQuaternary: '#f0f0f0',
        colorFillTertiary: '#f5f5f5',
        colorFillSecondary: '#f0f0f0',

        // Тіні та ефекти
        boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.12)',
        boxShadowTertiary: '0 1px 2px rgba(0, 0, 0, 0.08)',
    },
    components: {
        // Налаштування для конкретних компонентів
        Layout: {
            siderBg: '#000000',              // Темний сайдбар
            triggerBg: '#000000',
            bodyBg: '#ffffff',
            headerBg: '#ffffff',
        },
        Menu: {
            darkItemBg: '#000000',
            darkItemColor: '#ffffff',
            darkItemHoverBg: '#262626',
            darkItemSelectedBg: '#434343',
            darkSubMenuItemBg: '#000000',
        },
        Button: {
            primaryShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            defaultShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        Card: {
            boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        Radio: {
            buttonBg: '#ffffff',
            buttonCheckedBg: '#000000',
            buttonCheckedColor: '#ffffff',
            buttonSolidCheckedBg: '#000000',
            buttonSolidCheckedColor: '#ffffff',
            buttonSolidCheckedHoverBg: '#262626',
        },
        Input: {
            borderRadius: 8,
            controlHeight: 40,
        },
        Select: {
            borderRadius: 8,
            controlHeight: 40,
        },
        DatePicker: {
            borderRadius: 8,
            controlHeight: 40,
        }
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
        <ConfigProvider theme={blackAccentTheme}>
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