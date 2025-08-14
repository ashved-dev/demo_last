import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Spin, message } from 'antd';
import { UserOutlined, InboxOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../config/api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('inbox');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    // Update selected key based on current route
    const path = location.pathname;
    if (path.includes('/list/')) {
      const listId = path.split('/list/')[1];
      setSelectedKey(listId);
    } else {
      setSelectedKey('inbox');
    }
  }, [location]);

  const fetchLists = async () => {
    try {
      const response = await apiClient.get('/lists');
      setLists(response);
    } catch (error) {
      message.error('Failed to fetch lists');
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    if (key === 'inbox') {
      const inboxList = lists.find(list => list.is_default);
      if (inboxList) {
        navigate(`/list/${inboxList.id}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate(`/list/${key}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || 'Profile'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const inboxList = lists.find(list => list.is_default);
  const customLists = lists.filter(list => !list.is_default);

  const sidebarItems = [
    {
      key: inboxList?.id || 'inbox',
      icon: <InboxOutlined />,
      label: 'Inbox',
      style: { fontWeight: 'bold' }
    },
    ...customLists.map(list => ({
      key: list.id,
      icon: <UnorderedListOutlined />,
      label: list.name
    }))
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={240}
        style={{ background: '#001529' }}
      >
        <div style={{ padding: '16px 12px' }}>
          <div style={{ 
            color: 'white', 
            fontSize: '18px', 
            fontWeight: 'bold',
            marginBottom: '24px',
            textAlign: collapsed ? 'center' : 'left'
          }}>
            {collapsed ? 'TM' : 'Task Manager'}
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="small" />
            </div>
          ) : (
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              items={sidebarItems}
              onClick={handleMenuClick}
              style={{ background: 'transparent', border: 'none' }}
            />
          )}
        </div>
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', cursor: 'pointer' }
            })}
          </div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>
        
        <Content style={{ 
          padding: '24px',
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;