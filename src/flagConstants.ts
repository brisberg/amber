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
