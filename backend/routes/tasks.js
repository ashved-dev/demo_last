const express = require('express');
const { Task, List } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// GET /api/tasks - Get user's tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const { list_id, status, priority } = req.query;
    
    const whereClause = { user_id: req.user.id };
    if (list_id) whereClause.list_id = list_id;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const tasks = await Task.findAll({
      where: whereClause,
      include: [{
        model: List,
        as: 'list',
        attributes: ['id', 'name']
      }],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, due_date, list_id } = req.body;

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!list_id) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Verify list ownership
    const list = await List.findOne({
      where: { id: list_id, user_id: req.user.id }
    });
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const task = await Task.create({
      user_id: req.user.id,
      list_id,
      title: title.trim(),
      description: description?.trim(),
      priority: priority || 'medium',
      due_date: due_date ? new Date(due_date) : null,
      status: 'planned',
      sort_order: 0
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, list_id } = req.body;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If moving to different list, verify list ownership
    if (list_id && list_id !== task.list_id) {
      const list = await List.findOne({
        where: { id: list_id, user_id: req.user.id }
      });
      if (!list) {
        return res.status(404).json({ error: 'Target list not found' });
      }
    }

    await task.update({
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(priority !== undefined && { priority }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      ...(list_id !== undefined && { list_id })
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['planned', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update status and set/clear completed_at timestamp
    const updateData = { status };
    if (status === 'done' && task.status !== 'done') {
      updateData.completed_at = new Date();
    } else if (status !== 'done' && task.status === 'done') {
      updateData.completed_at = null;
    }

    await task.update(updateData);
    res.json(task);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;