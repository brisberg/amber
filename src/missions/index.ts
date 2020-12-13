import {
  ATTACK_CONTROLLER_MISSION_FLAG,
  ATTACK_MISSION_FLAG,
  BUILD_TARGET_FLAG,
  CLAIM_MISSION_FLAG,
  DEFEND_MISSION_FLAG,
  DISMANTLE_MISSION_FLAG,
  DISTRIBUTION_MISSION_FLAG,
  flagIsColor,
  HARVEST_SOURCE_FLAG,
  MANAGER_MISSION_FLAG,
  MANUAL_SCOUT_MISSION_FLAG,
  PIONEER_MISSION_FLAG,
  RAID_MISSION_FLAG,
  SOURCE_BUILD_TARGET_FLAG,
  TRANSPORT_MISSION_FLAG,
  UPGRADE_MISSION_FLAG,
} from 'flagConstants';

import {ClaimMission} from './colonization/claim';
import {PioneerMission} from './colonization/pioneer';
import {AttackMission} from './combat/attack';
import {AttackControllerMission} from './combat/attackController';
import {DefendMission} from './combat/defend';
import {DemolishMission} from './combat/demolish';
import {RaidMission} from './combat/raid';
import {BuildMission} from './core/build';
import {DistributionMission} from './core/distribution';
import {ManagerMission} from './core/manager';
import {ManualMission} from './core/manual';
import {UpgradeMission} from './core/upgrade';
import {TransportMission} from './logistics/transport';
import {HarvestingMission} from './mining/harvesting';
import {Mission} from './mission';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MissionMap = (flag: Flag) => Mission<any>|null;

/** Convenience mapping of mission flag color to Mission class. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.missions = (flag: Flag): Mission<any>|null => {
  if (flagIsColor(flag, PIONEER_MISSION_FLAG)) {
    return new PioneerMission(flag);
  } else if (flagIsColor(flag, HARVEST_SOURCE_FLAG)) {
    return new HarvestingMission(flag);
  } else if (flagIsColor(flag, BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, SOURCE_BUILD_TARGET_FLAG)) {
    return new BuildMission(flag);
  } else if (flagIsColor(flag, DISMANTLE_MISSION_FLAG)) {
    return new DemolishMission(flag);
  } else if (flagIsColor(flag, TRANSPORT_MISSION_FLAG)) {
    return new TransportMission(flag);
  } else if (flagIsColor(flag, UPGRADE_MISSION_FLAG)) {
    return new UpgradeMission(flag);
  } else if (flagIsColor(flag, DISTRIBUTION_MISSION_FLAG)) {
    return new DistributionMission(flag);
  } else if (flagIsColor(flag, MANAGER_MISSION_FLAG)) {
    return new ManagerMission(flag);
  } else if (flagIsColor(flag, CLAIM_MISSION_FLAG)) {
    return new ClaimMission(flag);
  } else if (flagIsColor(flag, ATTACK_CONTROLLER_MISSION_FLAG)) {
    return new AttackControllerMission(flag);
  } else if (flagIsColor(flag, MANUAL_SCOUT_MISSION_FLAG)) {
    return new ManualMission(flag);
  } else if (flagIsColor(flag, RAID_MISSION_FLAG)) {
    return new RaidMission(flag);
  } else if (flagIsColor(flag, ATTACK_MISSION_FLAG)) {
    return new AttackMission(flag);
  } else if (flagIsColor(flag, DEFEND_MISSION_FLAG)) {
    return new DefendMission(flag);
  }

  return null;
};
