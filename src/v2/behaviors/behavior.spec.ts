import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {BehaviorSettings} from '../types';

import {Behavior, getBehaviorMemory, setCreepBehavior} from './behavior';

// Mock Variables
let validTask: boolean;
let validTarget: boolean;
const work = jest.fn((): number => OK);

class MockBehavior extends Behavior {
  protected name = 'mock';
  protected settings: BehaviorSettings = {
    timeout: 100,
    range: 1,
    blind: false,
  };

  protected isValidTask(): boolean {
    return validTask;
  }
  protected isValidTarget(): boolean {
    return validTarget;
  }
  protected work(): number {
    return work();
  }
}

const mockBehavior = new MockBehavior();

describe('Abstract Behavior', () => {
  let creep: Creep;
  let target: RoomObject&{id: string};

  beforeEach(() => {
    validTask = true;
    validTarget = true;
    work.mockReset();

    creep = mockInstanceOf<Creep>({
      id: 'creep' as Id<Creep>,
      memory: {},
      pos: new RoomPosition(5, 12, 'N1W1'),
      moveTo: (): void => {
        return;
      },
    });
    target = mockInstanceOf<RoomObject&{id: string}>({
      id: 'target',
      memory: {},
      pos: new RoomPosition(5, 10, 'N1W1'),
    });
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'target':
            return target;
          default:
            return null;
        }
      },
    });
  });

  it('should produce a new memory object', () => {
    const mem = mockBehavior.new(target);

    expect(mem).toEqual({
      data: {},
      name: 'mock',
      options: {},
      target: {
        id: 'target',
        pos: {
          room: 'N1W1',
          x: 5,
          y: 10,
        },
      },
      tick: 100,
    });
  });

  it('should save supplied options to memory object', () => {
    const mem = mockBehavior.new(target, {blind: true}, {foo: 'bar'});

    expect(mem.options).toEqual({blind: true});
    expect(mem.data).toEqual({foo: 'bar'});
  });

  it('should override target position from data', () => {
    const mem = mockBehavior.new(target, {}, {
      overridePos: new RoomPosition(4, 4, 'W0N0'),
    });

    expect(mem.target.pos).toEqual({x: 4, y: 4, room: 'W0N0'});
  });

  it('should be valid iff both the task and target are valid', () => {
    setCreepBehavior(creep, mockBehavior.new(target));

    // Both invalid
    validTask = false;
    validTarget = false;

    expect(mockBehavior.isValid(creep)).toEqual(false);

    // Task invalid
    validTask = false;
    validTarget = true;

    expect(mockBehavior.isValid(creep)).toEqual(false);

    // Target invalid
    validTask = true;
    validTarget = false;

    expect(mockBehavior.isValid(creep)).toEqual(false);

    // Both valid
    validTask = true;
    validTarget = true;

    expect(mockBehavior.isValid(creep)).toEqual(true);
  });

  it('should be invalid if the task has timedout', () => {
    setCreepBehavior(creep, mockBehavior.new(target));
    Game.time = 201;  // 100 (base) + 101 (timeout)

    expect(mockBehavior.isValid(creep)).toEqual(false);
  });

  it('should move towards target if not within range', () => {
    setCreepBehavior(creep, mockBehavior.new(target));
    creep.pos.inRangeTo = (): boolean => false;

    mockBehavior.run(creep);

    expect(creep.moveTo).toHaveBeenCalledWith(5, 10, {range: 1});
    expect(work).not.toHaveBeenCalled();
  });

  it('should call work if target is within range', () => {
    setCreepBehavior(creep, mockBehavior.new(target));
    creep.pos.inRangeTo = (): boolean => true;

    mockBehavior.run(creep);

    expect(work).toHaveBeenCalled();
  });

  it('should return the response code of work()', () => {
    setCreepBehavior(creep, mockBehavior.new(target));
    creep.pos.inRangeTo = (): boolean => true;
    work.mockReturnValue(ERR_BUSY);

    const result = mockBehavior.run(creep);

    expect(result).toBe(ERR_BUSY);
  });
});

describe('Behavior helpers', () => {
  let creep: Creep;

  beforeEach(() => {
    creep = mockInstanceOf<Creep>({
      memory: {},
    });
  });

  it('setCreepBehavior', () => {
    const mockMem = {};

    setCreepBehavior(creep, mockMem);

    expect(creep.memory.mem).toBe(mockMem);
  });

  it('getBehaviorMemory', () => {
    const mockMem = {};
    setCreepBehavior(creep, mockMem);

    const result = getBehaviorMemory(creep);

    expect(result).toBe(mockMem);
  });
});
