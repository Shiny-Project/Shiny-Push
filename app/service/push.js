"use strict";
const Service = require("egg").Service;
const CommonUtils = require("../util/common");
const Lock = require('../util/lock');
class PushService extends Service {
    async push({ channels = [], content = "", images = [], account, eventId, title, link, level }) {
        const availableChannels = ["twitter", "weibo", "telegram"];
        channels = channels.filter((i) => availableChannels.includes(i));
        if (channels.length === 0) {
            this.ctx.status = 400;
            return {
                status: "error",
                info: "不支持该推送渠道",
            };
        }
        const createdJobs = [];
        for (const channel of channels) {
            const job = {
                channel,
                account,
                text: content,
                info: "{}",
                image: JSON.stringify(images),
                status: "pending",
            };
            // 创建任务
            const createJob = await this.app.model.PushHistory.create(job);
            // 记录日志
            await this.app.model.PushLog.create({
                status: "job_created",
                job_id: createJob.id,
                channel,
                info: "{}",
                time: Date.now(),
            });
            createdJobs.push(createJob);
            this.ctx.runInBackground(async () => {
                let retries = 3;
                let allowImages = true;
                const channelLock = Lock.get(channel);
                await channelLock.acquire();
                while (retries > 0) {
                    // 重试三次
                    try {
                        const result = await this.service.pusher[channel].send({
                            jobId: createJob.id,
                            text: content,
                            images: allowImages ? images : [],
                            account,
                            eventId,
                            title,
                            link,
                            level,
                        });
                        // 更新任务状态
                        await createJob.update({
                            info: JSON.stringify(result),
                            status: "success",
                        });
                        // 记录日志
                        await this.app.model.PushLog.create({
                            status: "finished",
                            job_id: createJob.id,
                            channel,
                            info: "{}",
                            time: Date.now(),
                        });
                        retries = 0;
                    } catch (e) {
                        console.log(e);
                        // 记录错误
                        await createJob.update({
                            info: JSON.stringify(e),
                            status: "fail",
                        });
                        // 记录日志
                        await this.app.model.PushLog.create({
                            status: "retry",
                            job_id: createJob.id,
                            channel,
                            info: JSON.stringify({ retry: 4 - retries, error: e.toString() }),
                            time: Date.now(),
                        });
                        retries--;
                        // 如果重试三次&带图 再试一次没图的
                        if (retries === 0 && images.length > 0 && allowImages === true) {
                            allowImages = false;
                            retries++;
                        }
                        await CommonUtils.sleep(1000);
                    }
                }
                channelLock.release();
            });
        }
        return createdJobs;
    }
}
module.exports = PushService;
