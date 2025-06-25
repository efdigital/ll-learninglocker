
import Statement from 'lib/models/statement';
import highland from 'highland';
import logger from 'lib/logger';
import {
  keys,
  reject,
  includes,
  intersection,
  size
} from 'lodash';

import * as Queue from 'lib/services/queue';

import {
  STATEMENT_QUERYBUILDERCACHE_QUEUE,
  STATEMENT_EXTRACT_PERSONAS_QUEUE,
  STATEMENT_FORWARDING_QUEUE
} from 'lib/constants/statements';
import { isAllowedWorkerQueue } from './allowedWorkerQueues';

const queueDependencies = {
  [STATEMENT_QUERYBUILDERCACHE_QUEUE]: {
    preReqs: []
  },
  [STATEMENT_EXTRACT_PERSONAS_QUEUE]: {
    preReqs: []
  },
  [STATEMENT_FORWARDING_QUEUE]: {
    preReqs: []
  },
};

export const addStatementToPendingQueues = async (statement, passedQueues, done) => {
  const queues = passedQueues || queueDependencies;
  if (!statement) {
    logger.error('No statement provided');
    return done();
  }

  const queueNames = keys(queues);
  const pendingQueueNames = reject(queueNames, (queueName) => {
    const queue = queues[queueName];
    const completedQueues = statement.completedQueues || [];
    const processingQueues = statement.processingQueues || [];
    const intersectionQueues = intersection(queue.preReqs, completedQueues);
    // are the preReqs a subset of the queues which have already been completed?
    const preReqsCompleted = intersectionQueues.length === queue.preReqs.length;
    // or is this queue in the completed queues?
    const queueCompleted = includes(completedQueues, queueName);
    // or is this queue in the queues being processed?
    const queueProcessing = includes(processingQueues, queueName);
    // or is an allowed queue?
    const isAllowed = isAllowedWorkerQueue(queueName);

    return !preReqsCompleted || queueCompleted || queueProcessing || !isAllowed;
  });

  try {
    await Statement.updateOne(
      { _id: statement._id },
      {
        $addToSet: { processingQueues: { $each: pendingQueueNames } }
      }
    );

    // adding to queue returns a promise
    // turns queue names into a stream of promises
    // call done when they have all completed
    return highland(pendingQueueNames).flatMap((queueName) => {
      logger.debug('ADDING STATEMENT TO QUEUE', queueName);
      const response = Queue.publish({
        queueName,
        payload: { statementId: statement._id }
      });
      return highland(response);
    }).apply(() => {
      if (size(pendingQueueNames) > 0) {
        logger.debug(`ADDED ${statement._id} to ${pendingQueueNames.join(', ')}`);
      } else {
        logger.debug(`PROCESSED QUEUE FOR STATEMENT ${statement._id}`);
      }

      return done();
    });
  } catch (err) {
    return done(err);
  }
};

export default async ({ status, statementId }, jobDone) => {
  try {
    if (status) {
      logger.debug(`COMPLETED ${statementId} - ${status}`);
      const idFilter = { _id: statementId };

      await Statement.updateOne(
        idFilter,
        {
          $addToSet: { completedQueues: status },
          $pull: { processingQueues: status }
        }
      );

      const statement = await Statement.findOne(idFilter)
        .select({ _id: 1, completedQueues: 1, processingQueues: 1 })
        .lean();

      // get the statement so that we can find which queues it has already been through
      return addStatementToPendingQueues(statement, queueDependencies, (err) => {
        if (err) logger.error('addStatementToPendingQueues error', err);
        if (jobDone) return jobDone(err);
      });
    }

    logger.debug(`NO STATUS, statementId: ${statementId}`);
    const statement = await Statement.findById(
      statementId,
      { _id: 1, completedQueues: 1, processingQueues: 1 }
    );

    return addStatementToPendingQueues(statement, queueDependencies, (err) => {
      if (err) logger.error('addStatementToPendingQueues error', err);
      if (jobDone) return jobDone(err);
    });
  } catch (err) {
    logger.error('statementHandler error', err);
    if (jobDone) jobDone(err);
  }
};
