'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const FormStream = require('formstream');

class WeiboService extends Service {
  async init() {
    const records = await this.app.model.Account.findAll({
      where: {
        name: 'shiny',
        platform: 'weibo',
      },
    });
    if (records.length < 1) {
      throw new Error('无可用 Weibo 渠道账号');
    }
    const {
      accessToken,
    } = JSON.parse(records[0].credential);
    this.accessToken = accessToken;
  }
  async sendWeibo(text) {
    if (!this.accessToken) {
      await this.init();
    }
    if (!this.isValid(text)) {
      throw new Error('微博超出长度限制');
    }
    const response = await this.ctx.curl('https://api.weibo.com/2/statuses/share.json', {
      method: 'POST',
      dataType: 'json',
      data: {
        access_token: this.accessToken,
        status: text,
      },
    });
    if (response.status !== 200) {
      throw new Error(response.data && response.data.error || 'Network Error');
    }
    return response.data;
  }
  async sendWeiboWithImages(text, images) {
    if (!this.accessToken) {
      await this.init();
    }
    if (!this.isValid(text)) {
      throw new Error('微博超出长度限制');
    }
    const form = new FormStream();
    form.field('access_token', this.accessToken);
    form.field('status', text);
    form.file('pic', images[0]);
    const response = await this.ctx.curl('https://api.weibo.com/2/statuses/share.json', {
      method: 'POST',
      headers: form.headers(),
      dataType: 'json',
      stream: form,
    });
    if (response.status !== 200) {
      throw new Error(response.data && response.data.error || 'Network Error');
    }
    return response.data;
  }
  /**
   * 发送微博
   * @param {number} jobId 跟踪用 jobId
   * @param {string[]} text 微博文本
   * @param {string[]} images (optional) 图片路径（只支持一张，超过一张会被忽略）
   */
  async send(jobId, text, images = []) {
    this.jobId = jobId;
    if (images.length > 0) {
      return await this.sendWeiboWithImages(text, images);
    }
    return await this.sendWeibo(text);
  }
  async isValid(text) {
    return true;
  }
}

module.exports = WeiboService;
