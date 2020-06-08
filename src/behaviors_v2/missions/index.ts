import Mission from './mission';
import MockMission from './testing/mission-mock';

/**
 * Constructs a specific Mission from a given flag.
 *
 * Expects the mission to already be initialized, so it can reuse existing
 * mission memory.
 */
export function constructMissionFromFlag(flag: Flag): Mission|null {
  if (flag.color === COLOR_BROWN && flag.secondaryColor === COLOR_BROWN) {
    return new MockMission(flag.name);
  }

  return null;  // No mission definition found for flag
}
