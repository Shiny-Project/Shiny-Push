"use strict";

module.exports = (app) => {
    const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
    const PushLog = app.model.define("push_log", {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        channel: STRING(50),
        status: STRING(50),
        job_id: INTEGER,
        info: TEXT,
        time: DATE(3),
        created_at: { type: DATE, field: "createdAt" },
        updated_at: { type: DATE, field: "updatedAt" },
    });
    return PushLog;
};
