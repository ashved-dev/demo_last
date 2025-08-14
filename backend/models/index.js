const sequelize = require('../config/database');
const User = require('./User');
const List = require('./List');
const Task = require('./Task');
const TimeEntry = require('./TimeEntry');

// Define associations
User.hasMany(List, { foreignKey: 'user_id', as: 'lists' });
List.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

List.hasMany(Task, { foreignKey: 'list_id', as: 'tasks' });
Task.belongsTo(List, { foreignKey: 'list_id', as: 'list' });

Task.hasMany(TimeEntry, { foreignKey: 'task_id', as: 'timeEntries' });
TimeEntry.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });

User.hasMany(TimeEntry, { foreignKey: 'user_id', as: 'timeEntries' });
TimeEntry.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  List,
  Task,
  TimeEntry
};