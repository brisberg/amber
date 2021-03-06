import {IDLER, Idler} from 'behaviors/idler';

/** Subsystem for storing and reassigning orphaned creeps */

interface OrphanRecord {
  creepName: string;
  bodyType: string;
}

/**
 * OrphanList keeps track of all orphaned creeps by body type and returns one
 * for reassignment if requested.
 */
export class OrphanList {
  private orphansByType: {[bodyType: string]: OrphanRecord} = {};
}

/** Utility function which will declare a creep Orphaned */
export function declareOrphan(creep: Creep): void {
  const mem = Memory.creeps[creep.name];
  delete mem.mission;
  mem.behavior = IDLER;
  mem.mem = Idler.initMemory();
}

/** Returns true if the creep is an Orphan */
export function isOrphan(creep: Creep): boolean {
  return creep.memory.mission === null || creep.memory.mission === undefined;
}
