import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import {mockSpawnQueueInstance} from '../mission.spec';

import SingleHarvestMsn from './single-harvest';

describe('SingleHarvestMsn', () => {
  let source: Source;
  let creep: Creep;

  beforeEach(() => {
    // Set up Globals
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockSpawnQueueInstance(),
    });
    source = mockInstanceOf<Source>({
      id: '12345' as Id<Source>,
      pos: new RoomPosition(5, 5, 'N1W1'),
    });
    const room = mockInstanceOf<Room>({
      find: (find: FindConstant) => {
        if (find === FIND_SOURCES) {
          return [source];
        } else {
          return [];
        }
      },
    });
    creep = mockInstanceOf<Creep>(
        {
          name: 'creep1',
          id: 'c12345' as Id<Creep>,
          memory: {},
        },
        true);
    mockGlobal<Game>('Game', {
      rooms: {'N1W1': room},
      creeps: {'creep1': creep},
      time: 100,
    });
    Memory.missions = {};
  });

  it('should use max 1 worker', () => {
    // TODO: Should figure out a better way to test this
    const msn = new SingleHarvestMsn('harvest').init('N1W1', {
      sourceIdx: 0,
      pos: [5, 4],
    });
    msn.assignCreep(creep);

    msn.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
  });

  it.skip('should request a replacement when the first worker is old', () => {
    // TODO: Should figure out a better way to test this
    const msn = new SingleHarvestMsn('harvest').init('N1W1', {
      sourceIdx: 0,
      pos: [5, 4],
    });
    creep.ticksToLive = 30;  // Below age threshold
    msn.assignCreep(creep);

    msn.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep).toHaveBeenCalled();
  });

  it('should send creeps to harvest the Ith Source in the room', () => {
    const msn = new SingleHarvestMsn('harvest').init('N1W1', {
      sourceIdx: 0,
      pos: [5, 4],
    });
    msn.assignCreep(creep);

    msn.run();

    expect(creep.memory.mem.name).toBe('harvest');
    expect(creep.memory.mem.target.id).toBe(source.id);
  });

  it.skip('should send the replacement creep to relieve the worker', () => {
    const replacement =
        mockInstanceOf<Creep>({name: 'creep1', memory: {}}, true);
    const msn = new SingleHarvestMsn('harvest').init('N1W1', {
      sourceIdx: 0,
      pos: [5, 4],
    });
    msn.assignCreep(creep);
    msn.assignCreep(replacement);

    msn.run();

    expect(replacement.memory.mem.name).toBe('relieve');
    expect(replacement.memory.mem.target.id).toEqual(creep.id);
  });
});
