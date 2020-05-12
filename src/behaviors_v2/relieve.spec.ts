import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import RelieveBehavior from './relieve';

const relieve = new RelieveBehavior();

describe('Relieve behavior', () => {
  let creep: Creep;
  let target: Creep;

  beforeEach(() => {
    creep = mockInstanceOf<Creep>({
      id: 'creep' as Id<Creep>,
      fatigue: 0,
      getActiveBodyparts: (part: BodyPartConstant) => part === MOVE ? 1 : 0,
      pos: {},
      memory: {},
      move: () => OK,
    });
    target = mockInstanceOf<Creep>({
      id: 'target' as Id<Creep>,
      pos: new RoomPosition(5, 5, 'N1W1'),
      suicide: () => OK,
    });
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'creep':
            return creep;
          case 'target':
            return target;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = relieve.new(target);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('relieve');
    expect(mem.target).toEqual({
      id: 'target',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 5,
      },
    });
  });

  it('should be invalid for creeps without move parts', () => {
    creep.getActiveBodyparts = (): number => 0;

    expect(relieve.isValid(creep)).toBe(false);
  });

  it('should be invalid for if target creep does not exist', () => {
    Game.getObjectById = (): Creep|null => null;

    expect(relieve.isValid(creep)).toBe(false);
  });

  it('should be valid for movable creeps and targets', () => {
    expect(target).toBeTruthy();
    creep.getActiveBodyparts = (part: BodyPartConstant): number => {
      return part === MOVE ? 1 : 0;
    };

    expect(relieve.isValid(creep)).toBe(true);
  });

  it('should do nothing if the creep is fatigued', () => {
    creep.pos.inRangeTo = (): boolean => true;
    creep.fatigue = 1;

    relieve.run(creep);

    expect(target.suicide).not.toHaveBeenCalled();
  });

  it('should suicide the target and step into it\'s place', () => {
    creep.pos.inRangeTo = (): boolean => true;
    creep.pos.getDirectionTo = (): DirectionConstant => RIGHT;

    relieve.run(creep);

    expect(target.suicide).toHaveBeenCalled();
    expect(creep.move).toHaveBeenCalledWith(RIGHT);
  });
});
