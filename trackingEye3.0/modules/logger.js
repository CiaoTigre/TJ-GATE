
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const {config} = require("./globals");
const LOGFILE = `/var/log/${config.name}.log`;

const myFormat = printf(info => {
    return `${new Date(Date.now()).toLocaleString()} [${info.level.toUpperCase()}]: ${info.message}`;
});

const logger = (process.env.NODE_ENV || 'development' === 'production') ?
    createLogger({
        level: 'debug',
        format: combine(
            label({ label: config.name }),
            timestamp(),
            myFormat
        ),
        transports: [
            new transports.File(
                {
                    filename: LOGFILE,
                    maxsize: 1000000,  // 1MB
                    timestamp:true,
                    maxFiles:'10',
                    level: 'debug'
                })
        ]
    }) : createLogger({
        level: 'debug',
        format: combine(
            label({ label: config.name }),
            timestamp(),
            myFormat
        ),
        transports: [
            new transports.Console(),
            new transports.File(
                {
                    filename: LOGFILE,
                    maxsize: 1000000,  // 1MB
                    timestamp:true,
                    maxFiles:'10',
                    level: 'debug'
                })
        ]
    });


logger.debug(`========== ${config.name} Start ==============`);


module.exports = logger;
