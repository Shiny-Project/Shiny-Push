"use strict";

const Controller = require("egg").Controller;

class HomeController extends Controller {
    async index() {
        const { ctx } = this;
        await this.app.model.PushHistory.create({
            channel: '[]',
            text: '',
            info: '{}',
            status: 'success'
        });
        ctx.body = {};
    }
}

module.exports = HomeController;
