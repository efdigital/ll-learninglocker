/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiFs from 'chai-fs';
import path from 'path';
import stream from 'stream';
import ExportDBHelper from 'api/utils/tests/exportsDBHelper';
import { streamToCsv, groupStreams } from 'api/utils/exports';
import { getConnection } from 'lib/connections/mongoose';
import highland from 'highland';
import Statement from 'lib/models/statement';
import _ from 'lodash';

const connection = getConnection();

chai.use(chaiFs);
const { expect } = chai;
const exportDBHelper = new ExportDBHelper();

describe('Export helper tests', () => {
  beforeEach(async () => {
    await Statement.deleteMany({});
  });

  before(async () => {
    if (connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Database connection timeout after 10 seconds'));
        }, 10000);

        const onConnected = () => {
          clearTimeout(timeout);
          connection.removeListener('error', onError);
          resolve();
        };

        const onError = (error) => {
          clearTimeout(timeout);
          connection.removeListener('connected', onConnected);
          reject(error);
        };

        connection.once('connected', onConnected);
        connection.once('error', onError);
      });
    }
  });

  beforeEach('Set up statements for testing', async () => {
    try {
      await exportDBHelper.prepare();
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  afterEach('Clear db collections', async () => {
    await exportDBHelper.cleanUp();
  });

  describe('groupStreams', () => {
    it('should take 2 streams and output a single stream with length 3', (done) => {
      const xStream = highland(exportDBHelper.xStream);
      const yStream = highland(exportDBHelper.yStream);
      const singleStream = groupStreams([xStream, yStream]);

      singleStream.toArray((res) => {
        expect(res).to.deep.equal(exportDBHelper.singleStream);
        done();
      });
    });
  });

  describe('streamToCsv', () => {
    const testPath = path.join(__dirname, 'testcsv.csv');
    //
    // afterEach(() => {
    //   fs.unlinkSync(testPath);
    // });

    it('should take a stream and store it to a file', (done) => {
      const testStream = highland(_.values(exportDBHelper.statements));
      streamToCsv(['_id'], testStream, testPath).then((csvStream) => {
        expect(csvStream).to.not.be.null;
        expect(csvStream).to.be.instanceOf(stream.Readable);
        done();
      });
    });

    it('should zip 3 streams and store them to a file', (done) => {
      const testStream1 = highland(_.map(exportDBHelper.statements, statement => statement.toObject()));
      const testStream2 = highland(_.map(exportDBHelper.statements, statement => statement.toObject()));
      const testStream3 = highland(_.map(exportDBHelper.statements, statement => statement.toObject()));
      const singleStream = groupStreams([testStream1, testStream2, testStream3]);
      streamToCsv(['_id'], singleStream, testPath).then((csvStream) => {
        expect(csvStream).to.not.be.null;
        expect(csvStream).to.be.instanceOf(stream.Readable);
        done();
      });
    });
  });
});
