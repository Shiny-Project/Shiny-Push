"use strict";
const fs = require("fs");
const Service = require("egg").Service;
const axios = require("axios").default;
const FormData = require("form-data");

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
                disable_notification: true,
            }
        );
        return response.data;
    }
    async sendImageToChannel(image, replyToMessageId) {
        if (!fs.existsSync(image)) {
            await this.app.model.PushLog.create({
                channel: "telegram",
                job_id: this.jobId,
                status: "upload_image_fail",
                info: JSON.stringify({ error: "file not exists" }),
                time: Date.now(),
            });
            return;
        }
        let url = `https://api.telegram.org/bot${this.apiKey}/sendPhoto?chat_id=@${this.channel}`;
        const form = new FormData();
        form.append("photo", fs.createReadStream(image));
        if (replyToMessageId) {
            url += `&reply_to_message_id=${replyToMessageId}`;
        }
        await this.app.model.PushLog.create({
            channel: "telegram",
            job_id: this.jobId,
            status: "upload_image",
            info: JSON.stringify({ path: image }),
            time: Date.now(),
        });
        try {
            await axios({
                method: "POST",
                url,
                headers: form.getHeaders(),
                data: form,
            });
            await this.app.model.PushLog.create({
                channel: "telegram",
                job_id: this.jobId,
                status: "upload_image_success",
                info: JSON.stringify({ path: image }),
                time: Date.now(),
            });
        } catch (e) {
            console.log(e);
            await this.app.model.PushLog.create({
                channel: "telegram",
                job_id: this.jobId,
                status: "upload_image_fail",
                info: JSON.stringify({ error: e }),
                time: Date.now(),
            });
        }
    }
    async send({ jobId, text, images = [], account }) {
        this.jobId = jobId;
        this.account = account;
        if (!this.apiKey || !this.channel) {
            await this.init();
        }
        const sentMessage = await this.sendToChannel(text);
        if (images.length > 0) {
            for (const image of images) {
                await this.sendImageToChannel(image, sentMessage.result?.message_id);
            }
        }
        return sentMessage;
    }
}

module.exports = TelegramService;
