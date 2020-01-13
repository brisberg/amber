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
