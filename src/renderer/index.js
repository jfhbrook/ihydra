var Loader = require('./loader').Loader;

var Admin = require('./containers/admin');
var Hydra = require('./containers/hydra');

var loader = new Loader();

loader.register('admin', Admin);
loader.register('hydra', Hydra);

loader.load(__args__);