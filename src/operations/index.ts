import {
  BASE_OPERATION_FLAG,
  BUILD_OPERATION_FLAG,
  COLONIZATION_OPERATION_FLAG,
  flagIsColor,
  MINING_OPERATION_FLAG,
  UPGRADE_OPERATION_FLAG,
} from 'flagConstants';

import {BaseOperation} from './baseOperation';
import {BuildOperation} from './buildOperation';
import {ColonizeOperation} from './colonizeOperation';
import {MiningOperation} from './miningOperation';
import {UpgradeOperation} from './upgradeOperation';

export type AllOperations = MiningOperation|BaseOperation|BuildOperation|
    UpgradeOperation|ColonizeOperation;

export type OperationMap = (flag: Flag) => AllOperations|null;

/** Convenience mapping of operation flag colors to Operation class. */
global.operations = (flag: Flag): AllOperations|null => {
  if (flagIsColor(flag, MINING_OPERATION_FLAG)) {
    return new MiningOperation(flag);
  } else if (flagIsColor(flag, BUILD_OPERATION_FLAG)) {
    return new BuildOperation(flag);
  } else if (flagIsColor(flag, UPGRADE_OPERATION_FLAG)) {
    return new UpgradeOperation(flag);
  } else if (flagIsColor(flag, BASE_OPERATION_FLAG)) {
    return new BaseOperation(flag);
  } else if (flagIsColor(flag, COLONIZATION_OPERATION_FLAG)) {
    return new ColonizeOperation(flag);
  }

  return null;
};
