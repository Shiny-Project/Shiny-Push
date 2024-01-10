"use strict";
const Service = require("egg").Service;

class NoAvailableCredentialError extends Error {}

class BasePusher extends Service {
    constructor() {
        super();
        this.credentialMap = new Map();
        this.clientMap = new Map();
    }

    async getCredential({ account, channel }) {
        const identifier = `${channel}-${account}`;
        if (this.credentialMap.has(identifier)) {
            return this.credentialMap.get(identifier);
        }
        const records = await this.app.model.Account.findAll({
            where: {
                name: account,
                platform: channel,
            },
        });

        if (records.length < 1) {
            throw new NoAvailableCredentialError(
                `No available credential for channel: ${channel}, account: ${account}`
            );
        }

        const credential = JSON.parse(records[0].credential);

        this.credentialMap.set(identifier, credential);

        return credential;
    }

    async hasClient({ account, channel }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.has(identifier);
    }

    async getClient({ account, channel }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.get(identifier);
    }

    async setClient({ account, channel, client }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.set(identifier, client);
    }
}

module.exports = BasePusher;
