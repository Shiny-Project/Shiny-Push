"use strict";

const FormStream = require("formstream");
const BasePusher = require("./base");
require("dotenv").config();

class WeiboService extends BasePusher {
    async init({ account, jobId }) {
        this.jobId = jobId;

        const [credential, config] = await this.getCredential({ account, channel: "weibo" });

        const { accessToken } = credential;
        this.accessToken = accessToken;

        const { suffix } = config;
        this.suffix = suffix || "";
    }
    async sendWeibo(text) {
        const response = await this.ctx.curl("https://api.weibo.com/2/statuses/share.json", {
            method: "POST",
            dataType: "json",
            data: {
                access_token: this.accessToken,
                status: text,
                rip: process.env.REMOTE_IP,
            },
        });
        if (response.status !== 200) {
            throw new Error((response.data && response.data.error) || "Network Error");
        }
        return response.data;
    }
    async sendWeiboWithImages(text, images) {
        const form = new FormStream();
        form.field("access_token", this.accessToken);
        form.field("status", text);
        form.field("rip", process.env.REMOTE_IP);
        form.file("pic", images[0]);
        const response = await this.ctx.curl("https://api.weibo.com/2/statuses/share.json", {
            method: "POST",
            headers: form.headers(),
            dataType: "json",
            stream: form,
        });
        if (response.status !== 200) {
            throw new Error((response.data && response.data.error) || "Network Error");
        }
        return response.data;
    }
    /**
     * 发送微博
     * @param {number} jobId 跟踪用 jobId
     * @param {string[]} text 微博文本
     * @param {string[]} images (optional) 图片路径（只支持一张，超过一张会被忽略）
     * @param {string} account 指定账号名
     */
    async send({ jobId, text, images = [], account }) {
        await this.init({ account, jobId });
        let pushText = text;
        // 文本截断
        if (!this.isValid(pushText + this.suffix)) {
            while (!this.isValid(pushText + this.suffix)) {
                pushText = pushText.slice(0, pushText.length - 1);
            }
        }
        if (images.length > 0) {
            return await this.sendWeiboWithImages(pushText + this.suffix, images);
        }
        return await this.sendWeibo(pushText + this.suffix);
    }
    getWeiboLength(text) {
        const getLength = (a) => {
            if (!a) return 0;
            // eslint-disable-next-line no-control-regex
            const b = a.match(/[^\x00-\xff]/g);
            return a.length + (b ? b.length : 0);
        };
        const c = 41,
            d = 140,
            e = 20,
            g =
                text.match(
                    /(http|https):\/\/[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)+([-A-Z0-9a-z_\$\.\+\!\*\(\)\/\,\:;@&=\?~#%]*)*/gi
                ) || [];
        let h = 0;
        let f = text;
        for (let i = 0, j = g.length; i < j; i++) {
            const k = getLength(g[i]);
            if (/^(http:\/\/t.cn)/.test(g[i])) {
                continue;
            }
            /^(http:\/\/)+(t.sina.com.cn|t.sina.cn)/.test(g[i]) ||
            /^(http:\/\/)+(weibo.com|weibo.cn)/.test(g[i])
                ? (h += k <= c ? k : k <= d ? e : k - d + e)
                : (h += k <= d ? e : k - d + e);
            f = f.replace(g[i], "");
        }
        const l = Math.ceil((h + getLength(f)) / 2);
        return l;
    }
    isValid(text) {
        return this.getWeiboLength(text) < 140;
    }
}

module.exports = WeiboService;
