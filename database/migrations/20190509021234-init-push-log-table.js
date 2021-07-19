"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
        const { INTEGER, DATE, STRING, TEXT } = Sequelize;
        await queryInterface.createTable("push_log", {
            id: { type: INTEGER, primaryKey: true, autoIncrement: true },
            channel: STRING(50),
            status: STRING(50),
            job_id: INTEGER,
            info: TEXT,
            createdAt: DATE,
            updatedAt: DATE,
        });
    },

    // eslint-disable-next-line no-unused-vars
    down: async (queryInterface, Sequelize) => {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
        await queryInterface.dropTable("push_log");
    },
};
