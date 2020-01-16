// tslint:disable-next-line: max-line-length
import {BUILD_TARGET_FLAG, flagIsColor, HARVEST_SOURCE_FLAG, SOURCE_BUILD_TARGET_FLAG, TRANSPORT_MISSION_FLAG, UPGRADE_MISSION_FLAG} from 'flagConstants';

import {BuildMission} from './build';
import {HarvestingMission} from './harvesting';
import {Mission} from './mission';
import {TransportMission} from './transport';
import {UpgradeMission} from './upgrade';

export type MissionMap = (flag: Flag) => Mission<any>|null;

/** Convenience mapping of mission flag color to Mission class. */
global.missions = (flag: Flag) => {
  if (flagIsColor(flag, HARVEST_SOURCE_FLAG)) {
    return new HarvestingMission(flag);
  } else if (flagIsColor(flag, BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, SOURCE_BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, TRANSPORT_MISSION_FLAG)) {
    return new TransportMission(flag);
  } else if (flagIsColor(flag, UPGRADE_MISSION_FLAG)) {
    return new UpgradeMission(flag);
  }

  return null;
};
