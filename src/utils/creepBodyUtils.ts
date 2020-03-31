/**
 * Package contains utility functions for creating and working with Creep bodies
 */

/**
 * General Purpose utility to create a Creep Body definition with the given
 * part counts.
 */
export function createCreepBody(
    work: number, carry: number, move: number, attack: number, heal: number,
    tough: number, claim: number): BodyPartConstant[] {
  const workParts = Array<BodyPartConstant>(work).fill(WORK);
  const carryParts = Array<BodyPartConstant>(carry).fill(CARRY);
  const moveParts = Array<BodyPartConstant>(move).fill(MOVE);
  const attackParts = Array<BodyPartConstant>(attack).fill(ATTACK);
  const healParts = Array<BodyPartConstant>(heal).fill(HEAL);
  const toughParts = Array<BodyPartConstant>(tough).fill(TOUGH);
  const claimParts = Array<BodyPartConstant>(claim).fill(CLAIM);

  return toughParts.concat(
      workParts,
      claimParts,
      attackParts,
      healParts,
      carryParts,
      moveParts,
  );
}

/**
 * Convenience function for createing a Worker Creep Body definition (a creep
 * with only work, carry, or move parts)
 */
export function createWorkerBody(
    work: number, carry: number, move: number): BodyPartConstant[] {
  return createCreepBody(work, carry, move, 0, 0, 0, 0);
}

/** Utility to return the total cost of a creep Body */
export function totalCost(body: BodyPartConstant[]): number {
  return body.reduce((total, part) => {
    return total + BODYPART_COST[part];
  }, 0);
}
