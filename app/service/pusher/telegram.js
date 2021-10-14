"use strict";

const Service = require("egg").Service;
const axios = require("axios").default;

class TelegramService extends Service {
    async init() {
        const records = await this.app.model.Account.findAll({
            where: {
                name: this.account || "shiny",
                platform: "telegram",
            },
        });
        if (records.length < 1) {
            throw new Error("无可用 Twitter 渠道账号");
        }
        const { channel, apiKey } = JSON.parse(records[0].credential);
        this.channel = channel;
        this.apiKey = apiKey;
    }
    async sendToChannel(text) {
        const response = await axios.post(
            `https://api.telegram.org/bot${this.apiKey}/sendMessage`,
            {
                chat_id: `@${this.channel}`,
                text,
            }
        );
        return response.data;
    }
    async send(jobId, text, images = [], account) {
        this.account = account;
        if (!this.apiKey || !this.channel) {
            await this.init();
        }
        return await this.sendToChannel(text);
    }
}

module.exports = TelegramService;
