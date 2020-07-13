import HarvestMsn from './mining/harvest.msn';
import Mission from './mission';
import MockMission from './testing/mission.mock';

/**
 * Constructs a specific Mission Object from a type key and name.
 *
 * Expects the mission to already be initialized, so it can reuse existing
 * mission memory.
 */
export function constructMissionFromType(type: string, name: string): Mission|
    null {
  switch (type) {
    case MockMission.name:
      return new MockMission(name);
    case HarvestMsn.name:
      return new HarvestMsn(name);
    default:
      return null;  // No mission definition found for type
  }
}
