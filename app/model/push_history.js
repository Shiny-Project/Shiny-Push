'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
  const PushHistory = app.model.define('push_history', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    channel: STRING(30),
    status: STRING(30),
    info: TEXT,
    text: TEXT,
    image: TEXT,
    created_at: { type: DATE, field: 'createdAt' },
    updated_at: { type: DATE, field: 'updatedAt' },
  });
  return PushHistory;
};
