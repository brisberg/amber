describe('Mining Operation', () => {
  it.todo('should perform Source Analysis on the source if needed');

  describe(`Type 'drop'`, () => {
    it.todo('should start a HarvestV2Mission with the source as a target');

    // Let the Harvest mission register with logistics
  });

  describe(`Type 'cont' (Container)`, () => {
    it.todo('should place a Container construction site at Primary location');

    describe('Container exists', () => {
      it.todo('should register a Logistics Node on the Container');

      it.todo('should retire Drop Mining mission');

      it.todo('should start a Container Mining Mission');
    });

    describe('Container does not exist', () => {
      it.todo('should convert Container Mining Msn to Drop Mining Msn');
    });
  });

  describe.skip(`Type 'link'`, () => {
    /**
     * If type = ‘link’, and there is no Link or Link Construction Site: creates
     * a Link Construction site at the link location.
     *
     * If type = ‘link’, and there is a Container: Destroy it?
     *
     * If the link exists, dissolve the Container Mining mission, Start a Link
     * Mining Mission.
     */
    return;
  });
});
