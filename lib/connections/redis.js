import Redis from 'ioredis';
import logger from 'lib/logger';
import defaultTo from 'lodash/defaultTo';

const DEFAULT_REDIS_PORT = 6379;

/**
 * @returns {string|object} options for ioredis or sentinel
 */
export const getOptions = () => {
  const eventsRepo = defaultTo(process.env.EVENTS_REPO, 'redis');
  switch (eventsRepo) {
    case 'sentinel': {
      const db = defaultTo(Number(process.env.SENTINEL_DB), 0);
      const password = process.env.SENTINEL_PASSWORD;
      const name = defaultTo(process.env.SENTINEL_NAME, 'mymaster');
      const connections = defaultTo(process.env.SENTINEL_CONNECTIONS, '127.0.0.1:6379');
      const sentinels = connections.split(' ').map((conn) => {
        const [host, port] = conn.split(':');
        return { host, port: defaultTo(Number(port), DEFAULT_REDIS_PORT) };
      });
      return { db, password, name, sentinels };
    }
    default: case 'redis': {
      if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
      }
      const db = defaultTo(Number(process.env.REDIS_DB), 0);
      const password = process.env.REDIS_PASSWORD;
      const host = process.env.REDIS_HOST;
      const port = defaultTo(Number(process.env.REDIS_PORT), DEFAULT_REDIS_PORT);
      return { db, password, host, port };
    }
  }
};

let singletonClient = null;
let singletonSubscriptionClient = null;

export const createClient = () => {
  if (singletonClient) {
    return singletonClient;
  }

  try {
    const options = getOptions();
    logger.info('Creating Redis client');
    logger.silly('Creating Redis client', options);
    singletonClient = new Redis(options);
    return singletonClient;
  } catch (e) {
    logger.error("Couldn't connect to redis", e);
  }
};

export const createSubscriptionClient = () => {
  if (singletonSubscriptionClient) {
    return singletonSubscriptionClient;
  }

  try {
    const options = getOptions();
    logger.info('Creating subscription Redis client');
    logger.silly('Creating subscription Redis client', options);
    singletonSubscriptionClient = new Redis(options);
    return singletonSubscriptionClient;
  } catch (e) {
    logger.error("Couldn't connect to redis", e);
  }
};

export const createClientNew = () => {
  try {
    const options = getOptions();
    logger.info('Creating new Redis client');
    logger.silly('Creating new Redis client', options);
    return new Redis(options);
  } catch (e) {
    logger.error("Couldn't connect to redis", e);
  }
};