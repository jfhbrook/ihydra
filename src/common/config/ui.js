const uiMixin = {
  getWindowDimensions() {
    const config = { ...this };
    config.logger.warn(config.action);
    switch (config.action) {
      case "launcher":
        config.window = { width: 500, height: 350 };
        break;
      default:
        config.window = { width: 800, height: 600 };
    }
    return config;
  }
};

export default uiMixin;
