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
    Radio
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    ClockCircleOutlined
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
    const [activeFilter, setActiveFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [activeTimers, setActiveTimers] = useState({});
    const [timerTimes, setTimerTimes] = useState({});
    const [taskTotalTimes, setTaskTotalTimes] = useState({}); // NEW: Загальний час для кожної таски
    const [form] = Form.useForm();

    useEffect(() => {
        if (listId) {
            fetchListAndTasks();
            checkActiveTimers();
        }
    }, [listId]);

    // Timer interval for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTimerTimes(prev => {
                const updated = { ...prev };
                Object.keys(activeTimers).forEach(taskId => {
                    if (activeTimers[taskId]) {
                        const elapsed = Math.floor((Date.now() - new Date(activeTimers[taskId].start_time)) / 1000);
                        updated[taskId] = elapsed;
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTimers]);

    useEffect(() => {
        let filtered = allTasks;

        // Filter by status
        switch (activeFilter) {
            case 'pending':
                filtered = filtered.filter(task => task.status === 'planned');
                break;
            case 'in_progress':
                filtered = filtered.filter(task => task.status === 'in_progress');
                break;
            case 'done':
                filtered = filtered.filter(task => task.status === 'done');
                break;
            default:
                break;
        }

        // Filter by priority
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        // Filter by date
        if (dateFilter !== 'all') {
            const today = moment().startOf('day');
            const tomorrow = moment().add(1, 'day').startOf('day');
            const nextWeekStart = moment().add(1, 'week').startOf('week');
            const nextWeekEnd = moment().add(1, 'week').endOf('week');

            filtered = filtered.filter(task => {
                if (!task.due_date) return false;

                const dueDate = moment(task.due_date).startOf('day');

                switch (dateFilter) {
                    case 'overdue':
                        return dueDate.isBefore(today) && task.status !== 'done';
                    case 'today':
                        return dueDate.isSame(today);
                    case 'tomorrow':
                        return dueDate.isSame(tomorrow);
                    case 'next_week':
                        return dueDate.isBetween(nextWeekStart, nextWeekEnd, null, '[]');
                    default:
                        return true;
                }
            });
        }

        setFilteredTasks(filtered);
    }, [allTasks, activeFilter, priorityFilter, dateFilter]);

    // NEW: Завантаження загального часу для всіх тасків
    const fetchTasksTotalTime = async (taskIds) => {
        try {
            const timePromises = taskIds.map(async (taskId) => {
                try {
                    const response = await apiClient.get(`/time-entries/tasks/${taskId}/time-summary`);
                    return { taskId, totalSeconds: response.total_seconds };
                } catch (error) {
                    console.error(`Failed to fetch time for task ${taskId}:`, error);
                    return { taskId, totalSeconds: 0 };
                }
            });

            const timeResults = await Promise.all(timePromises);
            const timesMap = {};
            timeResults.forEach(({ taskId, totalSeconds }) => {
                timesMap[taskId] = totalSeconds;
            });

            setTaskTotalTimes(timesMap);
        } catch (error) {
            console.error('Error fetching tasks total time:', error);
        }
    };

    const fetchListAndTasks = async () => {
        try {
            setLoading(true);
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

            // NEW: Завантажуємо загальний час для всіх тасків
            const taskIds = tasksResponse.map(task => task.id);
            if (taskIds.length > 0) {
                await fetchTasksTotalTime(taskIds);
            }

            checkActiveTimers();
        } catch (error) {
            message.error('Failed to load list');
            console.error('Error fetching list and tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkActiveTimers = async () => {
        try {
            const activeEntries = await apiClient.get('/time-entries?active=true');
            const timersMap = {};
            const timesMap = {};

            activeEntries.forEach(entry => {
                if (allTasks.some(task => task.id === entry.task_id)) {
                    timersMap[entry.task_id] = entry;
                    const elapsed = Math.floor((Date.now() - new Date(entry.start_time)) / 1000);
                    timesMap[entry.task_id] = elapsed;
                }
            });

            setActiveTimers(timersMap);
            setTimerTimes(timesMap);
        } catch (error) {
            console.error('Failed to check active timers:', error);
        }
    };

    const startTimer = async (taskId) => {
        try {
            // Check if any timer is already running
            const hasActiveTimer = Object.keys(activeTimers).length > 0;
            if (hasActiveTimer) {
                message.warning('Please stop the current timer before starting a new one');
                return;
            }

            const response = await apiClient.post('/time-entries/start', {
                task_id: taskId
            });

            // Ініціалізуємо таймер з 0 секунд
            setActiveTimers({ [taskId]: response });
            setTimerTimes({ [taskId]: 0 });

        } catch (error) {
            message.error(error.message || 'Failed to start timer');
        }
    };

    const stopTimer = async (taskId) => {
        try {
            const timer = activeTimers[taskId];
            if (!timer) return;

            await apiClient.put(`/time-entries/${timer.id}/stop`);

            setActiveTimers(prev => {
                const updated = { ...prev };
                delete updated[taskId];
                return updated;
            });

            setTimerTimes(prev => {
                const updated = { ...prev };
                delete updated[taskId];
                return updated;
            });

            // NEW: Оновлюємо загальний час для цієї таски після зупинки
            try {
                const response = await apiClient.get(`/time-entries/tasks/${taskId}/time-summary`);
                setTaskTotalTimes(prev => ({
                    ...prev,
                    [taskId]: response.total_seconds
                }));
            } catch (error) {
                console.error('Failed to update total time:', error);
            }

        } catch (error) {
            message.error(error.message || 'Failed to stop timer');
        }
    };

    const formatDuration = (seconds) => {
        // Для відображення у тегах - завжди показуємо час, навіть 0:00
        if (seconds === null || seconds === undefined) return '0:00';

        const totalSeconds = Math.max(0, Math.floor(seconds));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Окрема функція для перевірки чи показувати Total time тег
    const shouldShowTotalTime = (taskId) => {
        const totalSeconds = taskTotalTimes[taskId];
        return totalSeconds && totalSeconds > 0;
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
                const updatedTask = await apiClient.put(`/tasks/${editingTask.id}`, taskData);
                setAllTasks(allTasks.map(task =>
                    task.id === editingTask.id ? updatedTask : task
                ));
                message.success('Task updated successfully!');
            } else {
                const newTask = await apiClient.post('/tasks', taskData);
                setAllTasks([...allTasks, newTask]);
                // NEW: Ініціалізуємо час для нової таски
                setTaskTotalTimes(prev => ({
                    ...prev,
                    [newTask.id]: 0
                }));
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
            await apiClient.delete(`/tasks/${taskId}`);
            setAllTasks(allTasks.filter(task => task.id !== taskId));
            // NEW: Видаляємо час для видаленої таски
            setTaskTotalTimes(prev => {
                const updated = { ...prev };
                delete updated[taskId];
                return updated;
            });
            message.success('Task deleted successfully!');
        } catch (error) {
            console.error('Task deletion error:', error);
            message.error(error.message || 'Failed to delete task');
        }
    };

    const handleToggleTaskStatus = async (task) => {
        try {
            const newStatus = task.status === 'done' ? 'planned' : 'done';
            const updatedTask = await apiClient.patch(`/tasks/${task.id}/status`, {
                status: newStatus
            });

            setAllTasks(allTasks.map(t => t.id === task.id ? updatedTask : t));

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
            case 'high': return '#ff4d4f';
            case 'medium': return '#faad14';
            case 'low': return '#52c41a';
            default: return '#d9d9d9';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'done': return '#52c41a';
            case 'in_progress': return '#faad14';
            case 'planned': return '#1677ff';
            default: return '#d9d9d9';
        }
    };

    const getDueDateColor = (dueDate, status) => {
        if (!dueDate) return '#d9d9d9';
        if (status === 'done') return '#52c41a';

        const today = moment();
        const due = moment(dueDate);

        if (due.isBefore(today, 'day')) {
            return '#ff4d4f';
        } else if (due.isSame(today, 'day')) {
            return '#faad14';
        } else if (due.diff(today, 'days') <= 3) {
            return '#fa8c16';
        } else {
            return '#1677ff';
        }
    };

    const getTaskStats = () => {
        const total = allTasks.length;
        const pending = allTasks.filter(task => task.status === 'planned').length;
        const inProgress = allTasks.filter(task => task.status === 'in_progress').length;
        const completed = allTasks.filter(task => task.status === 'done').length;

        const high = allTasks.filter(task => task.priority === 'high').length;
        const medium = allTasks.filter(task => task.priority === 'medium').length;
        const low = allTasks.filter(task => task.priority === 'low').length;

        const today = moment().startOf('day');
        const tomorrow = moment().add(1, 'day').startOf('day');
        const nextWeekStart = moment().add(1, 'week').startOf('week');
        const nextWeekEnd = moment().add(1, 'week').endOf('week');

        const overdue = allTasks.filter(task =>
            task.due_date &&
            moment(task.due_date).startOf('day').isBefore(today) &&
            task.status !== 'done'
        ).length;

        const todayTasks = allTasks.filter(task =>
            task.due_date &&
            moment(task.due_date).startOf('day').isSame(today)
        ).length;

        const tomorrowTasks = allTasks.filter(task =>
            task.due_date &&
            moment(task.due_date).startOf('day').isSame(tomorrow)
        ).length;

        const nextWeekTasks = allTasks.filter(task =>
            task.due_date &&
            moment(task.due_date).startOf('day').isBetween(nextWeekStart, nextWeekEnd, null, '[]')
        ).length;

        return {
            total, pending, inProgress, completed,
            high, medium, low,
            overdue, todayTasks, tomorrowTasks, nextWeekTasks
        };
    };

    const StatusDot = ({ color, size = 8 }) => (
        <span
            style={{
                display: 'inline-block',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                marginRight: '6px'
            }}
        />
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    const stats = getTaskStats();

    const filterOptions = [
        {
            label: (
                <span>
                    <StatusDot color="#666" />
                    All ({stats.total})
                </span>
            ),
            value: 'all'
        },
        {
            label: (
                <span>
                    <StatusDot color="#1677ff" />
                    Pending ({stats.pending})
                </span>
            ),
            value: 'pending'
        },
        {
            label: (
                <span>
                    <StatusDot color="#faad14" />
                    In Progress ({stats.inProgress})
                </span>
            ),
            value: 'in_progress'
        },
        {
            label: (
                <span>
                    <StatusDot color="#52c41a" />
                    Completed ({stats.completed})
                </span>
            ),
            value: 'done'
        }
    ];

    const priorityFilterOptions = [
        {
            label: (
                <span>
                    <StatusDot color="#666" />
                    All Priority ({stats.total})
                </span>
            ),
            value: 'all'
        },
        {
            label: (
                <span>
                    <StatusDot color="#ff4d4f" />
                    High ({stats.high})
                </span>
            ),
            value: 'high'
        },
        {
            label: (
                <span>
                    <StatusDot color="#faad14" />
                    Medium ({stats.medium})
                </span>
            ),
            value: 'medium'
        },
        {
            label: (
                <span>
                    <StatusDot color="#52c41a" />
                    Low ({stats.low})
                </span>
            ),
            value: 'low'
        }
    ];

    const dateFilterOptions = [
        {
            label: (
                <span>
                    <StatusDot color="#666" />
                    All Dates ({stats.total})
                </span>
            ),
            value: 'all'
        },
        {
            label: (
                <span>
                    <StatusDot color="#ff4d4f" />
                    Overdue ({stats.overdue})
                </span>
            ),
            value: 'overdue'
        },
        {
            label: (
                <span>
                    <StatusDot color="#faad14" />
                    Today ({stats.todayTasks})
                </span>
            ),
            value: 'today'
        },
        {
            label: (
                <span>
                    <StatusDot color="#fa8c16" />
                    Tomorrow ({stats.tomorrowTasks})
                </span>
            ),
            value: 'tomorrow'
        },
        {
            label: (
                <span>
                    <StatusDot color="#1677ff" />
                    Next Week ({stats.nextWeekTasks})
                </span>
            ),
            value: 'next_week'
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        {currentList?.name || 'Tasks'}
                    </Title>
                </div>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateTask}
                    >
                        Add Task
                    </Button>
                </Space>
            </div>

            {/* Main Content Layout: Date Filter + Tasks */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {/* Left Column - Date Filter */}
                <div style={{
                    minWidth: '250px',
                    background: '#fafafa',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8'
                }}>
                    <Text strong style={{
                        marginBottom: '12px',
                        display: 'block',
                        color: '#333',
                        fontSize: '16px'
                    }}>
                        📅 Due Date Filter
                    </Text>
                    <Radio.Group
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dateFilterOptions.map(option => (
                                <Radio
                                    key={option.value}
                                    value={option.value}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        {option.label}
                                    </div>
                                </Radio>
                            ))}
                        </div>
                    </Radio.Group>
                </div>

                {/* Right Column - Status/Priority Filters + Tasks */}
                <div style={{ flex: 1 }}>
                    {/* Status and Priority Filters in One Row */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            gap: '32px',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap'
                        }}>
                            {/* Status Filter */}
                            <div>
                                <Text strong style={{
                                    marginBottom: '8px',
                                    display: 'block',
                                    color: '#666',
                                    fontSize: '14px'
                                }}>
                                    Status:
                                </Text>
                                <Radio.Group
                                    value={activeFilter}
                                    onChange={(e) => setActiveFilter(e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="small"
                                >
                                    {filterOptions.map(option => (
                                        <Radio.Button key={option.value} value={option.value}>
                                            {option.label}
                                        </Radio.Button>
                                    ))}
                                </Radio.Group>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <Text strong style={{
                                    marginBottom: '8px',
                                    display: 'block',
                                    color: '#666',
                                    fontSize: '14px'
                                }}>
                                    Priority:
                                </Text>
                                <Radio.Group
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="small"
                                >
                                    {priorityFilterOptions.map(option => (
                                        <Radio.Button key={option.value} value={option.value}>
                                            {option.label}
                                        </Radio.Button>
                                    ))}
                                </Radio.Group>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
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
                                    : `No tasks found for selected filters`
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
                                                                color: task.status === 'done' ? '#999' : '#333',
                                                                fontSize: '16px'
                                                            }}
                                                        >
                                                            {task.title}
                                                        </Text>
                                                        {task.description && (
                                                            <Text
                                                                style={{
                                                                    display: 'block',
                                                                    marginTop: '4px',
                                                                    color: '#666',
                                                                    textDecoration: task.status === 'done' ? 'line-through' : 'none'
                                                                }}
                                                            >
                                                                {task.description}
                                                            </Text>
                                                        )}
                                                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <Tag
                                                                style={{
                                                                    backgroundColor: getPriorityColor(task.priority),
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                {task.priority.toUpperCase()}
                                                            </Tag>
                                                            <Tag
                                                                style={{
                                                                    backgroundColor: getStatusColor(task.status),
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                {task.status === 'in_progress' ? 'IN PROGRESS' : task.status.toUpperCase()}
                                                            </Tag>
                                                            {task.due_date && (
                                                                <Tag
                                                                    style={{
                                                                        backgroundColor: getDueDateColor(task.due_date, task.status),
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    {moment(task.due_date).format('MMM DD')}
                                                                    {moment(task.due_date).isBefore(moment(), 'day') && task.status !== 'done' && ' (OVERDUE)'}
                                                                </Tag>
                                                            )}
                                                            {task.completed_at && (
                                                                <Tag
                                                                    style={{
                                                                        backgroundColor: '#52c41a',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    ✓ {moment(task.completed_at).format('MMM DD')}
                                                                </Tag>
                                                            )}

                                                            {/* NEW: Активний таймер - показуємо тільки якщо реально працює */}
                                                            {activeTimers[task.id] && timerTimes[task.id] !== undefined && (
                                                                <Tag
                                                                    style={{
                                                                        backgroundColor: '#000000',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        fontWeight: '500',
                                                                        animation: 'pulse 2s infinite'
                                                                    }}
                                                                >
                                                                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                                                    {formatDuration(timerTimes[task.id])}
                                                                </Tag>
                                                            )}

                                                            {/* NEW: Загальний час - показуємо тільки якщо є час */}
                                                            {shouldShowTotalTime(task.id) && (
                                                                <Tag
                                                                    style={{
                                                                        backgroundColor: '#722ed1',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        fontWeight: '500'
                                                                    }}
                                                                >
                                                                    ⏱️ Total: {formatDuration(taskTotalTimes[task.id])}
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Space>
                                                        {/* Timer Button */}
                                                        {activeTimers[task.id] ? (
                                                            <Tooltip title={`Running: ${formatDuration(timerTimes[task.id] || 0)}`}>
                                                                <Button
                                                                    type="text"
                                                                    icon={<PauseCircleOutlined />}
                                                                    onClick={() => stopTimer(task.id)}
                                                                    style={{ color: '#ff4d4f' }}
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Start timer">
                                                                <Button
                                                                    type="text"
                                                                    icon={<PlayCircleOutlined />}
                                                                    onClick={() => startTimer(task.id)}
                                                                    style={{ color: '#52c41a' }}
                                                                    disabled={Object.keys(activeTimers).length > 0}
                                                                />
                                                            </Tooltip>
                                                        )}

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
                                                            <Button
                                                                type="text"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                            />
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
                </div>
            </div>

            {/* Task Modal */}
            <Modal
                title={editingTask ? 'Edit Task' : 'Create New Task'}
                open={taskModalVisible}
                onCancel={() => {
                    setTaskModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
                className="task-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitTask}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[
                            { required: true, message: 'Please enter task title' },
                            { max: 500, message: 'Title must be less than 500 characters' }
                        ]}
                    >
                        <Input placeholder="Enter task title" />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <TextArea rows={3} placeholder="Enter task description" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <Form.Item label="Priority" name="priority">
                            <Select placeholder="Select priority">
                                <Select.Option value="low">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#52c41a" size={10} />
                                        <span style={{ color: '#000' }}>Low</span>
                                    </div>
                                </Select.Option>
                                <Select.Option value="medium">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#faad14" size={10} />
                                        <span style={{ color: '#000' }}>Medium</span>
                                    </div>
                                </Select.Option>
                                <Select.Option value="high">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#ff4d4f" size={10} />
                                        <span style={{ color: '#000' }}>High</span>
                                    </div>
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Status" name="status">
                            <Select placeholder="Select status">
                                <Select.Option value="planned">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#1677ff" size={10} />
                                        <span style={{ color: '#000' }}>Planned</span>
                                    </div>
                                </Select.Option>
                                <Select.Option value="in_progress">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#faad14" size={10} />
                                        <span style={{ color: '#000' }}>In Progress</span>
                                    </div>
                                </Select.Option>
                                <Select.Option value="done">
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <StatusDot color="#52c41a" size={10} />
                                        <span style={{ color: '#000' }}>Done</span>
                                    </div>
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Due Date" name="due_date">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setTaskModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingTask ? 'Update' : 'Create'} Task
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ListView;