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

// PUT /api/lists/:id - Update list
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;

    const list = await List.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Validation
    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({ error: 'List name is required' });
      }
      if (name.trim().length > 255) {
        return res.status(400).json({ error: 'List name must be 255 characters or less' });
      }
    }

    await list.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(sort_order !== undefined && { sort_order })
    });

    res.json(list);
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Failed to update list' });
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