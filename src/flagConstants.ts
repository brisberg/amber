/**
 * Set of constants which control what the colors of flags signify.
 */

/** Primary/Secondary colors to identify a flag type */
export interface FlagColor {
  color: ColorConstant;
  secondaryColor: ColorConstant;
}

/** Tests if a flag has the specified color/secondary combination */
export function flagIsColor(flag: Flag, color: FlagColor): boolean {
  return flag.color === color.color &&
      flag.secondaryColor === color.secondaryColor;
}

/** Reserving the Green/Green flag color for Pioneer Missions */
export const PIONEER_MISSION_FLAG: FlagColor = {
  color: COLOR_GREEN,
  secondaryColor: COLOR_GREEN,
};

/** Reserving the Grey/Grey flag color for Manual Scouting Missions */
export const MANUAL_SCOUT_MISSION_FLAG: FlagColor = {
  color: COLOR_GREY,
  secondaryColor: COLOR_GREY,
};

/** Reserving the Yellow/Yellow flag color for energy nodes */
export const ENERGY_NODE_FLAG: FlagColor = {
  color: COLOR_YELLOW,
  secondaryColor: COLOR_YELLOW,
};
/** Reserving the Yellow/Purple flag color for energy nodes */
export const CORE_ENERGY_NODE_FLAG: FlagColor = {
  color: COLOR_YELLOW,
  secondaryColor: COLOR_PURPLE,
};
/** Reserving the Yellow/Grey flag color for temp energy nodes */
export const TEMP_ENERGY_NODE_FLAG: FlagColor = {
  color: COLOR_YELLOW,
  secondaryColor: COLOR_GREY,
};

/** Reserve Brown/Yellow flag color for Mining Operation Flag */
export const MINING_OPERATION_FLAG: FlagColor = {
  color: COLOR_BROWN,
  secondaryColor: COLOR_YELLOW,
};
/** Reserve Brown/Brown flag color for Harvest Mission Sources */
export const HARVEST_SOURCE_FLAG: FlagColor = {
  color: COLOR_BROWN,
  secondaryColor: COLOR_BROWN,
};

/** Reserve Orange/Grey flag color for Build Operation Flag */
export const BUILD_OPERATION_FLAG: FlagColor = {
  color: COLOR_ORANGE,
  secondaryColor: COLOR_GREY,
};
/** Reserve Orange/Orange flag color for Build Mission Targets */
export const BUILD_TARGET_FLAG: FlagColor = {
  color: COLOR_ORANGE,
  secondaryColor: COLOR_ORANGE,
};
/** Reserve Orange/Red flag color for Dismantle Mission Targets */
export const DISMANTLE_MISSION_FLAG: FlagColor = {
  color: COLOR_ORANGE,
  secondaryColor: COLOR_RED,
};
/** Reserve Orange/Yellow flag color for Source Build Mission Targets */
export const SOURCE_BUILD_TARGET_FLAG: FlagColor = {
  color: COLOR_ORANGE,
  secondaryColor: COLOR_YELLOW,
};

/** Reserve Purple/Purple flag color for Upgrade Operation */
export const UPGRADE_OPERATION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_PURPLE,
};
/** Reserve Purple/Green flag color for Upgade Missions */
export const UPGRADE_MISSION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_GREEN,
};

/** Reserve Blue flag color for Transport Missions Sources */
export const TRANSPORT_MISSION_FLAG: FlagColor = {
  color: COLOR_BLUE,
  secondaryColor: COLOR_BLUE,
};

/** Reserve Blue/Purple flag color for Base Operation */
export const BASE_OPERATION_FLAG: FlagColor = {
  color: COLOR_BLUE,
  secondaryColor: COLOR_PURPLE,
};
/** Reserve Purple/Blue flag color for Distribution Missions */
export const DISTRIBUTION_MISSION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_BLUE,
};

/** Reserve Purple/Yellow flag color for Manager Missions */
export const MANAGER_MISSION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_YELLOW,
};

/** Reserve Purple/White flag color for Colonization Operation */
export const COLONIZATION_OPERATION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_WHITE,
};
/** Reserve Purple/Cyan flag color for Claim Mission */
export const CLAIM_MISSION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_CYAN,
};
/** Reserve Purple/Red flag color for Attack Controller Mission */
export const ATTACK_CONTROLLER_MISSION_FLAG: FlagColor = {
  color: COLOR_PURPLE,
  secondaryColor: COLOR_RED,
};

/** Reserve Red/Yellow flag color for Raid Mission */
export const RAID_MISSION_FLAG: FlagColor = {
  color: COLOR_RED,
  secondaryColor: COLOR_YELLOW,
};
/** Reserve Red/Red flag color for Attack Mission */
export const ATTACK_MISSION_FLAG: FlagColor = {
  color: COLOR_RED,
  secondaryColor: COLOR_RED,
};
/** Reserve Red/Blue flag color for Defend Mission */
export const DEFEND_MISSION_FLAG: FlagColor = {
  color: COLOR_RED,
  secondaryColor: COLOR_BLUE,
};

/**
 * -----------------
 * Layout Flags
 * -----------------
 */

/** Reserve White/White flag color for Town Square */
export const TOWN_SQUARE_FLAG: FlagColor = {
  color: COLOR_WHITE,
  secondaryColor: COLOR_WHITE,
};
/** Reserve White/Yellow flag color for Extension Group A */
export const EXTENSION_GROUP_A_FLAG: FlagColor = {
  color: COLOR_WHITE,
  secondaryColor: COLOR_YELLOW,
};
/** Reserve White/Orange flag color for Extension Group B */
export const EXTENSION_GROUP_B_FLAG: FlagColor = {
  color: COLOR_WHITE,
  secondaryColor: COLOR_ORANGE,
};
/** Reserve White/Purple flag color for Lab Complex A */
export const LAB_COMPLEX_A_FLAG: FlagColor = {
  color: COLOR_WHITE,
  secondaryColor: COLOR_PURPLE,
};
/** Reserve White/Blue flag color for Lab Complex A */
export const LAB_COMPLEX_B_FLAG: FlagColor = {
  color: COLOR_WHITE,
  secondaryColor: COLOR_BLUE,
};
