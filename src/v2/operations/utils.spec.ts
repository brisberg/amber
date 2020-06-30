import {getNeighbors} from './utils';

describe('getNeighbors', () => {
  it('should return all 8 neighboring positions', () => {
    const neighbors = getNeighbors(new RoomPosition(5, 5, 'W1N1'));

    expect(neighbors.length).toEqual(8);
    expect(neighbors).toMatchObject([
      {x: 4, y: 4, roomName: 'W1N1'},  // Top Left
      {x: 4, y: 5, roomName: 'W1N1'},  // Left
      {x: 4, y: 6, roomName: 'W1N1'},  // Bottom Left
      {x: 5, y: 4, roomName: 'W1N1'},  // Top
      {x: 5, y: 6, roomName: 'W1N1'},  // Bottom
      {x: 6, y: 4, roomName: 'W1N1'},  // Top Right
      {x: 6, y: 5, roomName: 'W1N1'},  // Right
      {x: 6, y: 6, roomName: 'W1N1'},  // Bottom Right
    ]);
  });

  it('should not return positions outside (0,0)', () => {
    const neighbors = getNeighbors(new RoomPosition(0, 0, 'W1N1'));

    expect(neighbors.length).toEqual(3);
    expect(neighbors).toMatchObject([
      {x: 0, y: 1, roomName: 'W1N1'},  // Bottom
      {x: 1, y: 0, roomName: 'W1N1'},  // Right
      {x: 1, y: 1, roomName: 'W1N1'},  // Bottom Right
    ]);
  });

  it('should not return positions outside (49,49)', () => {
    const neighbors = getNeighbors(new RoomPosition(49, 49, 'W1N1'));

    expect(neighbors.length).toEqual(3);
    expect(neighbors).toMatchObject([
      {x: 48, y: 48, roomName: 'W1N1'},  // Top Left
      {x: 48, y: 49, roomName: 'W1N1'},  // Left
      {x: 49, y: 48, roomName: 'W1N1'},  // Top
    ]);
  });
});
