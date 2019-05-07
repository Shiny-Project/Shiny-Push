'use strict';
const Service = require('egg').Service;
class PushService extends Service {
  async push(channels = [], content, pitures) {
    const availableChannels = [ 'twitter' ];
    channels = channels.filter(i => availableChannels.includes(i));
    
  }
}
module.exports = PushService;
