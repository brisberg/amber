/** Utility functinos used with Operations */

import Operation, {OperationMemory} from './operation';

/**
 * Fetch the operation memory from global Memory.
 *
 * @param op Operation object
 */
export function getMemory<M>(op: Operation<M, unknown>): OperationMemory<M> {
  return Memory.operations[op.name];
}

/**
 * Saves the given OperationMemory into the given Operation.
 *
 * @param op Operation object
 * @param mem New Memory
 */
export function setMemory<M>(
    op: Operation<M, unknown>, mem: OperationMemory<M>): void {
  Memory.operations[op.name] = mem;
}

/**
 * Delete the operation memory from global Memory.
 *
 * @param op Operation object
 */
export function deleteMemory(op: Operation<unknown, unknown>): void {
  delete Memory.operations[op.name];
}


/**
 * Gets the list of Room Positions bordering the given RoomPosition
 */
export function getNeighbors(pos: RoomPosition): RoomPosition[] {
  const neighbors: RoomPosition[] = [];
  for (let x = pos.x - 1; x <= pos.x + 1; x++) {
    for (let y = pos.y - 1; y <= pos.y + 1; y++) {
      if (x === pos.x && y === pos.y) continue;

      if (x >= 0 && x < 50 && y >= 0 && y < 50) {
        neighbors.push(new RoomPosition(x, y, pos.roomName));
      }
    }
  }
  return neighbors;
}
