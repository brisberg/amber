/** Number of WORK body parts required to maximally deplete a Home Source */
export const MAX_WORK_PER_SOURCE =
    (SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME) / HARVEST_POWER;
/** Number of WORK body parts required to maximally deplete a Keeper Source */
export const MAX_WORK_PER_KEEPER_SOURCE =
    (SOURCE_ENERGY_KEEPER_CAPACITY / ENERGY_REGEN_TIME) / HARVEST_POWER;
/** Number of WORK body parts required to maximally deplete a Neutral Source */
export const MAX_WORK_PER_NEUTRAL_SOURCE =
    (SOURCE_ENERGY_NEUTRAL_CAPACITY / ENERGY_REGEN_TIME) / HARVEST_POWER;
