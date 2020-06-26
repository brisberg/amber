import User from '@brisberg/screeps-server-mockup/dist/src/user';

import {helper} from './helper';

/*
 * Helper package for adding RoomObjects (screeps, structures, resources, etc)
 * to a ScreepsServer world.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getController(room: string): Promise<any> {
  const {db, C} = await helper.server.world.load();

  return await db['rooms.objects'].findOne({
    room,
    type: C.STRUCTURE_CONTROLLER,
  });
}

export async function claimRoomForPlayer(
    room: string, player: User, level = 1): Promise<void> {
  const world = helper.server.world;
  const {db} = await world.load();

  const controller = await getController(room);

  if (!controller) {
    throw new Error(`Room ${room} has no controller and is not claimable.`);
  }

  // Claim the room for the player
  await await Promise.all([
    db.rooms.update({_id: room}, {$set: {active: true}}),
    db['rooms.objects'].update({room, type: 'controller'}, {
      $set: {
        downgradeTime: null,
        level,
        progress: 0,
        user: player.id,
      },
    }),
  ]);
  return;
}

/**
 * 'user': string
 * 'room': string
 * 'data': string
 *
 * Data Format: '<Name>~<PrimaryColor>~<SecondaryColor>~<X>~<Y>|<Name>~ etc'
 * Example: 'Flag1~10~10~36~17|Flag2~10~9~36~18'
 */
export async function setFlag(
    player: User, room: string, name: string, x: number, y: number,
    color: number, scolor: number): Promise<void> {
  const world = helper.server.world;
  const {db} = await world.load();

  return db['rooms.flags'].insert(
      {user: player.id, room, data: `${name}~${color}~${scolor}~${x}~${y}`},
  );
  // return db['rooms.flags'].update(
  //     {user: player._id, room},
  //     {$set: {data: `${name}~${color}~${scolor}~${x}~${y}`}},
  // );
}

export async function addContainer(
    room: string, x: number, y: number, amount = 0,
    decayDelay?: number): Promise<void> {
  const world = helper.server.world;
  const {C} = await world.load();
  const decay = decayDelay ? decayDelay : C.CONTAINER_DECAY_TIME_OWNED;

  return world.addRoomObject(room, C.STRUCTURE_CONTAINER, x, y, {
    hits: C.CONTAINER_HITS,
    hitsMax: C.CONTAINER_HITS,
    nextDecayTime: helper.server.world.gameTime + decay,
    notifyWhenAttacked: true,
    store: {energy: amount},
    storeCapacityResource: {energy: C.CONTAINER_ENERGY_CAPACITY},
  });
}

export async function addSpawn(
    player: User, room: string, x: number, y: number, name = 'Spawn2',
    amount?: number): Promise<void> {
  const world = helper.server.world;
  const {C} = await world.load();
  const energy = amount ? amount : C.SPAWN_ENERGY_START;

  return world.addRoomObject(room, C.STRUCTURE_CONTAINER, x, y, {
    hits: C.SPAWN_HITS,
    hitsMax: C.SPAWN_HITS,
    name,
    notifyWhenAttacked: true,
    spawning: null,
    store: {energy},
    storeCapacityResource: {energy: C.SPAWN_ENERGY_CAPACITY},
    user: player.id,
  });
}
