import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import FetchBehavior, {StorageStructure} from './fetch';

const fetch = new FetchBehavior();

describe('Fetch behavior', () => {
  let store: StorageStructure;
  let creep: Creep;
  let body: {[part: string]: number};

  beforeEach(() => {
    store = mockInstanceOf<StructureContainer>({
      id: 'store' as Id<StructureContainer>,
      pos: new RoomPosition(5, 10, 'N1W1'),
      store: {
        energy: 1000,
      },
      storeCapacity: 2000,
    });
    creep = mockInstanceOf<Creep>({
      withdraw: () => OK,
      getActiveBodyparts: (part: BodyPartConstant) => {
        return body[part] || 0;
      },
      store: {},
      pos: {},
      memory: {},
    });
    body = {[CARRY]: 1};
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'store':
            return store;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = fetch.new(store);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('fetch');
    expect(mem.target).toEqual({
      id: 'store',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without enough carry parts', () => {
    body[CARRY] = 0;

    expect(fetch.isValid(creep)).toBe(false);
  });

  it('should be invalid for missing target storage structure', () => {
    Game.getObjectById = (): null => null;

    expect(fetch.isValid(creep)).toBe(false);
  });

  it('should be valid for active storage structure and carry creeps', () => {
    body = {[CARRY]: 1};

    expect(fetch.isValid(creep)).toBe(true);
  });

  it('should call withdraw on a valid store if in range with energy', () => {
    creep.pos.inRangeTo = (): boolean => true;

    const result = fetch.run(creep);

    expect(creep.withdraw).toHaveBeenCalledWith(store, RESOURCE_ENERGY);
    expect(result).toBe(OK);
  });
});
