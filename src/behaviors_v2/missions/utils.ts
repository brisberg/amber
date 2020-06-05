/**
 * Utility functions related to Missions.
 */
import Mission, {MissionMemory} from './mission';

/**
 * Fetch the missions memory from global Memory.
 *
 * Exported for testing only.
 *
 * @param msn Mission object
 */
export function getMemory<M>(msn: Mission<M>): MissionMemory<M> {
  return Memory.missions[msn.name];
}

/**
 * Saves the given MissionMemory into the given Mission.
 *
 * Exported for testing only.
 *
 * @param msn Mission object
 * @param mem New Memory
 */
export function setMemory<M>(msn: Mission<M>, mem: MissionMemory<M>): void {
  Memory.missions[msn.name] = mem;
}
