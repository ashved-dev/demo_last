import React, { useState, useEffect } from 'react';
import { Card, List, Button, Form, Input, Select, DatePicker, Modal, Space, Tag, message, Popconfirm, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

const TaskManagement = ({ selectedListId, lists }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form] = Form.useForm();

  // Priority colors for visual indicators
  const priorityColors = {
    high: '#ff4d4f',
    medium: '#faad14',
    low: '#52c41a'
  };

  // Status colors
  const statusColors = {
    planned: '#1677ff',
    in_progress: '#faad14',
    done: '#52c41a'
  };

  useEffect(() => {
    if (selectedListId) {
      fetchTasks();
    }
  }, [selectedListId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/tasks?list_id=${selectedListId}`);
      setTasks(response);
    } catch (error) {
      message.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (values) => {
    try {
      setFormLoading(true);
      const taskData = {
        ...values,
        list_id: selectedListId,
        due_date: values.due_date?.toISOString()
      };
      
      const newTask = await apiClient.post('/tasks', taskData);
      setTasks([newTask, ...tasks]);
      message.success('Task created successfully!');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTask = async (values) => {
    try {
      setFormLoading(true);
      const taskData = {
        ...values,
        due_date: values.due_date?.toISOString()
      };
      
      const updatedTask = await apiClient.put(`/tasks/${editingTask.id}`, taskData);
      setTasks(tasks.map(task => task.id === editingTask.id ? updatedTask : task));
      message.success('Task updated successfully!');
      setModalVisible(false);
      setEditingTask(null);
      form.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date ? moment(task.due_date) : null
    });
    setModalVisible(true);
  };

  const selectedList = lists.find(list => list.id === selectedListId);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{selectedList?.name || 'Select a List'}</h2>
        {selectedListId && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            New Task
          </Button>
        )}
      </div>

      {selectedListId ? (
        <List
          loading={loading}
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => openEditModal(task)}
                  size="small"
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{task.title}</span>
                    <Tag color={priorityColors[task.priority]}>
                      {task.priority.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    {task.description && <p style={{ margin: 0, marginBottom: 4 }}>{task.description}</p>}
                    {task.due_date && (
                      <span style={{ color: '#666', fontSize: '12px' }}>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Card>
          <p style={{ textAlign: 'center', color: '#666' }}>Select a list to view tasks</p>
        </Card>
      )}

      {/* Task Create/Edit Modal */}
      <Modal
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={editingTask ? handleEditTask : handleCreateTask}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Task Title"
            rules={[
              { required: true, message: 'Please enter a task title' },
              { max: 500, message: 'Title must be 500 characters or less' }
            ]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Enter task description (optional)" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="due_date"
            label="Due Date"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingTask(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManagement;