# BaseLayout

For the moment, I can hard code the base layout to get just that working.

I will hard code it so that from spawn, it will place the Core Energy Node two cells to the right, and the first Extension group, 3 cells to the left.

E - - S - C

This will give us a clean starting point. The Core Node will be initialized AFTER the two Mining operations, which is important. This means that it will not attempt to build the Core Node until the harvesting containers are finished, providing it an Energy Node to draw from.

Once the Core Node is completed, it can init the energy Network from it. And spawn a Distributor, which will fill the spawn from the Core Node.
