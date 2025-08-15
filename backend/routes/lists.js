const express = require('express');
const { List } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All list routes require authentication
router.use(authenticateToken);

// GET /api/lists - Get user's lists
router.get('/', async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { user_id: req.user.id },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });
    res.json(lists);
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// POST /api/lists - Create new list
router.post('/', async (req, res) => {
  try {
    const { name, sort_order } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ error: 'List name is required' });
    }

    if (name.trim().length > 255) {
      return res.status(400).json({ error: 'List name must be 255 characters or less' });
    }

    const list = await List.create({
      user_id: req.user.id,
      name: name.trim(),
      is_default: false,
      sort_order: sort_order || 0
    });

    res.status(201).json(list);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    console.log('=== PUT TASK REQUEST ===');
    console.log('Task ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);

    const { id } = req.params;
    const { title, description, priority, status, due_date, list_id } = req.body;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!task) {
      console.log('Task not found');
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Current task:', task.toJSON());

    // If moving to different list, verify list ownership
    if (list_id && list_id !== task.list_id) {
      const list = await List.findOne({
        where: { id: list_id, user_id: req.user.id }
      });
      if (!list) {
        return res.status(404).json({ error: 'Target list not found' });
      }
    }

    // Prepare update data including status
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (list_id !== undefined) updateData.list_id = list_id;

    // Handle status update with completed_at logic
    if (status !== undefined) {
      updateData.status = status;

      // Set/clear completed_at based on status change
      if (status === 'done' && task.status !== 'done') {
        updateData.completed_at = new Date();
      } else if (status !== 'done' && task.status === 'done') {
        updateData.completed_at = null;
      }
    }

    console.log('Update data:', updateData);

    await task.update(updateData);
    const updatedTask = await task.reload();

    console.log('Updated task:', updatedTask.toJSON());

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/lists/:id - Delete list
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const list = await List.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Prevent deletion of default list
    if (list.is_default) {
      return res.status(400).json({ error: 'Cannot delete default Inbox list' });
    }

    await list.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

module.exports = router;