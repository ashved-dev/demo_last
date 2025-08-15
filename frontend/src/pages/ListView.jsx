import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    List,
    Card,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    Select,
    DatePicker,
    Checkbox,
    message,
    Empty,
    Spin,
    Tooltip,
    Popconfirm,
    Switch,
    Divider,
    Badge
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import { apiClient } from '../config/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ListView = () => {
    const { listId } = useParams();
    const navigate = useNavigate();
    const [currentList, setCurrentList] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (listId) {
            fetchListAndTasks();
        }
    }, [listId]);

    // Filter tasks based on showCompleted state
    useEffect(() => {
        if (showCompleted) {
            setFilteredTasks(allTasks);
        } else {
            setFilteredTasks(allTasks.filter(task => task.status !== 'done'));
        }
    }, [allTasks, showCompleted]);

    const fetchListAndTasks = async () => {
        try {
            setLoading(true);

            // Fetch list details and tasks in parallel
            const [listsResponse, tasksResponse] = await Promise.all([
                apiClient.get('/lists'),
                apiClient.get(`/tasks?list_id=${listId}`)
            ]);

            const list = listsResponse.find(l => l.id === listId);
            if (!list) {
                message.error('List not found');
                navigate('/dashboard');
                return;
            }

            setCurrentList(list);
            setAllTasks(tasksResponse);
        } catch (error) {
            message.error('Failed to load list');
            console.error('Error fetching list and tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        form.resetFields();
        form.setFieldsValue({
            priority: 'medium',
            status: 'planned'
        });
        setTaskModalVisible(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        form.setFieldsValue({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? moment(task.due_date) : null
        });
        setTaskModalVisible(true);
    };

    const handleSubmitTask = async (values) => {
        try {
            const taskData = {
                title: values.title,
                description: values.description,
                priority: values.priority,
                status: values.status,
                due_date: values.due_date ? values.due_date.toISOString() : null,
                list_id: listId
            };

            if (editingTask) {
                // Update existing task - використовуємо всі поля включно зі статусом
                const updatedTask = await apiClient.put(`/tasks/${editingTask.id}`, taskData);
                setAllTasks(allTasks.map(task =>
                    task.id === editingTask.id ? updatedTask : task
                ));
                message.success('Task updated successfully!');
            } else {
                // Create new task
                const newTask = await apiClient.post('/tasks', taskData);
                setAllTasks([...allTasks, newTask]);
                message.success('Task created successfully!');
            }

            setTaskModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Task submit error:', error);
            message.error(error.message || 'Failed to save task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            console.log('Deleting task with ID:', taskId);
            await apiClient.delete(`/tasks/${taskId}`);
            setAllTasks(allTasks.filter(task => task.id !== taskId));
            message.success('Task deleted successfully!');
        } catch (error) {
            console.error('Task deletion error:', error);
            message.error(error.message || 'Failed to delete task');
        }
    };

    const handleToggleTaskStatus = async (task) => {
        try {
            // Визначаємо новий статус
            const newStatus = task.status === 'done' ? 'planned' : 'done';

            // Використовуємо правильний PATCH endpoint для статусу
            const updatedTask = await apiClient.patch(`/tasks/${task.id}/status`, {
                status: newStatus
            });

            // Оновлюємо локальний стан
            setAllTasks(allTasks.map(t => t.id === task.id ? updatedTask : t));

            // Показуємо відповідне повідомлення
            if (newStatus === 'done') {
                message.success('Task completed! 🎉');
            } else {
                message.info('Task marked as incomplete');
            }
        } catch (error) {
            console.error('Task toggle error:', error);
            message.error('Failed to update task status');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'red';
            case 'medium': return 'orange';
            case 'low': return 'green';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'done': return 'success';
            case 'in_progress': return 'processing';
            case 'planned': return 'default';
            default: return 'default';
        }
    };

    const getTaskStats = () => {
        const total = allTasks.length;
        const completed = allTasks.filter(task => task.status === 'done').length;
        const pending = total - completed;
        return { total, completed, pending };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    const stats = getTaskStats();

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        {currentList?.name || 'Tasks'}
                    </Title>
                    <Space size="large" style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                            <Badge count={stats.pending} overflowCount={999} color="#1677ff" />
                            <span style={{ marginLeft: '8px' }}>Pending</span>
                        </Text>
                        <Text type="secondary">
                            <Badge count={stats.completed} overflowCount={999} color="#52c41a" />
                            <span style={{ marginLeft: '8px' }}>Completed</span>
                        </Text>
                        <Text type="secondary">
                            Total: {stats.total}
                        </Text>
                    </Space>
                </div>
                <Space>
                    <Tooltip title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}>
                        <Button
                            type={showCompleted ? "primary" : "default"}
                            icon={showCompleted ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            onClick={() => setShowCompleted(!showCompleted)}
                        >
                            {showCompleted ? 'Hide' : 'Show'} Completed
                        </Button>
                    </Tooltip>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateTask}
                    >
                        Add Task
                    </Button>
                </Space>
            </div>

            {/* Progress indicator */}
            {stats.total > 0 && (
                <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text strong>Progress</Text>
                        <Text strong>{Math.round((stats.completed / stats.total) * 100)}%</Text>
                    </div>
                    <div style={{
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        height: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            background: '#52c41a',
                            height: '100%',
                            width: `${(stats.completed / stats.total) * 100}%`,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
                <Empty
                    description={
                        allTasks.length === 0
                            ? "No tasks yet"
                            : showCompleted
                                ? "No tasks found"
                                : "No pending tasks"
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    {allTasks.length === 0 && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
                            Create your first task
                        </Button>
                    )}
                </Empty>
            ) : (
                <List
                    dataSource={filteredTasks}
                    renderItem={(task) => (
                        <List.Item>
                            <Card
                                style={{
                                    width: '100%',
                                    opacity: task.status === 'done' ? 0.7 : 1,
                                    transition: 'opacity 0.3s ease'
                                }}
                                bodyStyle={{ padding: '16px' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <Tooltip title={task.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}>
                                        <Checkbox
                                            checked={task.status === 'done'}
                                            onChange={() => handleToggleTaskStatus(task)}
                                            style={{ marginTop: '2px' }}
                                        />
                                    </Tooltip>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <Text
                                                    strong
                                                    style={{
                                                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                                        color: task.status === 'done' ? '#999' : 'inherit',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    {task.title}
                                                </Text>
                                                {task.description && (
                                                    <div style={{ marginTop: '6px' }}>
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                textDecoration: task.status === 'done' ? 'line-through' : 'none'
                                                            }}
                                                        >
                                                            {task.description}
                                                        </Text>
                                                    </div>
                                                )}

                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <Tag color={getPriorityColor(task.priority)}>
                                                        {task.priority.toUpperCase()}
                                                    </Tag>
                                                    <Tag color={getStatusColor(task.status)}>
                                                        {task.status === 'in_progress' ? 'IN PROGRESS' : task.status.toUpperCase()}
                                                    </Tag>
                                                    {task.due_date && (
                                                        <Tag
                                                            icon={<CalendarOutlined />}
                                                            color={moment(task.due_date).isBefore(moment(), 'day') && task.status !== 'done' ? 'red' : 'blue'}
                                                        >
                                                            {moment(task.due_date).format('MMM DD')}
                                                            {moment(task.due_date).isBefore(moment(), 'day') && task.status !== 'done' && ' (Overdue)'}
                                                        </Tag>
                                                    )}
                                                    {task.completed_at && (
                                                        <Tag icon={<CheckCircleOutlined />} color="green">
                                                            Completed {moment(task.completed_at).format('MMM DD')}
                                                        </Tag>
                                                    )}
                                                </div>
                                            </div>

                                            <Space>
                                                <Tooltip title="Edit task">
                                                    <Button
                                                        type="text"
                                                        icon={<EditOutlined />}
                                                        onClick={() => handleEditTask(task)}
                                                    />
                                                </Tooltip>
                                                <Popconfirm
                                                    title="Delete task"
                                                    description="Are you sure you want to delete this task?"
                                                    onConfirm={() => handleDeleteTask(task.id)}
                                                    okText="Yes"
                                                    cancelText="No"
                                                >
                                                    <Tooltip title="Delete task">
                                                        <Button
                                                            type="text"
                                                            icon={<DeleteOutlined />}
                                                            danger
                                                        />
                                                    </Tooltip>
                                                </Popconfirm>
                                            </Space>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            )}

            {/* Task Modal */}
            <Modal
                title={editingTask ? 'Edit Task' : 'Create New Task'}
                open={taskModalVisible}
                onCancel={() => setTaskModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitTask}
                >
                    <Form.Item
                        name="title"
                        label="Task Title"
                        rules={[
                            { required: true, message: 'Please enter task title' },
                            { max: 500, message: 'Title must be less than 500 characters' }
                        ]}
                    >
                        <Input placeholder="Enter task title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Enter task description (optional)"
                        />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="priority"
                            label="Priority"
                            style={{ flex: 1 }}
                        >
                            <Select>
                                <Select.Option value="low">Low</Select.Option>
                                <Select.Option value="medium">Medium</Select.Option>
                                <Select.Option value="high">High</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Status"
                            style={{ flex: 1 }}
                        >
                            <Select>
                                <Select.Option value="planned">Planned</Select.Option>
                                <Select.Option value="in_progress">In Progress</Select.Option>
                                <Select.Option value="done">Done</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="due_date"
                        label="Due Date"
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            placeholder="Select due date"
                            showToday
                        />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setTaskModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingTask ? 'Update Task' : 'Create Task'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ListView;
