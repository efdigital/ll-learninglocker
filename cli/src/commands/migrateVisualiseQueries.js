import logger from 'lib/logger';
import async from 'async';
import Visualisation from 'lib/models/visualisation';
import _ from 'lodash';

export default async function () {
  logger.info('Updating visualisation queries...');
  try {
    const visualisations = await Visualisation.find({});

    await Promise.all(visualisations.map(async (model) => {
      // for each key in filters
      model.filters = _.mapValues(model.toObject().filters, filterKey =>
         _.map(filterKey, (filter) => {
           let json = {};
           try {
             json = JSON.parse(filter);
           } catch (err) {
             logger.error(err);
           }
           if (!_.has(json, 'match')) json = { match: json };
           return JSON.stringify(json);
         })
      );
      return model.save();
    }));

    logger.info(`${visualisations.length} models updated`);
    process.exit();
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
