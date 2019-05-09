'use strict';
const Service = require('egg').Service;
class PushService extends Service {
  async push(channels = [], content = '', images = []) {
    const availableChannels = [ 'twitter' ];
    channels = channels.filter(i => availableChannels.includes(i));
    const createdJobs = [];
    for (const channel of channels) {
      const job = {
        channel,
        text: content,
        info: '{}',
        images,
        status: 'pending',
      };
      const createJob = await this.app.model.PushHistory.create(job);
      createdJobs.push(createJob);
      this.ctx.runInBackground(async () => {
        try {
          const result = await this.service.pusher[channel].send(content);
          createJob.update({
            info: JSON.stringify(result),
            status: 'success',
          });
        } catch (e) {
          createJob.update({
            info: JSON.stringify(e),
            status: 'failed',
          });
        }
      });
    }
    return createdJobs;
  }
}
module.exports = PushService;
