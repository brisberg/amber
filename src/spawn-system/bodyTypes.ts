/**
 * Definition file for all hardcoded Creep Body Types
 *
 * For now, these are hardcoded by capability and per spawn level. This should
 * be expanded later into a more sophisticated definition system.
 */

import {createWorkerBody} from '../utils/workerUtils';

export const creepBodies: {[bodyType: string]: BodyPartConstant[]} = {};

/** Basic Worker RCL1 */
export const WORKER_1 = 'worker1';
creepBodies[WORKER_1] = createWorkerBody(2, 1, 1);

/** Carry Focused Worker RCL1 (Pioneer) */
export const CARRY_WORKER_1 = 'cworker1';
creepBodies[CARRY_WORKER_1] = createWorkerBody(1, 2, 2);

/** Hauler RCL1 */
export const HAULER_1 = 'hauler1';
creepBodies[HAULER_1] = createWorkerBody(0, 4, 2);

/** Off-road Hauler RCL1 */
export const OR_HAULER_1 = 'orhauler1';
creepBodies[OR_HAULER_1] = createWorkerBody(0, 3, 1);
