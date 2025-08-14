'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'lists',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'planned'
      },
      priority: {
        type: Sequelize.STRING(10),
        defaultValue: 'medium'
      },
      due_date: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()')
      }
    });

    // Add CHECK constraints for status and priority
    await queryInterface.sequelize.query(
      "ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('planned', 'in_progress', 'done'))"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'))"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tasks');
  }
};