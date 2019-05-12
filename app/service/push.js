'use strict';
const Service = require('egg').Service;
const CommonUtils = require('../util/common');
class PushService extends Service {
  async push(channels = [], content = '', images = []) {
    const availableChannels = [ 'twitter', 'weibo' ];
    channels = channels.filter(i => availableChannels.includes(i));
    const createdJobs = [];
    for (const channel of channels) {
      const job = {
        channel,
        text: content,
        info: '{}',
        images: JSON.stringify(images),
        status: 'pending',
      };
      // 创建任务
      const createJob = await this.app.model.PushHistory.create(job);
      // 记录日志
      await this.app.model.PushLog.create({
        status: 'job_created',
        job_id: createJob.id,
        channel,
        info: '{}',
      });
      createdJobs.push(createJob);
      this.ctx.runInBackground(async () => {
        let retries = 3;
        while (retries > 0) {
          // 重试三次
          try {
            const result = await this.service.pusher[channel].send(createJob.id, content, images);
            // 更新任务状态
            await createJob.update({
              info: JSON.stringify(result),
              status: 'success',
            });
            // 记录日志
            await this.app.model.PushLog.create({
              status: 'finished',
              job_id: createJob.id,
              channel,
              info: '{}',
            });
            retries = 0;
          } catch (e) {
            console.log(e);
            // 记录错误
            await createJob.update({
              info: JSON.stringify(e),
              status: 'fail',
            });
            // 记录日志
            await this.app.model.PushLog.create({
              status: 'retry',
              job_id: createJob.id,
              channel,
              info: JSON.stringify({ retry: 4 - retries, error: e.toString() }),
            });
            retries--;
            await CommonUtils.sleep(1000);
          }
        }
      });
    }
    return createdJobs;
  }
}
module.exports = PushService;
