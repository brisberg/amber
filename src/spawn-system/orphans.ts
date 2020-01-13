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
export function declareOrphan(creep: Creep) {
  const mem = Memory.creeps[creep.name];
  delete mem.mission;
  mem.behavior = IDLER;
  mem.mem = Idler.initMemory();
}
