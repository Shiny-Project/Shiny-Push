"use strict";
const Service = require("egg").Service;

class NoAvailableCredentialError extends Error {}

class BasePusher extends Service {
    constructor(args) {
        super(args);
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
        const config = JSON.parse(records[0].config || '{}');

        this.credentialMap.set(identifier, [credential, config]);

        return [credential, config];
    }

    hasClient({ account, channel }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.has(identifier);
    }

    getClient({ account, channel }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.get(identifier);
    }

    setClient({ account, channel, client }) {
        const identifier = `${channel}-${account}`;
        return this.clientMap.set(identifier, client);
    }
}

module.exports = BasePusher;
