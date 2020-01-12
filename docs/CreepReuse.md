# Creep Reuse

I would like to make Operations/Missions potentially ephemeral, where they can be cancelled/retried at any time.

If they do, all of their component creeps should be returned as Orphans.

Orphaned Creep: A Creep that does not have a parent missions.

All creeps should store their "body type" (I.e. 'hauler', 'heavy hauler', 'worker', 'transport worker', 'soldier', etc). These body types correspond to general specifications of body parts.

When a mission requests a new creep, first we check if an Orphaned creep will fit the bill. And Assign that to the mission instead.

If none can be found, we assign it to the spawn queue as usual.

Orphaned creeps should idle out of the way until they are required or expire. In the future I may have a protocol for recycling them.
