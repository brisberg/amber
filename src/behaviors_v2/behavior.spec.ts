import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {Behavior, getBehaviorMemory, setCreepBehavior} from './behavior';
import {BehaviorSettings} from './types';

let validTask: boolean;
let validTarget: boolean;
const work = jest.fn((): number => OK);

class MockBehavior extends Behavior {
  protected name = 'mock';
  protected settings: BehaviorSettings = {
    timeout: Infinity,
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
      memory: {mem: {target: {id: '', pos: {x: 0, y: 0}}}},
      // pos: new RoomPosition(5, 12, 'N1W1'),
      pos: {
        x: 5,
        y: 12,
        roomName: 'N1W1',
        inRangeTo: (): boolean => true,
      },
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

  it('should call work if target is within range', () => {
    // Range = 2
    // creep.pos = new RoomPosition(5, 12, 'N1W1');
    creep.pos.inRangeTo = (): boolean => true;
    target.pos = new RoomPosition(5, 10, 'N1W1');

    mockBehavior.run(creep);

    expect(work).toHaveBeenCalled();
  });

  it('should move towards target if not within range', () => {
    // Range = 2
    // creep.pos = new RoomPosition(5, 13, 'N1W1');
    creep.pos.x = 5;
    creep.pos.y = 13;
    creep.pos.inRangeTo = (): boolean => false;
    target.pos = new RoomPosition(5, 10, 'N1W1');

    mockBehavior.run(creep);

    expect(creep.moveTo).toHaveBeenCalledWith(5, 10, {range: 1});
    expect(work).not.toHaveBeenCalled();
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
