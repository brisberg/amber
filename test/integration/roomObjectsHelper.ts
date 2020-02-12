import {helper} from './helper';

/*
 * Helper package for adding RoomObjects (screeps, structures, resources, etc)
 * to a ScreepsServer world.
 */

export async function addContainer(
    room: string, x: number, y: number, amount = 0, decayDelay?: number) {
  const {C} = await helper.server.world.load();
  const decay = decayDelay ? decayDelay : C.CONTAINER_DECAY_TIME_OWNED;

  helper.server.world.addRoomObject(room, C.STRUCTURE_CONTAINER, x, y, {
    hits: C.CONTAINER_HITS,
    hitsMax: C.CONTAINER_HITS,
    nextDecayTime: helper.server.world.gameTime + decay,
    notifyWhenAttacked: true,
    store: {energy: amount},
    storeCapacityResource: {energy: C.CONTAINER_ENERGY_CAPACITY},
  });
}
