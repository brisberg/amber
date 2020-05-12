import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import BuildBehavior from './build';

const build = new BuildBehavior();

describe('Build behavior', () => {
  let site: ConstructionSite;
  let creep: Creep;
  let body: {[part: string]: number};

  beforeEach(() => {
    site = mockInstanceOf<ConstructionSite>({
      id: 'site' as Id<ConstructionSite>,
      pos: new RoomPosition(5, 10, 'N1W1'),
    });
    creep = mockInstanceOf<Creep>({
      build: () => OK,
      getActiveBodyparts: (part: BodyPartConstant) => {
        return body[part] || 0;
      },
      store: {
        energy: 50,
      },
      pos: {},
      memory: {},
    });
    body = {
      [WORK]: 1,
      [CARRY]: 1,
    };
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'site':
            return site;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = build.new(site);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('build');
    expect(mem.target).toEqual({
      id: 'site',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without enough work parts', () => {
    body[WORK] = 0;

    expect(build.isValid(creep)).toBe(false);
  });

  it('should be invalid for creeps without enough carry parts', () => {
    body[CARRY] = 0;

    expect(build.isValid(creep)).toBe(false);
  });

  it('should be invalid for missing construction sites', () => {
    Game.getObjectById = (): null => null;

    expect(build.isValid(creep)).toBe(false);
  });

  it('should be valid for active construction sites and worker creeps', () => {
    body = {
      [WORK]: 1,
      [CARRY]: 1,
    };

    expect(build.isValid(creep)).toBe(true);
  });

  it('should not build if creep has no energy', () => {
    creep.pos.inRangeTo = (): boolean => true;
    creep.store.energy = 0;

    const result = build.run(creep);

    expect(creep.build).not.toHaveBeenCalled();
    expect(result).toBe(ERR_NOT_ENOUGH_ENERGY);
  });

  it('should call build on a valid site if in range with energy', () => {
    creep.pos.inRangeTo = (): boolean => true;

    const result = build.run(creep);

    expect(creep.build).toHaveBeenCalledWith(site);
    expect(result).toBe(OK);
  });
});
