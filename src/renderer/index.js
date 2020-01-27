const { Loader } = require("./loader");

const Admin = require("./containers/admin");
const Hydra = require("./containers/hydra");

const loader = new Loader();

loader.register("admin", Admin);
loader.register("hydra", Hydra);

loader.load(__args__);
