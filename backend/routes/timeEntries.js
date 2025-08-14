const express = require('express');
const { TimeEntry, Task } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All time entry routes require authentication
router.use(authenticateToken);

// POST /api/time-entries/start - Start timer for task
router.post('/start', async (req, res) => {
  try {
    const { task_id, description } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Verify task ownership
    const task = await Task.findOne({
      where: { id: task_id, user_id: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check for existing active timer for this user
    const activeTimer = await TimeEntry.findOne({
      where: { user_id: req.user.id, end_time: null }
    });
    if (activeTimer) {
      return res.status(400).json({ error: 'Another timer is already running. Stop it first.' });
    }

    const timeEntry = await TimeEntry.create({
      task_id,
      user_id: req.user.id,
      start_time: new Date(),
      description: description?.trim() || null
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// PUT /api/time-entries/:id/stop - Stop active timer
router.put('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await TimeEntry.findOne({
      where: { id, user_id: req.user.id, end_time: null }
    });
    if (!timeEntry) {
      return res.status(404).json({ error: 'Active time entry not found' });
    }

    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - new Date(timeEntry.start_time)) / 1000);

    await timeEntry.update({
      end_time: endTime,
      duration_seconds: durationSeconds
    });

    res.json(timeEntry);
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// GET /api/time-entries - Get user's time entries
router.get('/', async (req, res) => {
  try {
    const { task_id, active } = req.query;
    
    const whereClause = { user_id: req.user.id };
    if (task_id) whereClause.task_id = task_id;
    if (active === 'true') whereClause.end_time = null;

    const timeEntries = await TimeEntry.findAll({
      where: whereClause,
      include: [{
        model: Task,
        as: 'task',
        attributes: ['id', 'title']
      }],
      order: [['start_time', 'DESC']]
    });
    
    res.json(timeEntries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// GET /api/tasks/:id/time-summary - Get total time for task
router.get('/tasks/:id/time-summary', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify task ownership
    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const timeEntries = await TimeEntry.findAll({
      where: { task_id: id, user_id: req.user.id },
      attributes: ['duration_seconds']
    });

    const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const entryCount = timeEntries.length;

    res.json({
      task_id: id,
      total_seconds: totalSeconds,
      entry_count: entryCount,
      formatted_time: formatDuration(totalSeconds)
    });
  } catch (error) {
    console.error('Get time summary error:', error);
    res.status(500).json({ error: 'Failed to get time summary' });
  }
});

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

module.exports = router;