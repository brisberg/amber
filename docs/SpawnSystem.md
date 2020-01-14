# Spawn System

## First Pass

I first implemented a system where the SpawnQueue would accept requests for creeps (including their name, body, and spawn options). The queue would return a reservation object, which included the new creeps assigned name and eventual body definition, effectively a Promise of a Creep in the future.

This worked pretty well for static systems (like miners), but it doesn't work as well for my flexible creep allocation system I have planned. This is because large missions would simply request all of the creeps they believed they needed right at their initialization and then sit on a large queue of reservations.

However, conditions can change dramatically between the time a mission requests a creep and when the queue finally gets around to fulfilling it.

This means that it became necessary for missions to keep track of their reservations and attempt to cancel them if they realized they were not needed anymore.

This also means that all of the creep requests and reservations reservations were serialized in memory, adding to the book keeping.

Additionally, I was planning for the system to automatically allocate 'Idle' creeps Orphaned from other missions if they fit the bill. This meant a ton of bookkeeping to keep all of these promises sorted, fulfilled, and cancelled when the time was right.


## Second Pass

BonzAI uses a similar queue system, but doesn't use Promises of any kind. His simply has missions ask their spawn group for a creep in order of mission instantiation (as a proxy for mission priority). If the spawn group can fulfill, it does. If not it does not. The missions will keep requesting all of their creeps every tick until they are finally fulfilled, or conditions change and the mission no longer needs one.

I think I will use a similar system, where there are no promises (creeps are either spawned or not). However, I still want the ability to order spawns by priority or fulfill missions on a piecemeal basis.

For example, if an Orphan creep fitting the body description exists, the system should immediatly fulfill the request with such a creep.

Otherwise, the spawn queue should aggregate all of the requests for spawns, and order them by priority and attempt to fulfill the highest one.

Additionally, this will let missions request creeps at different priorities depending on counts. For example, the first Hauler in a transport mission is CRITICAL priority because it allows energy to be transported to the spawn at all. While all future Haulers are normal transport mission priority because they improve efficiency but aren't required to unstick a logjam.

### Psudocode

Missions will call SpawnQueue.requestCreep(bodyType). For now, specifying a hardcoded string that maps to a configuration

Spawn queue with add each request for a creep to a list which it keeps outside of Memory. After all missions have executed, the main loop will call SpawnQueue.run().

The Run function will sort the request list by priority.

First, iterate down the list and attempt to fulfill each request with an idle creep if one exists with the same body type. If so, it assigns that creep to the missions. (how exactly?).

Next, it takes the top request from the remaining list and attempts to spawn the creep. If it can, it begins the spawn, and assigns it to the missions.

If it can't spawn it, the queue could stop here. Dropping the rest of the requests (they will be re-requested next tick).
