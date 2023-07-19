"use strict";

const Service = require("egg").Service;
const Twit = require("twit");
const { TwitterApi } = require("twitter-api-v2");
const twitter = require("twitter-text");
const fs = require("fs");

class TwitterService extends Service {
    async init() {
        const records = await this.app.model.Account.findAll({
            where: {
                name: "shiny",
                platform: "twitter",
            },
        });
        if (records.length < 1) {
            throw new Error("无可用 Twitter 渠道账号");
        }
        const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = JSON.parse(
            records[0].credential
        );

        this.twitterClient = new Twit({
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            access_token: accessToken,
            access_token_secret: accessTokenSecret,
            timeout_ms: 60 * 1000,
            strictSSL: true,
        });

        this.v2Client = new TwitterApi({
            appKey: consumerKey,
            appSecret: consumerSecret,
            accessToken,
            accessSecret: accessTokenSecret,
        }).v2;

        return this.twitterClient;
    }
    async sendTweet(text) {
        if (!this.isValid(text)) {
            throw new Error("Tweet 超出长度限制");
        }
        return (await this.v2Client.tweet(text)).data;
    }
    async sendTweetWithImages(text, mediaIds) {
        if (!this.isValid(text)) {
            throw new Error("Tweet 超出长度限制");
        }
        return (
            await this.v2Client.tweet(text, {
                media: {
                    media_ids: mediaIds,
                },
            })
        ).data;
    }
    async uploadImages(images = []) {
        for (const image of images) {
            await this.app.model.PushLog.create({
                channel: "twitter",
                job_id: this.jobId,
                status: "upload_image",
                info: JSON.stringify({ path: image }),
                time: Date.now(),
            });
            const mediaIds = [];
            try {
                const uploadedMedia = await this.twitterClient.post("media/upload", {
                    media_data: fs.readFileSync(image, {
                        encoding: "base64",
                    }),
                });
                mediaIds.push(uploadedMedia.data.media_id_string);
                await this.app.model.PushLog.create({
                    channel: "twitter",
                    job_id: this.jobId,
                    status: "upload_image_success",
                    info: JSON.stringify({ path: image }),
                    time: Date.now(),
                });
            } catch (e) {
                await this.app.model.PushLog.create({
                    channel: "twitter",
                    job_id: this.jobId,
                    status: "upload_image_fail",
                    info: JSON.stringify({ error: e }),
                    time: Date.now(),
                });
            }
            return mediaIds;
        }
    }
    /**
     * 发送 Tweet
     * @param {*} jobId 跟踪用 jobId
     * @param {*} text Tweet 文本
     * @param {*} images (optional) 图片路径
     */
    async send({ jobId, text, images = [] }) {
        if (!this.twitterClient) {
            await this.init();
        }
        let pushText = text;
        // 文本截断
        if (!this.isValid(pushText)) {
            while (!this.isValid(pushText)) {
                pushText = pushText.slice(0, pushText.length - 1);
            }
        }
        this.jobId = jobId;
        if (images.length > 0) {
            const mediaIds = await this.uploadImages(images);
            return await this.sendTweetWithImages(pushText, mediaIds);
        }
        return await this.sendTweet(pushText);
    }
    isValid(text) {
        return twitter.parseTweet(text).valid;
    }
    getTweetLength(text) {
        return twitter.parseTweet(text).weightedLength;
    }
}

module.exports = TwitterService;
