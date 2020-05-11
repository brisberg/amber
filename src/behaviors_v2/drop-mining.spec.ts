import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {getBehaviorMemory} from './behavior';
import DropMiningBehavior from './drop-mining';

const dropMining = new DropMiningBehavior();
const source1 = mockInstanceOf<Source>({
  id: 'source1' as Id<Source>,
  pos: new RoomPosition(5, 10, 'N1W1'),
});
mockGlobal<Game>('Game', {
  time: 100,
});


describe('DropMining behavior', () => {
  it('should set up creep memory with name and target', () => {
    const creep = mockInstanceOf<Creep>({
      harvest: () => OK,
      memory: {},
    });

    creep.memory.mem = dropMining.new(source1);

    const mem = getBehaviorMemory(creep);
    expect(mem.name).toBe('dropMining');
    expect(mem.target).toEqual({
      id: 'source1',
      pos: {
        room: 'N1W1',
        x: 5,
        y: 10,
      },
    });
  });

  it('should be invalid for creeps without work parts', () => {

  }
});
