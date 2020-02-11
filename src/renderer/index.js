import { ComponentLoader } from "../lib/loader";

// eslint-disable-next-line no-unused-vars
import css from "./index.css";

import Launcher from "./containers/launcher";
import Kernel from "./containers/kernel";

const loader = new ComponentLoader();

loader.register("launcher", Launcher);
loader.register("kernel", Kernel);

loader.run(__args__);
