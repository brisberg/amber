import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import {mockSpawnQueueInstance} from '../mission.spec';

import SingleHarvestMsn from './single-harvest';

describe('SingleHarvestMsn', () => {
  beforeEach(() => {
    // Set up Globals
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockSpawnQueueInstance(),
    });
    Memory.missions = {};
  });

  it('should use max 1 worker', () => {
    // TODO: Should figure out a better way to test this
    const creep = mockInstanceOf<Creep>({name: 'creep1'});
    const msn = new SingleHarvestMsn('harvest').init('N1W1', {sourceIdx: 0});
    msn.assignCreep(creep);

    msn.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
  });

  it.todo('should request a replacement when the first worker is old');

  it.todo('should send creeps to harvest the Ith Source in the room');

  it.todo('should send the replacement creep to relieve the worker');
});
