import {BUILD_OPERATION_FLAG, flagIsColor, UPGRADE_OPERATION_FLAG} from 'flagConstants';

import {BuildOperation} from './buildOperation';
import {UpgradeOperation} from './upgradeOperation';

// tslint:disable-next-line: max-line-length
export type OperationMap = (flag: Flag) => BuildOperation|UpgradeOperation|null;

/** Convenience mapping of mission flag color to Mission class. */
global.operations = (flag: Flag) => {
  if (flagIsColor(flag, BUILD_OPERATION_FLAG)) {
    return new BuildOperation(flag);
  } else if (flagIsColor(flag, UPGRADE_OPERATION_FLAG)) {
    return new UpgradeOperation(flag);
  }

  return null;
};
