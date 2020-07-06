/**
 * General Purpose Energy Harvesting Mission
 *
 * Uses Source Analysis on the source to determine how many and what size
 * workers to request.
 * Attempts to position the largest one on the Primary
 * position.
 * Uses the room available energy capacity to decide which set of creep sizes to
 * use.
 * Performs "Drop Mining", registers Logistics Nodes on each working creep
 * based on their WORK parts.
 * Spawns new creeps when one is old.
 * New creeps will "Relieve" the oldest creep.
 */

import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {SpawnQueue} from 'spawn-system/spawnQueue';
import {setupGlobal} from 'v2/global';

import {mockSpawnQueueInstance} from '../testing/spawnQueue.mock';

import DropMineMsn, {DropMineMsnConfig} from './drop-mine.msn';

describe('Drop Mining Mission', () => {
  const MISSION_NAME = 'drop';
  const defaultConfig: DropMineMsnConfig = {
    sourceIdx: 0,
    positions: [[4, 5]],
  };

  let source: Source;
  let room: Room;
  let creep: Creep;
  let creep2: Creep;
  let spawnQueue: SpawnQueue;

  beforeEach(() => {
    // Set up Globals
    mockGlobal<Memory>(
        'Memory', {
          missions: {},
          operations: {},
        },
        true);
    setupGlobal();
    spawnQueue = mockSpawnQueueInstance();
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': spawnQueue,
    });
    source = mockInstanceOf<Source>({
      id: '12345' as Id<Source>,
      pos: new RoomPosition(5, 5, 'N1W1'),
    });
    room = mockInstanceOf<Room>({
      name: 'N1W1',
      find: (find: FindConstant) => {
        if (find === FIND_SOURCES) {
          return [source];
        } else {
          return [];
        }
      },
      energyCapacityAvailable: 550,  // RCL2
    });
    creep = mockInstanceOf<Creep>(
        {
          name: 'creep1',
          id: 'c12345' as Id<Creep>,
          pos: new RoomPosition(1, 1, 'N1W1'),
          memory: {},
        },
        true);
    creep2 = mockInstanceOf<Creep>({
      name: 'creep2',
      id: 'c2' as Id<Creep>,
      memory: {},
    });
    mockGlobal<Game>('Game', {
      rooms: {'N1W1': room},
      creeps: {
        [creep.name]: creep,
        [creep2.name]: creep2,
      },
      time: 100,
    });
  });

  describe('Spawning', () => {
    // const costPerTier = (100 * 2) + 50;  // 2xWORK 1xMove

    it.skip(
        'should request largest creep possible given spawn capacity', () => {
          room.energyCapacityAvailable = 550;  // RCL2
          const msn = new DropMineMsn(MISSION_NAME).init('N1W1', defaultConfig);

          msn.rollCall();

          expect(spawnQueue.requestCreep).toHaveBeenCalledWith({});
        });

    it('should request max number of creeps based on harvest positions', () => {
      const config: DropMineMsnConfig = {
        ...defaultConfig,
        positions: [[0, 0], [1, 1]],  // Two mining positions
      };
      const msn = new DropMineMsn(MISSION_NAME).init('N1W1', config);
      msn.assignCreep(creep);
      msn.assignCreep(creep);

      msn.rollCall();

      expect(spawnQueue.requestCreep).not.toHaveBeenCalled();
    });

    // Skip for now
    it.todo('should request smaller creep up to WORK part limit');

    // TODO: Push this into base Mission behavior
    it.skip('should request replacement creeps when one is too old', () => {
      const msn = new DropMineMsn(MISSION_NAME).init('N1W1', defaultConfig);
      creep.ticksToLive = 10;  // Nearly expired
      msn.assignCreep(creep);

      msn.rollCall();

      expect(spawnQueue.requestCreep).toHaveBeenCalled();
    });
  });

  describe('Running', () => {
    it(`should send each creep to 'drop harvest' the source`, () => {
      const msn = new DropMineMsn(MISSION_NAME).init('N1W1', defaultConfig);
      msn.assignCreep(creep);

      msn.run();

      expect(creep.memory.mem.name).toBe('harvest');
      expect(creep.memory.mem.target.id).toBe(source.id);
    });

    it(`should send each new creep to 'relieve' the oldest creep`, () => {
      const msn = new DropMineMsn(MISSION_NAME).init('N1W1', defaultConfig);
      msn.assignCreep(creep);
      msn.assignCreep(creep2);

      msn.run();

      expect(creep2.memory.mem.name).toBe('relieve');
      expect(creep2.memory.mem.target.id).toBe(creep.id);
    });

    // TODO: When we have logistics
    it.todo('should register a Logistic Node for each working creep');
  });
});
