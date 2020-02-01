/**
 * Definition file for all hardcoded Creep Body Types
 *
 * For now, these are hardcoded by capability and per spawn level. This should
 * be expanded later into a more sophisticated definition system.
 */

import {createCreepBody} from '../utils/creepBodyUtils';

export const creepBodyRatios: {[name: string]: CreepRatio} = {};

interface CreepRatio {
  work: number;
  carry: number;
  move: number;
  attack: number;
  heal: number;
  tough: number;
  claim: number;
}

/** Empty CreepRatio used as a base to simplify initialization. */
export const zeroRatio: CreepRatio = {
  attack: 0,
  carry: 0,
  claim: 0,
  heal: 0,
  move: 0,
  tough: 0,
  work: 0,
};

/**
 * Basic Worker
 * Worker to move 1 cell per tick on roads when unloaded.
 */
export const WORKER = 'worker';
const worker: CreepRatio = {
  attack: 0,
  carry: 0,
  claim: 0,
  heal: 0,
  move: 1,
  tough: 0,
  work: 2,
};
creepBodyRatios[WORKER] = worker;

/**
 * Carry Focused Worker
 * Carry Workers are workers which prioritize carry capacity. Mainly used by the
 * Pioneer missions, but may be suitable for distance mining or Power Bank
 * robbing.
 */
export const CARRY_WORKER = 'cworker';
const carryWorker: CreepRatio = {
  attack: 0,
  carry: 1,
  claim: 0,
  heal: 0,
  move: 2,
  tough: 0,
  work: 1,
};
creepBodyRatios[CARRY_WORKER] = carryWorker;

/**
 * Hauler
 * Haulers can move 1 cell per tick when loaded on roads. Half speed off roads
 */
export const HAULER = 'hauler';
const hauler: CreepRatio = {
  attack: 0,
  carry: 2,
  claim: 0,
  heal: 0,
  move: 1,
  tough: 0,
  work: 0,
};
creepBodyRatios[HAULER] = hauler;

/**
 * Off-road Hauler
 * Off-Road Haulers can move 1 cell per tick when loaded even off roads
 */
export const OR_HAULER = 'orhauler';
const offRoadHauler: CreepRatio = {
  attack: 0,
  carry: 1,
  claim: 0,
  heal: 0,
  move: 1,
  tough: 0,
  work: 0,
};
creepBodyRatios[OR_HAULER] = offRoadHauler;

export interface GenerateCreepBodyOptions {
  min?: CreepRatio;
  max?: {
    work?: number;
    carry?: number;
    move?: number;
    attack?: number;
    heal?: number;
    tough?: number;
    claim?: number;
  };
}

export function generateFlexibleCreep(
    maxEnergy: number, ratio: CreepRatio,
    opts?: GenerateCreepBodyOptions): BodyPartConstant[] {
  let energy = 0;
  let body: CreepRatio = {...zeroRatio};

  if (opts && opts.min) {
    // Add the minimum body composition
    body = addToRatio(body, opts.min);
    energy = costOfRatio(body);
  }

  const costPerTier = costOfRatio(ratio);
  while (energy + costPerTier <= maxEnergy) {
    const nextBody = addToRatio(body, ratio);

    if (opts && opts.max) {
      const max = opts.max;
      if (nextBody.work > (max.work || 99) &&
          nextBody.carry > (max.carry || 99) &&
          nextBody.move > (max.move || 99) &&
          nextBody.attack > (max.attack || 99) &&
          nextBody.heal > (max.heal || 99) &&
          nextBody.tough > (max.tough || 99) &&
          nextBody.claim > (max.claim || 99)) {
        // Another ratio will go over the maximum.
        break;
      }
    }

    body = nextBody;
    energy += costPerTier;
  }

  return createCreepBody(
      body.work, body.carry, body.move, body.attack, body.heal, body.tough,
      body.claim);
}

function addToRatio(base: CreepRatio, addition: CreepRatio): CreepRatio {
  return {
    attack: base.attack + addition.attack,
    carry: base.carry + addition.carry,
    claim: base.claim + addition.claim,
    heal: base.heal + addition.heal,
    move: base.move + addition.move,
    tough: base.tough + addition.tough,
    work: base.work + addition.work,
  };
}

function costOfRatio(ratio: CreepRatio): number {
  return ratio.attack * BODYPART_COST[ATTACK] +
      ratio.carry * BODYPART_COST[CARRY] + ratio.claim * BODYPART_COST[CLAIM] +
      ratio.heal * BODYPART_COST[HEAL] + ratio.move * BODYPART_COST[MOVE] +
      ratio.tough * BODYPART_COST[TOUGH] + ratio.work * BODYPART_COST[WORK];
}
