/**
 * Utility functions related to Missions.
 */
import Mission, {MissionMemory} from './mission';

/**
 * Fetch the missions memory from global Memory.
 *
 * @param msn Mission object
 */
export function getMemory<M>(msn: Mission<M>): MissionMemory<M> {
  return Memory.missions[msn.name];
}

/**
 * Saves the given MissionMemory into the given Mission.
 *
 * @param msn Mission object
 * @param mem New Memory
 */
export function setMemory<M>(msn: Mission<M>, mem: MissionMemory<M>): void {
  Memory.missions[msn.name] = mem;
}

/**
 * Delete the missions memory from global Memory.
 *
 * @param msn Mission object
 */
export function deleteMemory(msn: Mission<{}>): void {
  delete Memory.missions[msn.name];
}
