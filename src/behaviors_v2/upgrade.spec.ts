import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import UpgradeBehavior from './upgrade';

const upgrade = new UpgradeBehavior();

describe('Upgrade behavior', () => {
  let cont: StructureController;
  let creep: Creep;
  let body: {[part: string]: number};

  beforeEach(() => {
    cont = mockInstanceOf<StructureController>({
      id: 'controller' as Id<StructureController>,
      my: true,
      pos: new RoomPosition(5, 10, 'N1W1'),
      upgradeBlocked: 0,
    });
    creep = mockInstanceOf<Creep>({
      upgradeController: () => OK,
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
          case 'controller':
            return cont;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = upgrade.new(cont);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('upgrade');
    expect(mem.target).toEqual({
      id: 'controller',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without enough work parts', () => {
    body[WORK] = 0;

    expect(upgrade.isValid(creep)).toBe(false);
  });

  it('should be invalid for creeps without enough carry parts', () => {
    body[CARRY] = 0;

    expect(upgrade.isValid(creep)).toBe(false);
  });

  it('should be invalid for missing controller', () => {
    Game.getObjectById = (): null => null;

    expect(upgrade.isValid(creep)).toBe(false);
  });

  it('should be invalid for controller not claimed by player', () => {
    cont.my = false;

    expect(upgrade.isValid(creep)).toBe(false);
  });

  it(`should be invalid for 'upgrade blocked' controllers`, () => {
    cont.upgradeBlocked = 100;

    expect(upgrade.isValid(creep)).toBe(false);
  });

  it('should be valid for unblocked, owned controllers and workers', () => {
    body = {
      [WORK]: 1,
      [CARRY]: 1,
    };
    cont.my = true, cont.upgradeBlocked = 0;

    expect(upgrade.isValid(creep)).toBe(true);
  });

  it('should not upgrade if creep has no energy', () => {
    creep.pos.inRangeTo = (): boolean => true;
    creep.store.energy = 0;

    const result = upgrade.run(creep);

    expect(creep.upgradeController).not.toHaveBeenCalled();
    expect(result).toBe(ERR_NOT_ENOUGH_ENERGY);
  });

  it('should call upgrade on a valid controller in range with energy', () => {
    creep.pos.inRangeTo = (): boolean => true;
    creep.store.energy = 50;
    cont.my = true;
    cont.upgradeBlocked = 0;

    const result = upgrade.run(creep);

    expect(creep.upgradeController).toHaveBeenCalledWith(cont);
    expect(result).toBe(OK);
  });
});
