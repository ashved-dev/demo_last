'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Composite index on (user_id, list_id, status) for main task list views
    await queryInterface.addIndex('tasks', ['user_id', 'list_id', 'status'], {
      name: 'idx_tasks_user_list_status'
    });

    // Partial index on due_date WHERE due_date IS NOT NULL
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;'
    );

    // GIN index on (title, description) for full-text search
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_tasks_search ON tasks USING GIN (to_tsvector(\'english\', title || \' \' || COALESCE(description, \'\')));'
    );

    // Composite index on (priority, status) for priority-based filtering
    await queryInterface.addIndex('tasks', ['priority', 'status'], {
      name: 'idx_tasks_priority_status'
    });

    // Index on task_id in time_entries for time calculation
    await queryInterface.addIndex('time_entries', ['task_id'], {
      name: 'idx_time_entries_task_id'
    });

    // Composite index on (user_id, start_time) for time summary queries
    await queryInterface.addIndex('time_entries', ['user_id', 'start_time'], {
      name: 'idx_time_entries_user_date'
    });

    // Partial index for active time entries WHERE end_time IS NULL
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_time_entries_active ON time_entries(user_id, end_time) WHERE end_time IS NULL;'
    );

    // Index on email for users table
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email'
    });

    // Composite index on (user_id, is_default) for lists
    await queryInterface.addIndex('lists', ['user_id', 'is_default'], {
      name: 'idx_lists_user_default'
    });

    // Index on user_id for lists
    await queryInterface.addIndex('lists', ['user_id'], {
      name: 'idx_lists_user_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('tasks', 'idx_tasks_user_list_status');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_tasks_due_date;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_tasks_search;');
    await queryInterface.removeIndex('tasks', 'idx_tasks_priority_status');
    await queryInterface.removeIndex('time_entries', 'idx_time_entries_task_id');
    await queryInterface.removeIndex('time_entries', 'idx_time_entries_user_date');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_time_entries_active;');
    await queryInterface.removeIndex('users', 'idx_users_email');
    await queryInterface.removeIndex('lists', 'idx_lists_user_default');
    await queryInterface.removeIndex('lists', 'idx_lists_user_id');
  }
};