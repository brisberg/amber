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

  it('should send creeps to harvest the Ith Source in the room', () => {
    const source = mockInstanceOf<Source>({
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
    const creep = mockInstanceOf<Creep>({name: 'creep1', memory: {}}, true);
    // mockGlobal<{[name: string]: Room}>('Game.rooms', {'N1W1': room});
    mockGlobal<Game>('Game', {
      rooms: {'N1W1': room},
      creeps: {'creep1': creep},
      time: 100,
    });

    const msn = new SingleHarvestMsn('harvest').init('N1W1', {sourceIdx: 0});
    msn.assignCreep(creep);

    msn.run();

    expect(creep.memory.mem.name).toBe('harvest');
    expect(creep.memory.mem.target.id).toBe(source.id);
  });

  it.todo('should send the replacement creep to relieve the worker');
});
