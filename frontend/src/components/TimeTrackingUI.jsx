import React, { useState, useEffect } from 'react';
import { Button, Statistic, Card, List, Typography, Space, message, Modal, Input } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

const { Text } = Typography;

const TimeTrackingUI = ({ taskId, taskTitle }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [description, setDescription] = useState('');

  // Timer interval for real-time updates
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.start_time)) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
    } else {
      setCurrentTime(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Fetch time entries and check for active timer
  useEffect(() => {
    if (taskId) {
      fetchTimeEntries();
      checkActiveTimer();
    }
  }, [taskId]);

  const fetchTimeEntries = async () => {
    try {
      const entries = await apiClient.get(`/time-entries?task_id=${taskId}`);
      setTimeEntries(entries);
      
      // Calculate total time
      const total = entries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
      setTotalTime(total);
    } catch (error) {
      message.error('Failed to fetch time entries');
    }
  };

  const checkActiveTimer = async () => {
    try {
      const activeEntries = await apiClient.get('/time-entries?active=true');
      const taskActiveTimer = activeEntries.find(entry => entry.task_id === taskId);
      setActiveTimer(taskActiveTimer || null);
    } catch (error) {
      console.error('Failed to check active timer:', error);
    }
  };

  const startTimer = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/time-entries/start', {
        task_id: taskId,
        description: description.trim() || null
      });
      
      setActiveTimer(response);
      setDescription('');
      message.success('Timer started!');
    } catch (error) {
      message.error(error.message || 'Failed to start timer');
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      setLoading(true);
      await apiClient.put(`/time-entries/${activeTimer.id}/stop`);
      
      setActiveTimer(null);
      setCurrentTime(0);
      fetchTimeEntries(); // Refresh entries
      message.success('Timer stopped!');
    } catch (error) {
      message.error(error.message || 'Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const deleteTimeEntry = async (entryId) => {
    try {
      await apiClient.delete(`/time-entries/${entryId}`);
      fetchTimeEntries();
      message.success('Time entry deleted');
    } catch (error) {
      message.error('Failed to delete time entry');
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Time Tracking</Text>
            <br />
            <Text type="secondary">{taskTitle}</Text>
          </div>
          
          <Space>
            {activeTimer ? (
              <>
                <Statistic 
                  value={formatDuration(currentTime)} 
                  valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                />
                <Button 
                  type="primary" 
                  danger
                  icon={<PauseCircleOutlined />}
                  onClick={stopTimer}
                  loading={loading}
                >
                  Stop
                </Button>
              </>
            ) : (
              <>
                <Input.TextArea
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={1}
                  style={{ width: 200, marginRight: 8 }}
                />
                <Button 
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={startTimer}
                  loading={loading}
                >
                  Start Timer
                </Button>
              </>
            )}
          </Space>
        </div>
        
        {totalTime > 0 && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Text>Total Time: <strong>{formatDuration(totalTime)}</strong></Text>
          </div>
        )}
      </Card>

      {timeEntries.length > 0 && (
        <Card title="Time Entries" size="small">
          <List
            dataSource={timeEntries}
            renderItem={(entry) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    size="small"
                    onClick={() => {
                      setEditingEntry(entry);
                      setDescription(entry.description || '');
                      setEditModalVisible(true);
                    }}
                  />,
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    danger
                    size="small"
                    onClick={() => deleteTimeEntry(entry.id)}
                  />
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{formatDuration(entry.duration_seconds)}</span>
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {new Date(entry.start_time).toLocaleString()}
                      </span>
                    </div>
                  }
                  description={entry.description || 'No description'}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Edit Time Entry Modal */}
      <Modal
        title="Edit Time Entry"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingEntry(null);
          setDescription('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary"
            onClick={async () => {
              try {
                await apiClient.put(`/time-entries/${editingEntry.id}`, {
                  description: description.trim() || null
                });
                setEditModalVisible(false);
                setEditingEntry(null);
                setDescription('');
                fetchTimeEntries();
                message.success('Time entry updated');
              } catch (error) {
                message.error('Failed to update time entry');
              }
            }}
          >
            Save
          </Button>
        ]}
      >
        <Input.TextArea
          placeholder="Enter description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
};

export default TimeTrackingUI;