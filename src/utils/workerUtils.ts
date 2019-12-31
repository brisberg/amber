/**
 * Package contains utility functions for creating and working with Worker
 * (non-combat) screeps
 */

export function createWorkerBody(work: number, carry: number, move: number) {
  const body: BodyPartConstant[] = [];

  for (let i = 0; i < work; i++) {
    body.push(WORK);
  }
  for (let i = 0; i < carry; i++) {
    body.push(CARRY);
  }
  for (let i = 0; i < move; i++) {
    body.push(MOVE);
  }

  return body;
}
