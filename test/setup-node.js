// inject mocha globally to allow custom interface refer without direct import -
// bypass bundle issue
// global._ = require('lodash');
// global.mocha = require('mocha');
// global.chai = require('chai');
// global.sinon = require('sinon');
// global.chai.use(require('sinon-chai'));

// Add all screeps constants to Global
// Object.assign(
//     global,
//     require('@screeps/common').configManager.config.common.constants,
// );
