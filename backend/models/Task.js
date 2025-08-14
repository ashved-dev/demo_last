const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  list_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'planned',
    validate: {
      isIn: [['planned', 'in_progress', 'done']]
    }
  },
  priority: {
    type: DataTypes.STRING(10),
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high']]
    }
  },
  due_date: {
    type: DataTypes.DATE
  },
  completed_at: {
    type: DataTypes.DATE
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (task) => {
      // Set completed_at when status changes to 'done'
      if (task.changed('status')) {
        if (task.status === 'done' && !task.completed_at) {
          task.completed_at = new Date();
        } else if (task.status !== 'done' && task.completed_at) {
          task.completed_at = null;
        }
      }
    }
  }
});

module.exports = Task;