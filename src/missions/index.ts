// tslint:disable-next-line: max-line-length
import {BUILD_TARGET_FLAG, CLAIM_MISSION_FLAG, DISTRIBUTION_MISSION_FLAG, flagIsColor, HARVEST_SOURCE_FLAG, MANUAL_SCOUT_MISSION_FLAG, PIONEER_MISSION_FLAG, RAID_MISSION_FLAG, SOURCE_BUILD_TARGET_FLAG, TRANSPORT_MISSION_FLAG, UPGRADE_MISSION_FLAG} from 'flagConstants';

import {BuildMission} from './build';
import {ClaimMission} from './claim';
import {DistributionMission} from './distribution';
import {HarvestingMission} from './harvesting';
import {ManualMission} from './manual';
import {Mission} from './mission';
import {PioneerMission} from './pioneer';
import {RaidMission} from './raid';
import {TransportMission} from './transport';
import {UpgradeMission} from './upgrade';

export type MissionMap = (flag: Flag) => Mission<any>|null;

/** Convenience mapping of mission flag color to Mission class. */
global.missions = (flag: Flag) => {
  if (flagIsColor(flag, PIONEER_MISSION_FLAG)) {
    return new PioneerMission(flag);
  } else if (flagIsColor(flag, HARVEST_SOURCE_FLAG)) {
    return new HarvestingMission(flag);
  } else if (flagIsColor(flag, BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, SOURCE_BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, TRANSPORT_MISSION_FLAG)) {
    return new TransportMission(flag);
  } else if (flagIsColor(flag, UPGRADE_MISSION_FLAG)) {
    return new UpgradeMission(flag);
  } else if (flagIsColor(flag, DISTRIBUTION_MISSION_FLAG)) {
    return new DistributionMission(flag);
  } else if (flagIsColor(flag, CLAIM_MISSION_FLAG)) {
    return new ClaimMission(flag);
  } else if (flagIsColor(flag, MANUAL_SCOUT_MISSION_FLAG)) {
    return new ManualMission(flag);
  } else if (flagIsColor(flag, RAID_MISSION_FLAG)) {
    return new RaidMission(flag);
  }

  return null;
};
