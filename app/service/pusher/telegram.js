"use strict";
const fs = require("fs");
const axios = require("axios").default;
const FormData = require("form-data");
const CommonUtils = require("../../util/common");
const BasePusher = require("./base");

class TelegramService extends BasePusher {
    async init({ account, jobId }) {
        this.jobId = jobId;

        const credential = await this.getCredential({ account, channel: "telegram" });

        const { apiKey } = credential;
        this.apiKey = apiKey;

        if (account.config) {
            const { channel, prefix, suffix } = JSON.parse(account.config);
            this.channel = channel;
            this.prefix = prefix || "";
            this.suffix = suffix || "";
        }
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
            await this.app.model.PushLog.create({
                channel: "telegram",
                job_id: this.jobId,
                status: "upload_image_fail",
                info: JSON.stringify({ error: e }),
                time: Date.now(),
            });
        }
    }
    async send({ jobId, text, images = [], account, eventId, title, link, level }) {
        await this.init({ account, jobId });
        let pushText = text;
        if (this.prefix) {
            try {
                pushText =
                    `${CommonUtils.template(this.prefix, {
                        eventId,
                        title,
                        link,
                        level,
                    })}` + pushText;
            } catch (e) {
                // ignore
            }
        }
        if (this.suffix) {
            try {
                pushText += `${CommonUtils.template(this.suffix, {
                    eventId,
                    title,
                    link,
                    level,
                })}`;
            } catch (e) {
                // ignore
            }
        }
        const sentMessage = await this.sendToChannel(pushText);
        if (images.length > 0) {
            for (const image of images) {
                await this.sendImageToChannel(image, sentMessage.result?.message_id);
            }
        }
        return sentMessage;
    }
}

module.exports = TelegramService;
