import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import {mockSpawnQueueInstance} from '../mission.spec';

import SingleHarvestMsn from './single-harvest';

describe.skip('SingleHarvestMsn', () => {
  beforeEach(() => {
    // Set up Globals
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockSpawnQueueInstance(),
    });
  });

  it('should use max 1 worker', () => {
    const creep = mockInstanceOf<Creep>({name: 'creep1'});
    const msn = new SingleHarvestMsn('harvest');
    msn.assignCreep(creep);

    msn.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
  });
});
