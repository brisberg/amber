/**
 * Represents the queue of creeps to be build by a given spawner.
 *
 * For now this is a barebones implementation, we will need to expand on it to
 * incorporate specific activities/operations later. For now it will manage all
 * of the spawning for a single spawner.
 */

type ScreepTypes = 'miner'|'builder'|'transporter'|'upgrader';

class SpawnQueue {
  private maxMiners = 2;
  private maxTransporters = 2;
  private maxBuilders = 1;
  private maxUpgraders = 2;

  private queue: string[]
}
