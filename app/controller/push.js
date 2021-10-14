"use strict";

const Controller = require("egg").Controller;
const ResponseUtils = require("../util/response");

class PushController extends Controller {
    async send() {
        const { channels, text, account } = this.ctx.request.body;
        if (!channels || !text) {
            [this.ctx.status, this.ctx.body] = ResponseUtils.errorResponse(
                400,
                "missing_parameters",
                "缺少必要参数"
            );
            return;
        }
        const { images } = this.ctx.request.body;
        const postImages = images || [];
        this.ctx.body = await this.service.push.push(channels, text, postImages, account);
    }
}

module.exports = PushController;
