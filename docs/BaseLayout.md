# BaseLayout

Drawing inspiration from a few layouts I have seen out in the wild, here is a plan for a modular base layout which should be efficient, but also flexible enough for most room maps.

The layout is built out of several square units which can be combined or tiled in various ways depnding on map geometry.

#### Town Square

The Town Square is the heart of every base. It has most of the key structures including all of the spawns and non-lab production buildigs. There will be a single Operator Creep sitting in the center, which will remain stationary and withdraw/transfer resources of all kinds between the Link, Storage, Terminal, Factory, and Power Spawn (There is even space for 1 more specialty production building).

This Operator creep should be immortal (He could step out 1 Step and renew at the spawn every 1450 ticks or so).

The 6x7 Layout is like so:

`-`: Road, `S`: Spawn, `G`: Storage, `L`: Link, `F`: Factory, `T`: Terminal, `P`: Power Spawn, `C`: Operator Creep, `R`: Tower

```
-  R  -  -  -  R  -
R  -  -  F  L  -  R
-  -  P  C  T  -  -
R  -  -  G  -  -  R
-  S  -  -  -  S  -
   -  -  S  -  -
```

The original Spawn will be the lower center Spawn.

#### Lab Complex

The Lab complex is an auxiliary layout unit which includes all of the Lab structures for the base. This 5x5 layout will attempt to be placed below the Town Square, so that the Labs are close to the Spawns. That way creeps do not need to go far for boosting.

The 5x5 Layout is like so:

`-`: Road, `L`: Lab

```
-  L  L       OR       L  L  -
L  -  L  L          L  L  -  L
L  L  -  L          L  -  L  L
   L  L  -          -  L  L
```

Which variation it uses will be determined by if this Unit got placed to the left or right of the initial Spawn. It should align such that the Road points towards the Spawn.

#### Extension Group

Extension Groups are a cluster of 6 Extension Structures which need to be filled to assist in spawning. After the Town Square and the Lab Complex above have been placed, the Layout will iteratively search for free 3x3 spaces to place Extension Groups until 10 are placed.

These groups can be tiled directly adjacent, as long as their variation alternates (No Group As next to GroupAs)

The 3x3 Layout is like so:

`-`: Road, `E`: Extension

```
-  E  E    OR    E  E  -
E  -  E          E  -  E
E  E  -          -  E  E
```

The layout will tile them out, trying to stay as close to Storage as possible, until 10 groups are placed (60 Extensions).

------------

### First Pass:

For the moment, I can hard code the base layout to get just that working.

I will hard code it so that from spawn, it will place the Core Energy Node two cells to the right, and the first Extension group, 3 cells to the left.

E - - S - C

This will give us a clean starting point. The Core Node will be initialized AFTER the two Mining operations, which is important. This means that it will not attempt to build the Core Node until the harvesting containers are finished, providing it an Energy Node to draw from.

Once the Core Node is completed, it can init the energy Network from it. And spawn a Distributor, which will fill the spawn from the Core Node.
