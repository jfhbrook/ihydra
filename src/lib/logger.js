const { EventEmitter } = require("events");

const { app, ipcMain, ipcRenderer } = require("electron");

const LEVELS = Object.fromEntries(
  ["debug", "info", "warning", "exception"].map((level, severity) => [
    level,
    severity
  ])
);

class Logger extends EventEmitter {
  constructor(namespace) {
    super();
    this.namespace = namespace;
  }

  log(event) {
    this.emit(event.level, event);
  }

  observe(level, observer) {
    const minimum = LEVELS[level];
    Object.entries(LEVELS).forEach(([level, severity]) => {
      if (severity >= minimum) {
        this.on(level, observer);
      }
    });
  }

  adopt(child) {
    child.observe("debug", event => this.log(event));
  }

  debug(message, metadata = {}) {
    this.log({
      level: "debug",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  info(message, metadata = {}) {
    this.log({
      level: "info",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  warn(message, metadata = {}) {
    this.log({
      level: "warning",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  error(err, metadata = {}) {
    this.log({
      level: "exception",
      error: err,
      namespace: this.namespace,
      ...metadata
    });
  }

  fatal(err, metadata = {}) {
    this.error(err, metadata);
    this.warn("Fatal error; exiting", { error: err });

    if (app.exit) {
      app.exit(1);
    } else {
      ipcRenderer.send("bail", 1);
    }
  }

  child(namespace) {
    const child = new Logger(namespace);

    this.adopt(child);

    return child;
  }
}

function formatEvent(event) {
  let { message } = event;

  if (typeof message === "function") {
    message = message(event);
  }

  if (message && typeof message !== "string") {
    try {
      message = JSON.strigify(message);
    } catch (err) {
      message = String(message);
    }
  }

  if (event.error) {
    if (!message) {
      message = String(event.error.stack);
    } else {
      message = `== FLAGRANT SYSTEM ERROR ==\n${event.error.stack}`;
    }
  }

  if (!message) {
    message = JSON.stringify(event);
  }

  return message;
}

function consoleObserver(event) {
  formatEvent(event)
    .split("\n")
    .forEach(l => {
      console.log(`${event.level} - ${event.namespace} - ${l}\n`);
    });
}

function mainThreadObserver(event) {
  const unstructured = { ...event };
  if (event.error) {
    unstructured.error = {
      message: event.error.message,
      stack: String(event.error.stack)
    };
  }
  ipcRenderer.send("log-message", unstructured);
}

function rendererThreadAdopter(logger) {
  ipcMain.on("log-message", (event, payload) => {
    logger.log({ ipcEvent: event, ...payload });
  });

  return logger;
}

module.exports = {
  LEVELS,
  Logger,
  formatEvent,
  consoleObserver,
  mainThreadObserver,
  rendererThreadAdopter
};
