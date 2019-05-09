'use strict';

const Controller = require('egg').Controller;
const ResponseUtils = require('../util/response');

class PushController extends Controller {
  async send() {
    const { channels, text } = this.ctx.request.body;
    if (!channels || !text) {
      [ this.ctx.status, this.ctx.body ] = ResponseUtils.errorResponse(400, 'missing_parameters', '缺少必要参数');
      return;
    }
    this.ctx.body = await this.service.push.push(channels, text);
  }
}

module.exports = PushController;
