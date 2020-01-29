const path = require('path');

const isDev = require('electron-is-dev');
const quote = require('shell-quote').quote
const which = require('which');

class Argv {
  constructor(argv, root) {
    this.argv = argv;
    this.root = root;
  }

  get args() {
    if (this.cachedArgs) {
      return this.cachedArgs;
    }

    const args = this.argv.slice();

    if (isDev) {
      // First line is electron.exe
      args.shift();

      // Many arguments can be passed to electron before the
      // script so we shift args off until we get one that looks like a
      // script.
      //
      // This may or may not end up being super brittle.
      let maybeScript = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!args.length) {
          break;
        }
        maybeScript = args.shift();
        if (path.extname(path.basename(maybeScript)) === ".js") {
          break;
        }
      }
    } else {
      // This program is running in a bundled form so it shouldn't
      // have a script argument
      args.shift();
    }

    this.cachedArgs = args;

    return args;
  }

  get commanderArgv() {
    return ['dummy.exe', 'dummy.js'].concat(this.args);
  }

  async getKernelPrefix() {
    if (this.cachedKernelPrefix) {
      return this.cachedKernelPrefix;
    }

    let prefix;

    if (isDev) {
      // In development mode we're running our app using electron-webpack's
      // HMR server and we can't naively run "electron.exe ./dev-bundle.js"
      // because the bundle depends on HMR socket information passed by env
      // variable. 

      // So we construct args for running electron-webpack - but note that
      // without setting the cwd to the project root somehow this won't do
      // the right thing. :)
      prefix = [await which('electron-webpack'), 'dev'];
    } else {
      // In production, we should be able to run the command naively
      prefix = this.argv[0];
    }

    this.cachedKernelPrefix = prefix;

    return prefix;
  }

  async getShell() {
    if (this.cachedShell) {
      return this.cachedShell;
    }

    let shells;

    if (process.platform === 'win32') {
      shells = ['powershell'];
    } else {
      shells = ['bash', 'sh'];
    }

    async function* finder() {
      let i = 0;
      while (i < shells.length) {
        try {
          const shell = shells[i];
          const resolved = await which(shells[i]);
          if (resolved) {
            yield shell;
          }
        } catch (err) {
          if (err.code === 'ENOENT') {
            continue;
          }
          throw err;
        } finally {
          i++;
        }
      }
    }

    for await (let shell of finder()) {
      this.cachedShell = shell;
      return shell;
    }

    throw new Error('shell not found');
  }
}

module.exports = Argv;