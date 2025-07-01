import logger from 'lib/logger';
import Statement from 'lib/models/statement';
import * as Queue from 'lib/services/queue';
import { STATEMENT_QUEUE } from 'lib/constants/statements';

export default (queueName, statementHandler) => async ({ statementId }, jobDone, options) => {
  logger.debug('START', queueName, statementId);
  try {
    const statement = await Statement.findById(statementId);
    if (!statement) {
      logger.info(`Purged job for ${queueName} as statement ${statementId} does not exist`);
      return jobDone();
    }

    await new Promise((resolve, reject) => {
      statementHandler(statement, (err) => {
        logger.debug('COMPLETED STATEMENT HANDLER FOR', queueName, statementId);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }, options);
    });

    const payload = { status: queueName, statementId };
    try {
      return Queue.publish({
        queueName: STATEMENT_QUEUE,
        payload
      }, jobDone);
    } catch (err) {
      logger.error(`Error publishing status back to ${STATEMENT_QUEUE}`, payload, err);
      return jobDone(err);
    }
  } catch (err) {
    return jobDone(err);
  }
};
