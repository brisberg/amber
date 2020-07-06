import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import CHarvestBehavior from './c-harvest';

const charvest = new CHarvestBehavior();

describe('Harvest behavior', () => {
  let source: Source;
  let container: StructureContainer;
  let creep: Creep;

  beforeEach(() => {
    source = mockInstanceOf<Source>({
      id: 'source' as Id<Source>,
      pos: new RoomPosition(5, 10, 'N1W1'),
      energy: 3000,
    });
    container = mockInstanceOf<StructureContainer>({
      id: 'container1' as Id<StructureContainer>,
      store: {
        energy: 0,
        getFreeCapacity: jest.fn(),
      },
    });
    creep = mockInstanceOf<Creep>({
      harvest: () => OK,
      transfer: () => OK,
      getActiveBodyparts: (part: BodyPartConstant) => part === WORK ? 6 : 0,
      pos: {},
      memory: {},
      store: {energy: 50, getFreeCapacity: jest.fn()},
    });
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case source.id:
            return source;
          case container.id:
            return container;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = charvest.new(source, {}, {containerId: container.id});
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('c-harvest');
    expect(mem.target).toEqual({
      id: 'source',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without enough work parts', () => {
    creep.getActiveBodyparts = (): number => 0;

    expect(charvest.isValid(creep)).toBe(false);
  });

  it('should be invalid for exhausted sources', () => {
    source.energy = 0;

    expect(charvest.isValid(creep)).toBe(false);
  });

  it('should be valid for active sources and worker creeps', () => {
    source.energy = 3000;
    creep.getActiveBodyparts = (part: BodyPartConstant): number => {
      return part === WORK ? 6 : 0;
    };

    expect(charvest.isValid(creep)).toBe(true);
  });

  it('should call harvest on a valid source if in range', () => {
    creep.pos.inRangeTo = (): boolean => true;

    charvest.run(creep);

    expect(creep.harvest).toHaveBeenCalledWith(source);
  });

  it('should transfer to container if creep is full', () => {
    creep.pos.inRangeTo = (): boolean => true;
    // TODO: Fix this madness
    container.store.getFreeCapacity = <R>() => 1000 as R extends undefined ?
        number :
        R extends ResourceConstant ? number : null;
    creep.store.getFreeCapacity = <R>() => 0 as R extends undefined ?
        number :
        R extends ResourceConstant ? number : null;
    creep.getActiveBodyparts = (part: BodyPartConstant): number => {
      return part === WORK ? 5 : 0;
    };
    creep.store.energy = 50;

    charvest.run(creep);

    expect(creep.transfer).toHaveBeenCalledWith(container, RESOURCE_ENERGY, 50);
  });
});
