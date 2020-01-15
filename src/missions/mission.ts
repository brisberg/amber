/**
 * Abstract Mission class from which all others derive.
 *
 * Missions in general are meant to organize a group of a single type of creeps
 * (note: behaviors only control one creep) to accomplish a very specific task.
 *
 * NOTE: Single type of creep may be changed in the future.
 *
 * This task could be to Harvest from a specific Source, Upgrade a single
 * Controller, transport goods between two distinct points.
 *
 * Missions should all be represented by a Flag. This means they can be
 * regenerated from scratch if necessary.
 *
 * Missions may be permanent or ephemeral. They all have several stages:
 *
 * Init() - This phase we validate our Memory aginst the world. Check to see
 * that Energy Node flags actually exist, the Harvest Container exists, etc. If
 * something is missing, we should retire ourselves (freeing up our assigned
 * Creeps). Leave it to who ever spawned this mission to fix what is missing and
 * restart the mission.
 */
export abstract class Mission<M> {
  public readonly name: string;
  public readonly room: Room|null = null;

  private readonly creeps: Creep[] = [];
  private readonly mem: M;
}
