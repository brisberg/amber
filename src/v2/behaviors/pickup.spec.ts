import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import PickupBehavior from './pickup';

const pickup = new PickupBehavior();

describe('Pickup behavior', () => {
  let resource: Resource<RESOURCE_ENERGY>;
  let creep: Creep;
  let body: {[part: string]: number};

  beforeEach(() => {
    resource = mockInstanceOf<Resource<RESOURCE_ENERGY>>({
      id: 'res' as Id<Resource<RESOURCE_ENERGY>>,
      pos: new RoomPosition(5, 10, 'N1W1'),
      amount: 200,
      resourceType: RESOURCE_ENERGY,
    });
    creep = mockInstanceOf<Creep>({
      pickup: () => OK,
      getActiveBodyparts: (part: BodyPartConstant) => {
        return body[part] || 0;
      },
      pos: {},
      memory: {},
    });
    body = {[CARRY]: 1};
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'res':
            return resource;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = pickup.new(resource);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('pickup');
    expect(mem.target).toEqual({
      id: 'res',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without enough carry parts', () => {
    body[CARRY] = 0;

    expect(pickup.isValid(creep)).toBe(false);
  });

  it('should be invalid for missing target resource pile', () => {
    Game.getObjectById = (): null => null;

    expect(pickup.isValid(creep)).toBe(false);
  });

  it('should be valid for resource pile and carry creeps', () => {
    body = {[CARRY]: 1};

    expect(pickup.isValid(creep)).toBe(true);
  });

  it('should call pickup on a valid resource pile in range', () => {
    creep.pos.inRangeTo = (): boolean => true;

    const result = pickup.run(creep);

    expect(creep.pickup).toHaveBeenCalledWith(resource);
    expect(result).toBe(OK);
  });
});
