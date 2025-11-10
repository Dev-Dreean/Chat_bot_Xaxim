import pino from 'pino';

const logger = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`,
    level: 'info'
});

export default logger;
