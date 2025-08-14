const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeSave: (user) => {
      if (user.email) {
        user.email = user.email.toLowerCase();
      }
    },
    afterCreate: async (user, options) => {
      // Create default Inbox list for new user
      const { List } = require('./List');
      await List.create({
        user_id: user.id,
        name: 'Inbox',
        is_default: true,
        sort_order: 0
      }, { transaction: options.transaction });
    }
  }
});

module.exports = User;