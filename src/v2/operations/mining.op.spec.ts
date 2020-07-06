import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {setupGlobal} from 'v2/global';
import DropMineMsn from 'v2/missions/mining/drop-mine.msn';
import SingleHarvestMsn from 'v2/missions/mining/single-harvest';
import Mission from 'v2/missions/mission';
import MockMission from 'v2/missions/testing/mission.mock';
import {Registry} from 'v2/registry/registry';

import {getMemory as getMsnMemory} from '../missions/utils';

import MiningOperation, {MiningOperationConfig} from './mining.op';
import {analyzeSourceForHarvesting} from './sourceAnalysis';
import {getMemory} from './utils';

describe('Mining Operation', () => {
  const OPERATION_NAME = 'mining';
  let spawn: StructureSpawn;
  let source: Source;
  let room: Room;
  let msnRegistry: Registry<Mission>;
  const defaultConfig: MiningOperationConfig = {
    sourceIdx: 0,
    type: 'drop',
  };

  beforeEach(() => {
    mockGlobal<Memory>(
        'Memory', {
          operations: {},
          missions: {},
        },
        true);
    setupGlobal();
    source = mockInstanceOf<Source>({
      id: 'source1' as Id<Source>,
      pos: new RoomPosition(10, 10, 'N1W1'),
      room: undefined,
    });
    spawn = mockInstanceOf<StructureSpawn>({
      pos: new RoomPosition(5, 10, 'N1W1'),
    });
    room = mockInstanceOf<Room>({
      find: (find: FIND_SOURCES|FIND_MY_SPAWNS) => {
        switch (find) {
          case FIND_SOURCES:
            return [source];
          case FIND_MY_SPAWNS:
            return [spawn];
          default:
            return [];
        }
      },
      lookForAtArea: (): LookForAtAreaResultArray<Terrain, 'terrain'> => {
        return [
          {type: 'terrain', x: 0, y: 0, terrain: 'plain'},
          {type: 'terrain', x: 0, y: 0, terrain: 'plain'},
          {type: 'terrain', x: 0, y: 0, terrain: 'swamp'},
          {type: 'terrain', x: 0, y: 0, terrain: 'wall'},
        ];
      },
      findPath: (): PathStep[] => {
        return [
          {x: 5, y: 10, dx: 1, dy: 0, direction: RIGHT},
          {x: 6, y: 10, dx: 1, dy: 0, direction: RIGHT},
          {x: 7, y: 10, dx: 1, dy: 0, direction: RIGHT},
          {x: 8, y: 10, dx: 1, dy: 0, direction: RIGHT},
          {x: 9, y: 10, dx: 1, dy: 0, direction: RIGHT},   // Primary position
          {x: 10, y: 10, dx: 1, dy: 0, direction: RIGHT},  // Source location
        ];
      },
      energyCapacityAvailable: 300,
      createConstructionSite: jest.fn(),
    });
    source.room = room;
    mockGlobal<Game>('Game', {
      rooms: {
        'N1W1': room,
      },
    });
    msnRegistry = global.msnRegistry;
  });

  it('should perform Source Analysis on the source if needed', () => {
    const op = new MiningOperation(OPERATION_NAME).init('N1W1', defaultConfig);

    const expected = analyzeSourceForHarvesting(spawn.pos, source);
    expect(getMemory(op).data.analysis).toEqual(expected);
  });

  describe(`Type 'drop'`, () => {
    const dropConfig: MiningOperationConfig = {...defaultConfig, type: 'drop'};

    it('should start a DropMiningMsn with the source as a target', () => {
      const op = new MiningOperation(OPERATION_NAME).init('N1W1', dropConfig);

      op.run();

      const msn = msnRegistry.get(`${OPERATION_NAME}-drop`);
      expect(msn).toBeTruthy();
      if (msn) {
        const msnMem = getMsnMemory(msn);
        expect(msnMem.type).toBe(DropMineMsn.name);
        expect(msnMem.data.sourceIdx).toEqual(dropConfig.sourceIdx);
        const miningPositions = getMemory(op).data.analysis ?.positions;
        expect(msnMem.data.positions).toEqual(miningPositions);
      }
    });

    // Let the Harvest mission register with logistics
  });

  describe(`Type 'cont' (Container)`, () => {
    const contConfig: MiningOperationConfig = {...defaultConfig, type: 'cont'};

    it('should place a Container construction site at Primary location', () => {
      const op = new MiningOperation(OPERATION_NAME).init('N1W1', contConfig);

      op.run();

      expect(room.createConstructionSite)
          .toHaveBeenCalledWith(9, 10, STRUCTURE_CONTAINER);
    });

    describe('Container exists', () => {
      let container: StructureContainer;

      beforeEach(() => {
        container = mockInstanceOf<StructureContainer>({
          id: 'container1' as Id<StructureContainer>,
        });
        mockGlobal<Game>('Game', {
          rooms: {'N1W1': room},
          getObjectById: (id: Id<RoomObject>) => {
            switch (id) {
              case container.id:
                return container;
              default:
                return null;
            }
          },
        });
      });

      it.todo('should register a Logistics Node on the Container');

      it('should retire Drop Mining mission', () => {
        const dropMsn = new MockMission('drop');
        dropMsn.mockFinalizeFn = jest.fn();
        msnRegistry.register(dropMsn);
        const op = new MiningOperation(OPERATION_NAME).init('N1W1', contConfig);
        const mem = getMemory(op);
        mem.data.dropMsn = 'drop';
        mem.data.containerId = container.id;
        op.refresh();

        op.run();

        expect(dropMsn.mockFinalizeFn).toHaveBeenCalled();
      });

      it('should start a Container Mining Mission', () => {
        const op = new MiningOperation(OPERATION_NAME).init('N1W1', contConfig);
        const mem = getMemory(op);
        mem.data.containerId = container.id;
        op.refresh();

        op.run();

        const msn = msnRegistry.get(`${OPERATION_NAME}-cont`);
        expect(msn).toBeTruthy();
        if (msn) {
          const msnMem = getMsnMemory(msn);
          expect(msnMem.type).toBe(SingleHarvestMsn.name);
          expect(msnMem.data.sourceIdx).toEqual(contConfig.sourceIdx);
          // expect(msnMem.data.containerId).toEqual(contConfig.containerId);
        }
      });
    });

    describe('Container does not exist', () => {
      it.todo('should convert Container Mining Msn to Drop Mining Msn');
    });
  });

  describe.skip(`Type 'link'`, () => {
    // const linkConfig: MiningOperationConfig = {...defaultConfig, type:
    // 'link'};
    /**
     * If type = ‘link’, and there is no Link or Link Construction Site: creates
     * a Link Construction site at the link location.
     *
     * If type = ‘link’, and there is a Container: Destroy it?
     *
     * If the link exists, dissolve the Container Mining mission, Start a Link
     * Mining Mission.
     */
    return;
  });
});
