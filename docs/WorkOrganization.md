# Work Organization


Freeform Brainstorm:

I need to devise a system for managing the spawning/respawning of worker screeps, delegating tasks for them to complete various objectives, and potentially swapping screeps between tasks on the fly as needed.

BonzAI uses an interesting system for this which I can likely adapt. He uses a couple of useful abstractions:

SpawnGroup - It seems to be a set of spawners which can be requested to produce creeps of specific sizes.

Operation - Large scale operation such as RemoteMining, LocalMining, Buliding/Paving Roads. Each of these operations is tied to a Flag placed in a specific room, and the memory for the operation is placed on the flag.

Mission - Small scale task, many of these are associated with each Operation. These could be MineASource, BuildAStructure, etc. Missions have a RoleCall section where it evaluates how many screeps it requires, and requests more from the spawnGroup if it doesn't have enough.

Agent - A simple abstraction over a Creep, which delegates most of the normal operators to the default creep but has some useful utilities. These are largely task agostnic though, that business logic is built into the missions.




My system will need several abstractions to manage the production and coordination of creeps.

The tutorial for Screeps recommends organizing your agents into "Roles" which contain the business logic for fulfilling the role of a "Miner", "Upgrader", "Paver", etc. This is one possible abstraction structure.

Devise a set of Role based AI, which know how to complete a very specific task (i.e. Use energy from this source to upgrade this specific Controller), and have a Mission/Objective abstraction which assigns each screep their role/task.

This is distinct from how BonzAI is organized, where the Agent class is task agnostic and simply has convenience methods for simple creep operations. Missions will direct each step of the screeps tasks, and contain the business logic.


First plan:

#### Role (Task)
Tasks are behavior for a single creep to complete a specific task. They may be on going, or finite. They will know about their requirements (Needs a WORK, CARRY, or HEAL part for example), and they know their body shape preferences. Tasks can be reassigned at will, to any Creep that meets the minimum requirements.

```
interface Task {
  hasRequiredParts(creep: Creep) => boolean;
  step: (creep: Creep) => TaskResult;
}
```

Tasks will usually result in a single Creep action taken by the creep at the end of the step() function.
For now Tasks will handle movement to complete them (i.e. move to a source and mine the source), though I may take this back.

Tasks only require a Creep body and the Memory of the creep to progress on the task. All other concerns will be handled by higher level abstractions.

#### Objectives
Objectives are higher order abstractions that coordinate one or several creeps to complete a single objective. These objectives may be things like: "Mine a source and drop energy in a container", "Take energy from a container/storage and upgrade a controller", "Build a road between two points", "Repair a road / structure", "Kill a source Keeper".

In general, Objectives will deal with few locations, located within a single room. There can be duplicate Objectives within the same room. For example, a room with two sources will have two "Mine a source" Objectives.

Objectives will have a list of creeps assigned to them. Objectives will decide which tasks to assign each creep and the parameters of these tasks. For example, a "Mine and Transport" mission will decide to assign the "Move and Mine" task to a creep until it is full, and then assign the "Move and Deliver" task until it delivers it to spawn.

Objectives will decide how many creeps of what parameters they need. If they do not have enough assigned, they will request a new one from the nearest Spawn.

#### RoomController
RoomController (Operation) will evaluate the state of a room and generate a set of Objectives for all objectives/processess which need to be completed for the room.

I kindof like the idea of the room posessing a "pool" of stray creeps. Which can be assigned on an adhoc basis. This way we could have several paving objectives for instance, for each road. But the objective will only request a creep when a new pass is required. If all roads are fine it will return them to the pool. If the pool is empty and it needs another only then will it be spawned.


## First Pass:

In the spirit of "Fail Fast" I should make a simplistic, mostly hardcoded system to spawn some initial creeps, spawn real miners and transports, and upgraders. This can work pretty simply since that is the whole goal.


Second Pass:

I am thinking of these abstraction levels for organizing behavior in Screeps. The broad idea is encapsulation and component based design. Each unit should store enough memory to know how to progress on its task. The units above have more context and will make coordination decisions by adding/removing lower units or adjusting their memory. Units below will then react to the best of their ability.



1/12/2020

### Creep Behaviors

I can considering changing the Role/task directory to behavior. As they are really specific behavior classes for creeps. This is something I had played with in my previous attempt.

Creep behaviors would be simple functions which take a single creep (and it's memory) and progress the behavior one tick.

Creep behaviors should be composable, mean that behaviors can have sub behaviors. This means that by definiing some basic behaviors we can build them into more complex behaviors.

The only difference between behaviors and missions is that behaviors control at most one creep, while missions can control several.

This should allow for reusability between behaviors better than I am doing now.


## Build Operation Behavior

Currently I have both the Harvester and Upgrader Operations managing their own Build Step with a Build Mission.

This is currently working, as the Operation will place the ConstructionSite and start the Build Mission. Generating a 'creep' energy node in the process and running a Transport Mission between a Node and the Creep node to supply the builders.

However, this might be overly complicated. BonzAI simply has a persistant "BuildOperation" for each room, which periodically scans for unfinished ConstructionSites and requests Builders to build them in Identifier Order. It will also request "Carts" (basically Haulers), which will fetch Energy from anywhere it can find it, and route directly to the Builder to fuel it.

This is much simpler to code and much easier to manage. There are no Energy Node positions. Carts will just attempt to supply the lowest builder where ever it is. Builders will harvest from a Source if one is available (useful for Bootstrapping).

This may not be particularly efficient, as builders and carts will run around haphazrdly to approach arbitrary construction sites and arbitrary energy stores. However, since "Building" is supposed to be ephemeral this might be ok. As it is a chaotic state which will end at some point.

---

For my system, I sortof like the idea of Harvesting / Upgrading operations to simply decide where structures should go, and place ConstructionSites if one doesn't exist. It then waits, assuming that a Build operation will construct the structure for them eventually.

It would certainly simply the other Operations. I would need to build in some sort of clustering algorithm to the Build operation which would find clusters of Construction Sites as Buildable Units.

The operation itself would look at the Energy Node flags in the area and decide how best to supply the builders. Maybe if there is an energy node within a certain range we don't need the Transport at all? (Seems unlikely, as even a 1 cell move between Storage and Construciton would lose two ticks every 40 ticks. Though actually that might be fine)

Operations Simply producing ConstructionSites does seem pretty clean. We can divine an Operation from just a flag placed on a target, and it will produce the necessary Construction Sites. It can be easily rebuilt without Memory.
