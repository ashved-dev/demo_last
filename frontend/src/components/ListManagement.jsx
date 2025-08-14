import React, { useState } from 'react';
import { List, Button, Input, Modal, Form, Popconfirm, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

const ListManagement = ({ lists, onListsChange }) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleCreateList = async (values) => {
    try {
      setLoading(true);
      const newList = await apiClient.post('/lists', {
        name: values.name.trim(),
        sort_order: lists.length
      });
      onListsChange([...lists, newList]);
      message.success('List created successfully!');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  const handleEditList = async (values) => {
    try {
      setLoading(true);
      const updatedList = await apiClient.put(`/lists/${editingList.id}`, {
        name: values.name.trim()
      });
      const updatedLists = lists.map(list => 
        list.id === editingList.id ? updatedList : list
      );
      onListsChange(updatedLists);
      message.success('List updated successfully!');
      setEditModalVisible(false);
      setEditingList(null);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to update list');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await apiClient.delete(`/lists/${listId}`);
      const updatedLists = lists.filter(list => list.id !== listId);
      onListsChange(updatedLists);
      message.success('List deleted successfully!');
    } catch (error) {
      message.error(error.message || 'Failed to delete list');
    }
  };

  const openEditModal = (list) => {
    setEditingList(list);
    form.setFieldsValue({ name: list.name });
    setEditModalVisible(true);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>My Lists</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setCreateModalVisible(true)}
          size="small"
        >
          New List
        </Button>
      </div>

      <List
        dataSource={lists}
        renderItem={(list) => (
          <List.Item
            actions={[
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => openEditModal(list)}
                size="small"
              />,
              !list.is_default && (
                <Popconfirm
                  title="Delete this list?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDeleteList(list.id)}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    danger
                    size="small"
                  />
                </Popconfirm>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={list.is_default ? <InboxOutlined /> : null}
              title={
                <span style={{ fontWeight: list.is_default ? 'bold' : 'normal' }}>
                  {list.name}
                  {list.is_default && <span style={{ color: '#1677ff', marginLeft: 8 }}>(Default)</span>}
                </span>
              }
            />
          </List.Item>
        )}
      />

      {/* Create List Modal */}
      <Modal
        title="Create New List"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleCreateList}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="List Name"
            rules={[
              { required: true, message: 'Please enter a list name' },
              { min: 1, max: 255, message: 'Name must be 1-255 characters' }
            ]}
          >
            <Input placeholder="Enter list name" />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create List
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        title="Edit List"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingList(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleEditList}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="List Name"
            rules={[
              { required: true, message: 'Please enter a list name' },
              { min: 1, max: 255, message: 'Name must be 1-255 characters' }
            ]}
          >
            <Input placeholder="Enter list name" />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditModalVisible(false);
                setEditingList(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update List
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListManagement;