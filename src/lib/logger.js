const { EventEmitter } = require("events");

const { ipcMain, ipcRenderer } = require("electron");

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
      message: err.message,
      error: err,
      namespace: this.namespace,
      ...metadata
    });
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

  if (event.error) {
    if (message) {
      message = `${message}\n${event.error.stack}`;
    } else {
      message = event.error.stack;
    }
  }

  if (!message) {
    message = JSON.stringify(event);
  }

  return message;
}

function consoleObserver(event) {
  console.log(`${event.level} - ${event.namespace} - ${formatEvent(event)}`);
}

function mainThreadObserver(event) {
  ipcRenderer.send("log-message", event);
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
