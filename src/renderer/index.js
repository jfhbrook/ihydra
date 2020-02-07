const { ComponentLoader } = require("../lib/loader");

const globalCss = require("./index.css");

const Launcher = require("./containers/launcher");
const Kernel = require("./containers/kernel");

const loader = new ComponentLoader();

loader.register("launcher", Launcher);
loader.register("kernel", Kernel);

loader.run(__args__);
