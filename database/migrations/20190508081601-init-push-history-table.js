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
        await queryInterface.createTable("push_history", {
            id: { type: INTEGER, primaryKey: true, autoIncrement: true },
            channel: STRING(30),
            status: STRING(30),
            info: TEXT,
            event_id: INTEGER,
            text: TEXT,
            image: TEXT,
            createdAt: DATE,
            updatedAt: DATE,
        });
    },

    down: async (queryInterface) => {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
        await queryInterface.dropTable("push_history");
    },
};
