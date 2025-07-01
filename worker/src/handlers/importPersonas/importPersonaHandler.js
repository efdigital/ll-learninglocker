import { publish } from 'lib/services/queue';
import { promisify } from 'bluebird';
import { PERSONA_IMPORT_QUEUE, STAGE_IMPORTED } from 'lib/constants/personasImport';
import importPersona from 'lib/services/importPersonas/importPersona';
import moment from 'moment';
import PersonasImport from 'lib/models/personasImport';
import { addErrorsToCsv } from 'lib/services/importPersonas/importPersonas';

export const finishedProcessing = async ({
  personaImportId
}) => {
  await PersonasImport.updateOne({
    _id: personaImportId
  }, {
    importStage: STAGE_IMPORTED,
    importedAt: moment().toDate()
  });

  const personasImport = await PersonasImport.findOne({
    _id: personaImportId
  });

  await addErrorsToCsv({
    personasImport,
    csvHandle: personasImport.csvHandle,
    csvOutHandle: personasImport.csvErrorHandle
  });
};

export default personaService => async ({
  index,
  data,
  personaImportId,
  structure,
  organisation,
  retryCount = 0
}, done) => {
  const MAX_RETRIES = 3;

  try {
    const { processedCount, totalCount } = await importPersona({
      personaImportId,
      structure,
      organisation,
      personaService
    })(data, index);
    if (totalCount && processedCount >= totalCount) {
      await finishedProcessing({ personaImportId });
    }
        } catch (err) {
    console.warn(`Error processing persona import row ${index} for ${personaImportId}:`, err.message);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying persona import row ${index} (attempt ${retryCount + 1}/${MAX_RETRIES})`);

      await promisify(publish)({
        queueName: PERSONA_IMPORT_QUEUE,
        payload: {
          index,
          data,
          personaImportId,
          structure,
          organisation,
          retryCount: retryCount + 1
        }
      });
    } else {
      console.error(`Max retries exceeded for persona import row ${index}, marking as failed:`, err.message);

      // Add error to import errors instead of infinite retry
      await PersonasImport.updateOne({ _id: personaImportId }, {
        $inc: {
          processedCount: 1,
        },
        $push: {
          importErrors: {
            row: index,
            rowErrors: [`Processing error: ${err.message}`]
          }
        }
      });
    }
  }

  done();
};
