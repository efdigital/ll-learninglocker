import { expect } from 'chai';
import async from 'async';
import Role, { canDelete } from './role';

describe('role', () => {
  it('canDelete should return false if last role', async () => {
    const organisationId = '561a679c0c5d017e4004715a';

    const role1 = {
      _id: '961a679c0c5d017e4004715c',
      title: 'Can not delete',
      organisation: organisationId,
      description: 'test'
    };

    await Promise.all([
      Role.create(role1),
      Role.create({
        title: 'Another role',
        organisation: '661a679c0c5d017e4004715b'
      })
    ]);

    // Test
    const result = await canDelete(role1);
    expect(result).to.equal(false);

    await Role.deleteMany({});
  });

  it('canDelete should return true if not last role', async () => {
    const organisationId = '561a679c0c5d017e4004715a';

    const role1 = {
      _id: '961a679c0c5d017e4004715c',
      title: 'Can not delete',
      organisation: organisationId,
      description: 'test'
    };

    await Promise.all([
      Role.create(role1),
      Role.create({
        title: 'Another role',
        organisation: '661a679c0c5d017e4004715b'
      }),
      Role.create({
        title: 'role3',
        organisation: organisationId
      })
    ]);

    // Test
    const result = await canDelete(role1);
    expect(result).to.equal(true);

    await Role.deleteMany({});
  });
});
