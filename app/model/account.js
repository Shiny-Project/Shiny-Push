"use strict";

module.exports = (app) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
    const User = app.model.define("push_account", {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: STRING(30),
        name: STRING(30),
        credential: TEXT,
        created_at: { type: DATE, field: "createdAt" },
        updated_at: { type: DATE, field: "updatedAt" },
    });
    return User;
};
