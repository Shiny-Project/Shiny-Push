'use strict';

const Service = require('egg').Service;
const Twit = require('twit');
const twitter = require('twitter-text');

class TwitterService extends Service {
  async init() {
    const records = await this.app.model.Account.findAll({
      where: {
        name: 'shiny',
        platform: 'twitter',
      },
    });
    if (records.length < 1) {
      throw new Error('无可用 Twitter 渠道账号');
    }
    const {
      consumerKey, consumerSecret, accessToken, accessTokenSecret,
    } = JSON.parse(records[0].credential);

    this.twitterClient = new Twit({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      access_token: accessToken,
      access_token_secret: accessTokenSecret,
      timeout_ms: 60 * 1000,
      strictSSL: true,
    });

    return this.twitterClient;
  }
  async sendTweet(text) {
    if (!this.twitterClient) {
      await this.init();
    }
    if (!this.isValid(text)) {
      throw new Error('Tweet 超出长度限制');
    }
    return new Promise((resolve, reject) => {
      this.twitterClient.post('statuses/update', {
        status: text,
      }, (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      });
    });
  }
  async send(text) {
    return await this.sendTweet(text);
  }
  isValid(text) {
    return twitter.parseTweet(text).valid;
  }
}

module.exports = TwitterService;
