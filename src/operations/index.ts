import {BASE_OPERATION_FLAG, BUILD_OPERATION_FLAG, flagIsColor, MINING_OPERATION_FLAG, UPGRADE_OPERATION_FLAG} from 'flagConstants';

import {BaseOperation} from './BaseOperation';
import {BuildOperation} from './buildOperation';
import {MiningOperation} from './miningOperation';
import {UpgradeOperation} from './upgradeOperation';

export type AllOperations =
    MiningOperation|BaseOperation|BuildOperation|UpgradeOperation;

// tslint:disable-next-line: max-line-length
export type OperationMap = (flag: Flag) => AllOperations|null;

/** Convenience mapping of mission flag color to Mission class. */
global.operations = (flag: Flag) => {
  if (flagIsColor(flag, MINING_OPERATION_FLAG)) {
    return new MiningOperation(flag);
  } else if (flagIsColor(flag, BUILD_OPERATION_FLAG)) {
    return new BuildOperation(flag);
  } else if (flagIsColor(flag, UPGRADE_OPERATION_FLAG)) {
    return new UpgradeOperation(flag);
  } else if (flagIsColor(flag, BASE_OPERATION_FLAG)) {
    return new BaseOperation(flag);
  }

  return null;
};
