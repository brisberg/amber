import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import DropMiningBehavior from './drop-mining';

const dropMining = new DropMiningBehavior();

describe('DropMining behavior', () => {
  let source: Source;
  let creep: Creep;

  beforeEach(() => {
    source = mockInstanceOf<Source>({
      id: 'source' as Id<Source>,
      pos: new RoomPosition(5, 10, 'N1W1'),
      energy: 3000,
    });
    creep = mockInstanceOf<Creep>({
      harvest: () => OK,
      getActiveBodyparts: (part: BodyPartConstant) => part === WORK ? 6 : 0,
      pos: {},
      memory: {},
    });
    mockGlobal<Game>('Game', {
      time: 100,
      getObjectById: (id: string) => {
        switch (id) {
          case 'source':
            return source;
          default:
            return null;
        }
      },
    });
  });

  beforeEach(() => {
    creep.memory.mem = dropMining.new(source);
  });

  it('should set up creep memory with name and target', () => {
    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('dropMining');
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

    expect(dropMining.isValid(creep)).toBe(false);
  });

  it('should be invalid for exhausted sources', () => {
    source.energy = 0;

    expect(dropMining.isValid(creep)).toBe(false);
  });

  it('should be valid for active sources and worker creeps', () => {
    source.energy = 3000;
    creep.getActiveBodyparts = (part: BodyPartConstant): number => {
      return part === WORK ? 6 : 0;
    };

    expect(dropMining.isValid(creep)).toBe(true);
  });

  it('should call harvest on a valid source if in range', () => {
    creep.pos.inRangeTo = (): boolean => true;

    dropMining.run(creep);

    expect(creep.harvest).toHaveBeenCalledWith(source);
  });
});
