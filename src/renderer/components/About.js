import React from "react";

import Code from "./Code";
import Divider from "./Divider";
import Heart from "./Heart";
import Link from "./ExternalLink";
import Keypress from "./Keypress";

export default function About() {
  return (
    <>
      <h1>IHydra</h1>
      <h2>A Jupyter kernel for live coding visuals</h2>
      <Divider />
      <p>
        IHydra is a <Link href="https://jupyter.org/">Jupyter</Link> kernel for{" "}
        <Link href="https://hydra-editor.glitch.me">hydra</Link>, a visual
        synthesizer written in{" "}
        <Link href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
          JavaScript
        </Link>{" "}
        and{" "}
        <Link href="https://developer.mozilla.org/en-US/docs/Glossary/WebGL">
          {" "}
          WebGL
        </Link>
        . It&lsquo;s an <Link href="https://www.electronjs.org/">
          Electron
        </Link>{" "}
        application written in <Link href="https://reactjs.org/">React</Link>{" "}
        and with libraries the{" "}
        <Link href="https://github.com/n-riesco/ijavascript">IJavascript</Link>{" "}
        project.
      </p>
      <p>
        Jupyter is a{" "}
        <Link href="https://en.wikipedia.org/wiki/Notebook_interface">
          notebook
        </Link>{" "}
        application typically used for writing{" "}
        <Link href="https://www.python.org/">Python</Link> in an interactive
        manner. Jupyter is most popular in the realms of{" "}
        <Link href="https://en.wikipedia.org/wiki/Data_science">
          data science
        </Link>{" "}
        and{" "}
        <Link href="https://en.wikipedia.org/wiki/Data_visualization">
          data visualization
        </Link>
        . However, Jupyter is written to allow for arbitrary backends, meaning
        that we can use Jupyter to drive hydra. This means that we can take
        advantage of all of the Jupyter notebook&lsquo;s features while live
        coding with hydra!
      </p>
      <p>To Get Started:</p>
      <ol>
        <li>
          Install <strong>Python 3.7</strong> and <strong>Jupyter</strong>. If
          you don&lsquo;t already do development with Python, the easiest -
          <strong>and recommended</strong> - way to install both is to{" "}
          <Link href="https://www.anaconda.com/distribution/#download-section">
            install Anaconda
          </Link>
          , a distribution of Python intended for easy use by data scientists
          that includes Jupyter.
        </li>
        <li>
          Start the launcher and click &ldquo;Install IHydra&ldquo; to install
          IHydra to Jupyter&lsquos user-local kernels.
        </li>
        <li>
          Start Jupyter. You can either run <Code>jupyter notebook</Code> in a
          Python-enabled terminal, or more simply click the &ldquo;Launch
          Jupyter&ldquo; button in this launcher.
        </li>
        <li>
          Create a new notebook and choose the &ldquo;IHydra&ldquo; kernel. You
          should see a new window pop up.
        </li>
        <li>
          Type hydra commands into a cell and press{" "}
          <Keypress>Ctrl-Enter</Keypress> to evaluate a cell.
        </li>
      </ol>
      <p>
        IHydra was hacked together by{" "}
        <Link href="https://twitter.com/jfhbrook">Josh Holbrook</Link>. Hydra
        itself was written by{" "}
        <Link href="https://twitter.com/_ojack_">Olivia Jack</Link>. The IHydra
        codebase is forked from IJavascript, which was written by{" "}
        <Link href="https://github.com/n-riesco">Nicolas Riesco</Link> and other
        contributors.
      </p>
      <p>
        Like IJavascript, this project uses a{" "}
        <Link href="https://opensource.org/licenses/BSD-3-Clause">
          BSD 3-Clause license
        </Link>
        . The source code is available{" "}
        <Link href="https://github.com/jfhbrook/ihydra">GitHub</Link>.
      </p>
      <p>
        If you&lsquo;re trying to use IHydra and get stuck, feel free to{" "}
        <Link href="https://twitter.com/jfhbrook">contact Josh on Twitter</Link>{" "}
        - as of this writing, his DMs are open - or via{" "}
        <Link href="https://github.com/jfhbrook/ihydra/issues">
          GitHub Issues
        </Link>
        . Keep in mind that IHydra is ultimately a hack project. Josh will do
        what he can but can&squo;t guarantee regular upkeep. You have been
        warned.
      </p>
      <p>
        Cheers! <Heart />
      </p>
    </>
  );
}

About.propTypes = {};
