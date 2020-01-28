const isDev = require('electron-is-dev');
const quote = require('shell-quote').quote
const which = require('which');

class Argv {
  constructor(argv, root) {
    this.argv = argv;
    this.root = root;
  }

  calculateArgs() {
    if (isDev) {
      const args = argv.slice();

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
          if (!raw.length) {
            break;
          }
          maybeScript = raw.shift();
          if (path.extname(path.basename(maybeScript)) === ".js") {
            break;
          }
        }
      } else {
        // This program is running in a bundled form so it shouldn't
        // have a script argument
        args.shift();
      }

      return args;
    }
  }

  get args() {
    if (!this.cachedArgs) {
      this.cachedArgs = this.calculateArgs();
    }
    return this.cachedArgs;
  }

  get commanderArgv() {
    return ['dummy.exe', 'dummy.js'].concat(this.args);
  }

  async runJupyterCommand(args) {
    return await exec((await this.getKernelPrefix()).concat(args));
  }

  async getKernelPrefix() {
    if (this.cachedKernelPrefix) {
      return this.cachedKernelPrefix;
    }

    if (isDev) {
      // In development mode we're running our app using electron-webpack's
      // HMR server and we can't naively run "electron.exe ./dev-bundle.js"
      // because the bundle depends on HMR socket information passed by env
      // variable. 

      // So we construct args for running electron-webpack...
      const command = quote(['electron-webpack', 'dev']);

      // ...but electron-webpack depends on being in the project directory
      // and kernel.json has no way of encoding that path, so we need to wrap
      // our command in an environment-specific shell script
      const root = quote([this.root]);
      const shell = await this.getShell();
      let shimScript;

      if (['bash', 'sh'].find(shell)) {
        shimScript = [
          shell, '-c',
          `cd ${root} && exec ${command)}`
        ];
      } else if (shell === 'powershell') {
        shimScript = [
          shell, '-Command',
          `(cd ${root)} -and (${command)}`
        ];
      } else {
        throw new Error('dont know how to do this shell');
      }

      this.cachedKernelPrefix = shimScript;

      return shimScript;
    } else {
      // In production, we should be able to run the command naively
      return this.argv[0];
    }
  }

  async getShell() {
    if (!this.cachedShell) {
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
          yield await which(shells[i]);
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