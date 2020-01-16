# Energy Transport Networks (Intra-Room)

Throughout the game, it is critically important to be able to efficiently move energy throughout a room to supply various operations.

Later in the game, you get `Links` which simplify this a bit because you no longer need to run creeps between link locations.

However, without `Links` and even after they become available there will still be plenty of temporary/inconvenient locations where energy needs to be moved.

This network will manage building all of the roads between persistant locations in the room.

## The Network

The (Intra-room) Energy Network is a control system for devising where and how energy should be moved around the room.

It does this by analyzing the room and compiling a list of Energy Source nodes, and Energy Sink nodes. This analysis is done by surveying the room for a set of YELLOW room flags which represent network nodes. The whole network can be rebuilt at any time from just these nodes.

It will hash the names of all registered nodes, and if this list changes it will re-evaluate the network. This can happen because a container was destroyed/decayed, because a mission deallocated itself, or because a new node was added. Re-evaluation will reallocate a set of network edges to connect the new node. This may or may not include some previous edges, which can shift any roads constructed. This is fine, as the old roads will just decay and we can build new ones.

Energy Source nodes are registered by various operations and missions. For example, a Harvesting mission will register its `Container` or `Link` as an Energy Source, while a Upgrade mission will register its `Container` or `Link` as an Energy Sink.

All Nodes will have a priority, which the network uses to decide which Source / Sinks to satisfy first.

*NOTE*: For now, we will ignore the posibility of importing/exporting energy between rooms.

### Energy Source Node

An Energy Source Node is anything which is expected to contain an excess of energy. This could be a `Container`, `Link`, `Storage`, `Terminal`.

The network controller will look at these source and attempt to assign transport missions to bring their excess to a sink.

### Energy Sink Node

An Energy Sink Node is anything which requires energy. This could also be a `Container`, `Link`, `Storage`, `Terminal`, Idle `Creep` dropzone.

The network controller will decide which of these sinks to move energy, and how it should be moved.

## Network Edge Types

There are a few possible edges the network can use to flow energy between nodes.

### Link Edge

Link Edges can be used to transfer energy from one `Link` to another `Link`.

*NOTE*: For now I will ignore Link Edges until I have access to Links.

### Walk Edge

Represents a Transport Mission where creeps will walk back and forth from the source to the target.

This is the most simple edge type. It is often ephemeral, and will be removed when the Source/Sink is removed.

### Highway Edge

Represents a Edge which will include a Build, Pave, and Transport mission.

The edge will pick a path from the Source to the Sink, and build a Road between the two points. It will manage the Build Mission to construct the road along the path, and then maintain two Missions to repave the road from time to time, and run Hauler creeps along the highway.

If a road segment is destroyed, the Highway Edge will restart the Build mission to replace it.

This edge type is only used if both the Source and Sink are labeled as `Persistant`.

#### Creep Hand-off Nodes

I had played around with the idea of incorporating, temporary nodes into the network which do not have a storage structure but instead designate a specific location for an Energy-filled creep to wait and refill any workers who ask for Energy.

I am starting to see that this won't work as well as I was hoping, as it will cause too much disruption to the static network. I think it would be better to break these out into their own distinct Node/Mission classes which can draw from a Network Energy Node but do not trigger a recalculation of the grid.

For now I am specifically imagining this for Build Missions which require energy fueling and by definition will be at new, undeveloped locations each time.


# Network Analysis

The EnergyNetwork will attempt to be as adaptable as possible to changes in environment.

It will use a two step analysis and cache process to efficiently move energy around the network.

## Topology Analysis

Each time a Node is added or removed from the network, topology analysis is run. This will take a path-distance weighted fully connected graph of all of the Energy Nodes in the room, and produce a Minimum Spanning Tree of the graph. This MST will be used to produce the set of "Edge" or "Connections" between the various energy nodes of the graph.

Eventually, these are the paths which will have roads assigned.

Each of these links will produce a Transport mission between it's two nodes.

The analysis will cache a hash of the node names, which will be used for cache busting.

## Flow Analysis

The Topology analysis decides which nodes will have connections in the existing Energy Graph, but flow Analysis will determine in which direction, and what throughput each edge will support.

Each energy node will have a "Desired threshold" set on it. Mining containers for example will usually be desired to be empty. While upgrade containers will be desired to be full. Buffer nodes, such as the spawn container / storage can have a desired threshold like "Above 300".

Flow Analysis will go edge by edge and compare the nodes against their desired levels. This computes their polarity. Then it sets the direction of the edge and the expected throughput based on the absolute difference of these two targets.

This will cause the transport missions to possibly reverse direction and request new hauler creeps or release existing ones from service.

Flow Analysis will be run every 100 ticks, to save on CPU and to give creeps time to complete trips to begin to balance the network.


# Central Network

Inspired by Kansaibot (https://kasami.github.io/kasamibot/features.html).

Looking at the "End Game" system Kasamibot is aiming at, it is a set of isolated "Claimed Room", each upgraded to RC8, that have 1-3 "Reserved Rooms" between them each of which is running remote mining from.

Each energy network is isolated from eachother, and very centralized. All roads lead back to the Storage at the center of the Core room. Energy coordination between isolated rooms is performed with Terminals, not creeps walking.

This simplifies the energy management, because every link will always ever be one direction (Source -> Storage, Storage -> Controller, Storage -> Lab, Storage -> Spawn, etc).

It also suggests using a Container as the central dropzone near the spawn, and switching it out for a Storage once one can be created. This makes sense to me, as after bootstrapping it simplifies how to organize the Spawn Reload missions.

Though this might theoretically cause a bit of extra hauling from a source near the controller to spawn and back, in the long run this makes it easier to manage.

With that in mind, I am willing to attempt a simplification of my Energy Network system. By specifying one node as the "Core" node, all other shipping lanes will be towards or away from this node. Hopefully this means that roads will line up together. This also makes demand planning easier, as sources will have static outputs, and only shipping out to the controller may require a variable amount of haulers.

> The pioneers will ship the energy themselves, but when dedicated miners, containerminers, are used, the bot will spawn dedicated haulers to ship the energy back to the base. First it will have haulers assigned to specific containers, but from RCL 7 it will start using the same pool of haulers for all the sources, allowing it to spawn fewer units.

This will work up until RCL7, where it can switch to a pool system to save CPU. I can handle that when I get there.
