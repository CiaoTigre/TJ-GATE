'use struct';

const RedisSMQ = require("rsmq");
const {config} = require("./globals");
const logger = require("./logger");


const TRACK = 'track';

const REDIS_HOST = config.redis.host;
const REDIS_PORT = config.redis.port;




var rsmqServer = null;

class RSMQueue {
    constructor(qname, host) {
        let me = this;
        me.message = null;
        if (!rsmqServer) {
            rsmqServer = new RedisSMQ( {host: host || REDIS_HOST, port: REDIS_PORT, ns: "rsmq"} );
            logger.debug(`[RedisSMQ] connecting to ${REDIS_HOST}:${REDIS_PORT}`);
        }

        this.rsmq = rsmqServer;
        this.qname = qname;
        this.rsmq.createQueueAsync({qname: qname}).then(function (resp) {
            if (resp===1) {
                logger.debug(`[RSMQ] ${me.qname} - queue created`)
            }
        }).catch(function (err) {
            logger.debug(`[RSMQ] ${me.qname} - [ERROR] Create queue ${qname} failed:, ${err.message}`)
        });
    }

    publish(message) {
        let me = this;
        me.rsmq.sendMessageAsync(message).catch(function (err) {
            logger.debug(`[RSMQ] ${me.qname} - [ERROR] publish message ${message} failed:, ${err.message}`)
        })

    }

    subscribe(onSuccess, onError) {
        let me = this;
        
        const interval = setInterval(function () {
            me.rsmq.popMessageAsync({qname: me.qname}).then(function (resp) {
                if (resp.id) {
                    console.log(111, me.qname, resp.id)
                    me.message = resp.message;
                    if (onSuccess instanceof Function)
                        onSuccess(resp.message);
                }
            }).catch(function (err) {
                if (onError instanceof Function)
                    onError(err)
            })
        }, 50);

    }

    receiveMsg(onSuccess, onError) {
        let me = this;
        return me.rsmq.receiveMessageAsync({qname: me.qname}).then(function (resp) {
            if (resp.id) {



                console.log(111, me.qname, resp.id);


                if (onSuccess instanceof Function)
                    onSuccess(resp.message);

                /// Delete after consume
                me.rsmq.deleteMessage({qname:me.qname, id: resp.id}, function (err, resp) {
                    if (resp===1) {
                        // console.log("[RSMQ] LIVE - Message deleted.")
                    }
                    else {
                        logger.error(`[RSMQ] ${me.qname} - Message not found.`, resp.id)
                    }
                });

            } else {
            }

        }).catch(function (err) {
            logger.error(`[RSMQ] ${me.qname} - receiveMessageAsync`, err)
        })
    }

}

module.exports = RSMQueue;