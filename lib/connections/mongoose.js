import mongoose from 'mongoose';
import Promise from 'bluebird';
import logger from 'lib/logger';
import defaultTo from 'lodash/defaultTo';

/** @typedef {module:mongoose.Connection} MongooseConnection */

// NOTE: These options are no longer needed in Mongoose 8:
// - useNewUrlParser: deprecated and always true
// - useFindAndModify: deprecated and always false
// - useCreateIndex: deprecated, createIndex is always used

const maxPoolSize = defaultTo(Number(process.env.MONGO_CONNECTION_POOLSIZE), 20);
// Default timeout to 5 minutes
const socketTimeoutMS = defaultTo(Number(process.env.MONGO_SOCKET_TIMEOUT_MS), 300000);

/** @returns {MongooseConnection} */
const createConnection = () => {
  const dbpath = process.env.MONGODB_PATH;
  const serverOptions = {
    socketTimeoutMS,
    maxPoolSize, // Updated from poolSize (deprecated in MongoDB Node.js Driver 6.x)
  };

  logger.silly('Creating Mongo connection', dbpath, serverOptions);
  return mongoose.createConnection(dbpath, serverOptions);
};

/** @type {Object<string, MongooseConnection>} */
const connections = {};
/** @returns {Object<string, MongooseConnection>} */
const getConnections = () => connections;

/**
 * @param {string} namespace
 * @returns {MongooseConnection}
 */
const getConnection = (namespace = 'll') => {
  if (connections[namespace]) return connections[namespace];
  connections[namespace] = createConnection();
  connections[namespace].on('error', console.error);
  return connections[namespace];
};

export {
  getConnection,
  getConnections
};
