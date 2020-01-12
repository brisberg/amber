# Creep Reuse

I would like to make Operations/Missions potentially ephemeral, where they can be cancelled/retried at any time.

If they do, all of their component creeps should be returned as Orphans.

Orphaned Creep: A Creep that does not have a parent missions.

All creeps should store their "body type" (I.e. 'hauler', 'heavy hauler', 'worker', 'transport worker', 'soldier', etc). These body types correspond to general specifications of body parts.

When a mission requests a new creep, first we check if an Orphaned creep will fit the bill. And Assign that to the mission instead.

If none can be found, we assign it to the spawn queue as usual.

Orphaned creeps should idle out of the way until they are required or expire. In the future I may have a protocol for recycling them.



## API Design

This will require normalizing creep memory format and interactions. Creep Memory should look like this for all creeps:

```
Creep Memory {
  mission: string;
  bodyType: string;
  behavior: string; // String key defined by each behavior
  mem: any; // Memory for the behavior
}
```

Creeps are orphaned if they have no Mission name assigned.

### Creep Behaviors

Each creep behavior will have a String key to idenfity it, and specify a Memory interface for it's state.

Behaviors can have a single sub-behavior at a time. Which they will usually run as well on each tick.
