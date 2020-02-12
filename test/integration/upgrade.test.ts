import {expect} from 'chai';
import {helper} from './helper';
import {addContainer} from './roomObjectsHelper';

/**
 * Integration Test package to test if we can successfully upgrade a controller
 */

describe('upgrade operation', () => {
  it('when fully stocked will upgrade controller', async () => {
    await addContainer('W0N1', 10, 48, 1000);

    const objects = await helper.server.world.roomObjects('W0N1');
    expect(objects, 'Room Objects length is wrong').length(7);
  });

  it('should fail', () => {
    expect(false, 'custom failure message').to.equal(true);
  });
});
