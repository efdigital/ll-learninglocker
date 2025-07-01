import Organisation from 'lib/models/organisation';
import Lrs from 'lib/models/lrs';
import Client from 'lib/models/client';
import User from 'lib/models/user';
import Statement from 'lib/models/statement';
import OAuthToken from 'lib/models/oAuthToken';
import async from 'async';
import * as scopes from 'lib/constants/scopes';

export default class journeyDBHelpers {
  prepare = async () => {
    try {
      const organisation = await Organisation.create({
        _id: '561a679c0c5d017e4004714f',
        name: 'Test organisation'
      });

      const user = await User.create({
        _id: '561a679c0c5d017e4004714f',
        email: 'testy@mctestface.com',
        password: 'password1',
        organisations: ['561a679c0c5d017e4004714f'],
        organisationSettings: [
          {
            organisation: '561a679c0c5d017e4004714f',
            scopes: [scopes.ALL]
          }
        ],
        scopes: []
      });

      const lrs = await Lrs.create({
        _id: '561a679c0c5d017e4004714f',
        owner_id: '561a679c0c5d017e4004714f',
        organisation: '561a679c0c5d017e4004714f',
        title: 'Test store',
        description: 'Test'
      });

      this.user = user;
      this.organisation = organisation;
      this.lrs = lrs;

      const client = await Client.findOne({
        organisation: organisation,
        lrs_id: this.lrs._id
      });
      this.client = client;
    } catch (err) {
      throw err;
    }
  };

  cleanUp = async () => {
    await Promise.all([
      Organisation.deleteMany({}),
      User.deleteMany({}),
      Lrs.deleteMany({}),
      Client.deleteMany({}),
      Statement.deleteMany({}),
      OAuthToken.deleteMany({})
    ]);
  };
}
