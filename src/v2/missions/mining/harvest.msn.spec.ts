/**
 * General Purpose Energy Harvesting Mission
 *
 * - Uses Source Analysis on the source to determine how many and what size
 * workers to request. (TODO: Store this on the source?)
 * - Attempts to position the first harvester on the Primary position.
 * - Uses the room available energy capacity to decide which set of creep sizes
 * to use. (For now, hardcoded for Official energy costs).
 * - Performs "Drop Mining", or "Structure Mining" if structure exists.
 * - Does not interact with the logistics system.
 * - Spawns new creeps when one is old. New creeps will "Relieve" the
 * oldest creep.
 */

import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue, SpawnRequest} from 'spawn-system/spawnQueue';
import {setupGlobal} from 'v2/global';

import {mockSpawnQueueInstance} from '../testing/spawnQueue.mock';
import {getMemory} from '../utils';

import HarvestMsn, {HarvestMsnConfig} from './harvest.msn';

describe('Harvest Mission', () => {
  const MISSION_NAME = 'harvest';
  const defaultConfig: HarvestMsnConfig = {
    sourceIdx: 0,
    positions: [[4, 5], [3, 5], [2, 5]],
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
      energyCapacityAvailable: 300,  // RCL1
    });
    creep = mockInstanceOf<Creep>(
        {
          name: 'creep1',
          id: 'c12345' as Id<Creep>,
          pos: {
            x: 1,
            y: 1,
            roomName: 'N1W1',
            isEqualTo: (): boolean => false,
          },
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
    it('should limit max number of creeps based on harvest positions', () => {
      const config: HarvestMsnConfig = {
        ...defaultConfig,
        positions: [[0, 0], [1, 1]],  // Two mining positions
      };
      const msn = new HarvestMsn(MISSION_NAME).init('N1W1', config);
      msn.assignCreep(creep);
      msn.assignCreep(creep);

      msn.rollCall();

      expect(spawnQueue.requestCreep).not.toHaveBeenCalled();
    });

    describe('RCL1', () => {
      beforeEach(() => {
        room.energyCapacityAvailable = 300;
      });

      it('should request small creeps', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);

        msn.rollCall();

        expect(spawnQueue.requestCreep)
            .toHaveBeenCalledWith(
                expect.objectContaining<Partial<SpawnRequest>>({
                  bodyRatio: WORKER,
                  bodyOptions: {max: {work: 2}},
                }));
      });

      it('should request up to 3 creeps', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);
        msn.assignCreep(creep);
        msn.assignCreep(creep);
        msn.assignCreep(creep);

        msn.rollCall();

        expect(spawnQueue.requestCreep).not.toHaveBeenCalled();
      });
    });

    describe('RCL2', () => {
      beforeEach(() => {
        room.energyCapacityAvailable = 550;
      });

      it('should request medium creeps', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);

        msn.rollCall();

        // TODO: Limit this to 3 work
        expect(spawnQueue.requestCreep)
            .toHaveBeenCalledWith(
                expect.objectContaining<Partial<SpawnRequest>>({
                  bodyRatio: WORKER,
                  bodyOptions: {max: {work: 4}},
                }));
      });

      it('should request up to 2 creeps', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);
        msn.assignCreep(creep);
        msn.assignCreep(creep);

        msn.rollCall();

        expect(spawnQueue.requestCreep).not.toHaveBeenCalled();
      });
    });

    describe('RCL3', () => {
      beforeEach(() => {
        room.energyCapacityAvailable = 800;
      });

      it('should request large creeps', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);

        msn.rollCall();

        expect(spawnQueue.requestCreep)
            .toHaveBeenCalledWith(
                expect.objectContaining<Partial<SpawnRequest>>({
                  bodyRatio: WORKER,
                  bodyOptions: {max: {work: 6}},
                }));
      });

      it('should request up to 1 creep', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);
        msn.assignCreep(creep);

        msn.rollCall();

        expect(spawnQueue.requestCreep).not.toHaveBeenCalled();
      });
    });

    // TODO: Push this into base Mission behavior
    it('should request replacement creeps when one is too old', () => {
      const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);
      creep.ticksToLive = 10;  // Nearly expired
      msn.assignCreep(creep);

      msn.rollCall();

      expect(spawnQueue.requestCreep).toHaveBeenCalled();
    });
  });

  describe('Running', () => {
    describe('without Container', () => {
      it(`should send each creep to 'drop harvest' the source`, () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', defaultConfig);
        msn.assignCreep(creep);

        msn.run();

        expect(creep.memory.mem.name).toBe('harvest');
        expect(creep.memory.mem.target.id).toBe(source.id);
      });
    });

    describe('with Container', () => {
      let container: StructureContainer;
      let config: HarvestMsnConfig;

      beforeEach(() => {
        container = mockInstanceOf<StructureContainer>({
          id: 'container1' as Id<StructureContainer>,
          pos: new RoomPosition(4, 5, 'N1W1'),
        });
        Game.getObjectById = (id: string) => {
          switch (id) {
            case 'container1':
              return container;
            default:
              return null;
          }
        };
        config = {...defaultConfig, containerId: container.id};
      });

      it(`should assign each creep to 'container harvest' the source`, () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', config);
        msn.assignCreep(creep);

        msn.run();

        expect(creep.memory.mem.name).toBe('c-harvest');
        expect(creep.memory.mem.target.id).toBe(source.id);
        expect(creep.memory.mem.data.containerId).toEqual(container.id);
      });

      it(`should assign the creep directly over the container to normal
'harvest' the source`,
         () => {
           const msn = new HarvestMsn(MISSION_NAME).init('N1W1', config);
           creep.pos.isEqualTo = (): boolean => true;
           msn.assignCreep(creep);

           msn.run();

           expect(creep.memory.mem.name).toBe('harvest');
           expect(creep.memory.mem.target.id).toBe(source.id);
         });

      it('should forget containerId if structure is removed', () => {
        const msn = new HarvestMsn(MISSION_NAME).init('N1W1', config);
        Game.getObjectById = (): null => null;

        msn.refresh();

        expect(getMemory(msn).data.containerId).toBeUndefined();
      });
    });

    it(`should send each new creep to 'relieve' the oldest creep`, () => {
      const config: HarvestMsnConfig = {...defaultConfig, positions: [[1, 1]]};
      const msn = new HarvestMsn(MISSION_NAME).init('N1W1', config);
      msn.assignCreep(creep);
      msn.assignCreep(creep2);

      msn.run();

      expect(creep2.memory.mem.name).toBe('relieve');
      expect(creep2.memory.mem.target.id).toBe(creep.id);
    });
  });
});
