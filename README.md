# IHydra

IHydra is a [Jupyter](https://jupyter.org/) kernel for [hydra](https://hydra-editor.glitch.me), a visual synthesizer written in JavaScript and WebGL. It's an Electron application written in React and with libraries and code from the [IJavascript](https://github.com/n-riesco/ijavascript) project.

Jupyter is a [notebook](https://en.wikipedia.org/wiki/Notebook_interface) application typically used for writing Python in an interactive manner. Jupyter is most popular in the realms of data science 
and data visualization. However, Jupyter is written to allow for arbitrary backends, meaning that we can use Jupyter to drive hydra. This means that we can take advantage of all of the Jupyter notebook's features while live coding with hydra!

## Setup

Install Python 3.7 and Jupyter. If you don't already do development with Python, the easiest - and recommended - way to install both is to [install Anaconda](https://www.anaconda.com/distribution/#download-section), a distribution of Python intended for easy use by data scientists that includes Jupyter. Alternately, you may want to use [pyenv](https://github.com/pyenv/pyenv) and [virtualenvs](https://docs.python-guide.org/dev/virtualenvs/). It's up to you.

You'll also need to build and run this project in dev mode, since I [wasn't able to get the prod build to work](https://github.com/electron-userland/electron-builder/issues/4685). I'm using Node.js 12.6.0, but any recent version should do.

Setting this up should be about as simple as `npm install && npm run dev`.

Once that's running, you should be able to install the kernel by running through the launcher UI that pops up when you run the project naively. From there, you should be able to start Jupyter, crack open a notebook, and choose the IHydra kernel from the drop-down.

IHydra was hacked together by [Josh Holbrook](https://twitter.com/jfhbrook). Hydra itself was written by [Olivia Jack](https://twitter.com/_ojack_). The IHydra codebase was forked from IJavascript, which was written by [Nicolas Riesco](https://github.com/n-riesco) and other contributors. Small pieces of this project came from other libraries. For more details check the headers of the individual files, as well as the `AUTHORS` file in this project.

Like IJavascript, this project uses a BSD 3-Clause license.

## Demo

You can find a fully working demo in [./demo.ipynb](https://github.com/jfhbrook/ihydra/blob/develop/demo.ipynb).

## Bugs

There are many. I found working with the Electron and Webpack stack very challenging and I got blocked on a number of major issues:

* If you click "Launch Jupyter" and then "Exit" in dev mode on Windows, Jupyter will get orphaned.
* If you click "Launch Jupyter" a second time, the app will crash.
* This project has no tests, because it's not obvious how to add tests to an electron-webpack app.
* As mentioned, this project won't actually build a prod release.

If you can fix these, I'd be appreciative.