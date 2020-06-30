import {mockInstanceOf} from 'screeps-jest';
import {analyzeSourceForHarvesting} from './sourceAnalysis';

describe('Source Analysis', () => {
  let source: Source;
  let basePos: RoomPosition;

  beforeEach(() => {
    source = mockInstanceOf<Source>({
      id: 'source1' as Id<Source>,
      pos: {x: 30, y: 25, roomName: 'W1N1'},
      room: {
        lookForAtArea: jest.fn(() => []),
        findPath: jest.fn(() => [{x: 0, y: 0}, {x: 0, y: 0}]),
      },
    });
    basePos = new RoomPosition(25, 25, 'W1N1');
  });

  it('should calculate maxHarvesters by pathable cells around source', () => {
    source.room.lookForAtArea =
        (): LookForAtAreaResultArray<Terrain, 'terrain'> => {
          return [
            {type: 'terrain', x: 0, y: 0, terrain: 'plain'},
            {type: 'terrain', x: 0, y: 0, terrain: 'plain'},
            {type: 'terrain', x: 0, y: 0, terrain: 'swamp'},
            {type: 'terrain', x: 0, y: 0, terrain: 'wall'},
          ];
        };

    const analysis = analyzeSourceForHarvesting(basePos, source);

    expect(analysis.maxHarvesters).toEqual(3);  // 2 plains, 1 swamp
  });

  it('should calculate primary harvest position on path base->source', () => {
    source.room.findPath = (): PathStep[] =>
        [{x: 25, y: 25, dx: 1, dy: 0, direction: RIGHT},
         {x: 26, y: 25, dx: 1, dy: 0, direction: RIGHT},
         {x: 27, y: 25, dx: 1, dy: 0, direction: RIGHT},
         {x: 28, y: 25, dx: 1, dy: 0, direction: RIGHT},
         {x: 29, y: 25, dx: 1, dy: 0, direction: RIGHT},  // Primary position
         {x: 30, y: 25, dx: 1, dy: 0, direction: RIGHT},  // Source location
    ];

    const analysis = analyzeSourceForHarvesting(basePos, source);

    expect(analysis.positions[0]).toEqual([29, 25]);
  });

  it('should calculate secondary harvest positions next to primary', () => {
    source.room.findPath = (): PathStep[] =>
        [{x: 25, y: 25, dx: 4, dy: 0, direction: RIGHT},
         {x: 29, y: 25, dx: 1, dy: 0, direction: RIGHT},  // Primary position
         {x: 30, y: 25, dx: 1, dy: 0, direction: RIGHT},  // Source location
    ];
    source.room.lookForAtArea =
        (): LookForAtAreaResultArray<Terrain, 'terrain'> => {
          return [
            {type: 'terrain', x: 29, y: 24, terrain: 'plain'},
            {type: 'terrain', x: 29, y: 25, terrain: 'plain'},
            {type: 'terrain', x: 29, y: 26, terrain: 'swamp'},
          ];
        };

    const analysis = analyzeSourceForHarvesting(basePos, source);

    expect(analysis.positions[1]).toEqual([29, 24]);
    expect(analysis.positions[2]).toEqual([29, 26]);
  });
});
