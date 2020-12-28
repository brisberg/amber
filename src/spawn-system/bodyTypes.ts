/**
 * Definition file for all hardcoded Creep Body Types
 *
 * For now, these are hardcoded by capability and per spawn level. This should
 * be expanded later into a more sophisticated definition system.
 */

import _ from 'lodash';
import {createCreepBody} from '../utils/creepBodyUtils';

export const creepBodyRatios: {[name: string]: CreepRatio} = {};

interface CreepRatio {
  work: number;
  carry: number;
  move: number;
  attack: number;
  range: number;
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
  range: 0,
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
  range: 0,
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
  range: 0,
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
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[HAULER] = hauler;

/**
 * Off-Road Hauler
 * Off-Road Haulers can move 1 cell per tick when loaded even off roads
 */
export const OR_HAULER = 'orhauler';
const offRoadHauler: CreepRatio = {
  attack: 0,
  carry: 1,
  claim: 0,
  heal: 0,
  move: 1,
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[OR_HAULER] = offRoadHauler;

/**
 * Tanker
 * Tankers can move 1 cell per tick when unloaded even off roads. Effectively
 * immobile when loaded. Should be built with 1 Move Part appended.
 */
export const TANKER = 'tanker';
const tanker: CreepRatio = {
  attack: 0,
  carry: 1,
  claim: 0,
  heal: 0,
  move: 0,
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[TANKER] = tanker;

/**
 * Claimer
 * Claimers can move 1 cell per tick when loaded even off roads
 */
export const CLAIMER = 'claimer';
const claimer: CreepRatio = {
  attack: 0,
  carry: 0,
  claim: 1,
  heal: 0,
  move: 1,
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[CLAIMER] = claimer;

/**
 * Scout
 * Scouts can move 1 cell per tick when loaded even off roads
 */
export const SCOUT = 'scout';
const scout: CreepRatio = {
  attack: 0,
  carry: 0,
  claim: 0,
  heal: 0,
  move: 1,
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[SCOUT] = scout;

/**
 * Fighter
 * Fighters can move 1 cell per tick on roads
 */
export const FIGHTER = 'fight';
const fighter: CreepRatio = {
  attack: 1,
  carry: 0,
  claim: 0,
  heal: 0,
  move: 1,
  range: 0,
  tough: 0,
  work: 0,
};
creepBodyRatios[FIGHTER] = fighter;

/**
 * Ranger
 * Rangers can move 1 cell per tick on roads
 */
export const RANGED = 'ranged';
const ranged: CreepRatio = {
  attack: 0,
  carry: 0,
  claim: 0,
  heal: 0,
  move: 1,
  range: 1,
  tough: 0,
  work: 0,
};
creepBodyRatios[RANGED] = ranged;

export interface GenerateCreepBodyOptions {
  min?: CreepRatio;
  max?: {
    work?: number;
    carry?: number;
    move?: number;
    attack?: number;
    range?: number,
    heal?: number;
    tough?: number;
    claim?: number;
  };
}

function addToRatio(base: CreepRatio, addition: CreepRatio): CreepRatio {
  return {
    attack: base.attack + addition.attack,
    carry: base.carry + addition.carry,
    claim: base.claim + addition.claim,
    heal: base.heal + addition.heal,
    move: base.move + addition.move,
    range: base.range + addition.range,
    tough: base.tough + addition.tough,
    work: base.work + addition.work,
  };
}

function costOfRatio(ratio: CreepRatio): number {
  return ratio.attack * BODYPART_COST[ATTACK] +
      ratio.carry * BODYPART_COST[CARRY] + ratio.claim * BODYPART_COST[CLAIM] +
      ratio.heal * BODYPART_COST[HEAL] + ratio.move * BODYPART_COST[MOVE] +
      ratio.range * BODYPART_COST[RANGED_ATTACK] +
      ratio.tough * BODYPART_COST[TOUGH] + ratio.work * BODYPART_COST[WORK];
}

function bodySize(body: CreepRatio): number {
  return _.sum(Object.values(body));
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
  while (energy + costPerTier <= maxEnergy &&
         bodySize(body) + bodySize(ratio) <= 50) {
    const nextBody = addToRatio(body, ratio);

    if (opts && opts.max) {
      const max = opts.max;
      if (nextBody.work > (max.work || 99) ||
          nextBody.carry > (max.carry || 99) ||
          nextBody.move > (max.move || 99) ||
          nextBody.attack > (max.attack || 99) ||
          nextBody.range > (max.range || 99) ||
          nextBody.heal > (max.heal || 99) ||
          nextBody.tough > (max.tough || 99) ||
          nextBody.claim > (max.claim || 99)) {
        // Another ratio will go over the maximum.
        break;
      }
    }

    body = nextBody;
    energy += costPerTier;
  }

  return createCreepBody(
      body.work, body.carry, body.move, body.attack, body.range, body.heal,
      body.tough, body.claim);
}
