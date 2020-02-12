import { ComponentLoader } from "../lib/loader";

import "./index.css";

import Launcher from "./containers/launcher";
import Kernel from "./containers/kernel";

const loader = new ComponentLoader();

loader.register("launcher", Launcher);
loader.register("kernel", Kernel);

loader.run(__args__);
