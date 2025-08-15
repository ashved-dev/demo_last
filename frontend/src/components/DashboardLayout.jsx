import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Spin,
  message,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  Space,
  Divider
} from 'antd';
import {
  UserOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
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
  const [listModalVisible, setListModalVisible] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    // Update selected key based on current route
    const path = location.pathname;
    if (path.includes('/list/')) {
      const listId = path.split('/list/')[1];
      setSelectedKey(listId);
    } else if (path.includes('/inbox')) {
      // Find inbox list ID
      const inboxList = lists.find(list => list.is_default);
      if (inboxList) {
        setSelectedKey(inboxList.id);
      } else {
        setSelectedKey('inbox');
      }
    }
  }, [location, lists]);

  const fetchLists = async () => {
    try {
      const response = await apiClient.get('/lists');
      setLists(response);

      // Auto-redirect to inbox if on /inbox route
      if (location.pathname === '/inbox' && response.length > 0) {
        const inboxList = response.find(list => list.is_default);
        if (inboxList) {
          navigate(`/list/${inboxList.id}`, { replace: true });
        }
      }
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
        navigate('/inbox');
      }
    } else {
      navigate(`/list/${key}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // CRUD Functions for Lists
  const handleCreateList = () => {
    setEditingList(null);
    form.resetFields();
    setListModalVisible(true);
  };

  const handleEditList = (list, event) => {
    event.stopPropagation(); // Prevent menu click
    setEditingList(list);
    form.setFieldsValue({ name: list.name });
    setListModalVisible(true);
  };

  const handleDeleteList = async (listId, event) => {
    event.stopPropagation(); // Prevent menu click
    try {
      await apiClient.delete(`/lists/${listId}`);
      const updatedLists = lists.filter(list => list.id !== listId);
      setLists(updatedLists);
      message.success('List deleted successfully!');

      // If we're currently viewing the deleted list, navigate to inbox
      if (selectedKey === listId) {
        const inboxList = updatedLists.find(list => list.is_default);
        if (inboxList) {
          navigate(`/list/${inboxList.id}`);
        } else {
          navigate('/inbox');
        }
      }
    } catch (error) {
      message.error(error.message || 'Failed to delete list');
    }
  };

  const handleSaveList = async (values) => {
    try {
      setModalLoading(true);

      if (editingList) {
        // Update existing list
        const updatedList = await apiClient.put(`/lists/${editingList.id}`, {
          name: values.name.trim()
        });
        const updatedLists = lists.map(list =>
            list.id === editingList.id ? updatedList : list
        );
        setLists(updatedLists);
        message.success('List updated successfully!');
      } else {
        // Create new list
        const newList = await apiClient.post('/lists', {
          name: values.name.trim(),
          sort_order: lists.length
        });
        setLists([...lists, newList]);
        message.success('List created successfully!');
      }

      setListModalVisible(false);
      form.resetFields();
      setEditingList(null);
    } catch (error) {
      message.error(error.message || `Failed to ${editingList ? 'update' : 'create'} list`);
    } finally {
      setModalLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
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

  // Prepare sidebar items - Inbox is now the main item
  const sidebarItems = [
    {
      key: inboxList?.id || 'inbox',
      icon: <InboxOutlined />,
      label: 'Inbox',
      style: { fontWeight: 'bold' }
    },
    ...(customLists.length > 0 ? [{ type: 'divider' }] : []),
    ...customLists.map(list => ({
      key: list.id,
      icon: <UnorderedListOutlined />,
      label: (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            <span>{list.name}</span>
            {!collapsed && (
                <Space size="small">
                  <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handleEditList(list, e)}
                      style={{
                        color: 'rgba(255,255,255,0.65)',
                        border: 'none',
                        height: '20px',
                        width: '20px',
                        padding: 0
                      }}
                  />
                  <Popconfirm
                      title="Delete this list?"
                      description="This action cannot be undone."
                      onConfirm={(e) => handleDeleteList(list.id, e)}
                      okText="Delete"
                      cancelText="Cancel"
                      placement="right"
                  >
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: 'rgba(255,255,255,0.65)',
                          border: 'none',
                          height: '20px',
                          width: '20px',
                          padding: 0
                        }}
                    />
                  </Popconfirm>
                </Space>
            )}
          </div>
      )
    }))
  ];

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={280}
            collapsedWidth={80}
            style={{
              background: 'linear-gradient(180deg, #1677ff 0%, #0958d9 100%)',
              boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
            }}
        >
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              color: '#fff',
              fontSize: collapsed ? '18px' : '20px',
              fontWeight: 'bold',
              padding: '16px',
              textAlign: collapsed ? 'center' : 'left'
            }}>
              {collapsed ? 'TM' : 'Task Manager'}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin size="small" />
                </div>
            ) : (
                <>
                  <Menu
                      theme="dark"
                      mode="inline"
                      selectedKeys={[selectedKey]}
                      items={sidebarItems}
                      onClick={handleMenuClick}
                      style={{ background: 'transparent', border: 'none' }}
                  />

                  {!collapsed && (
                      <>
                        <Divider style={{
                          borderColor: 'rgba(255,255,255,0.15)',
                          margin: '16px 0'
                        }} />
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleCreateList}
                            style={{
                              width: 'calc(100% - 32px)',
                              margin: '0 16px',
                              color: 'rgba(255,255,255,0.85)',
                              borderColor: 'rgba(255,255,255,0.3)',
                              background: 'transparent'
                            }}
                        >
                          New List
                        </Button>
                      </>
                  )}
                </>
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
              {collapsed && (
                  <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={handleCreateList}
                      style={{ marginLeft: '12px' }}
                  >
                    New List
                  </Button>
              )}
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

        {/* List Create/Edit Modal */}
        <Modal
            title={editingList ? 'Edit List' : 'Create New List'}
            open={listModalVisible}
            onCancel={() => {
              setListModalVisible(false);
              form.resetFields();
              setEditingList(null);
            }}
            footer={null}
            width={400}
        >
          <Form
              form={form}
              onFinish={handleSaveList}
              layout="vertical"
          >
            <Form.Item
                name="name"
                label="List Name"
                rules={[
                  { required: true, message: 'Please enter a list name' },
                  { min: 1, max: 255, message: 'Name must be 1-255 characters' },
                  {
                    pattern: /^[^\s].*[^\s]$|^[^\s]$/,
                    message: 'Name cannot start or end with spaces'
                  }
                ]}
            >
              <Input
                  placeholder="Enter list name"
                  autoFocus
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => {
                  setListModalVisible(false);
                  form.resetFields();
                  setEditingList(null);
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={modalLoading}>
                  {editingList ? 'Update' : 'Create'} List
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
  );
};

export default DashboardLayout;