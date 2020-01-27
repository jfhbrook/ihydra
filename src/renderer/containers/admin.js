const React = require("react");

module.exports = ({ context }) => {
  return <h1>{JSON.stringify(context)}</h1>;
  /*
  return (
    <div>
      <h1>This is the admin part</h1>
      <form>
        <label>
          Name:
          <input type="text" name="name" />
        </label>
        <br />
        <label>
          Pretty Name:
          <input type="text" name="pretty" />
        </label>
        <br />
        <label>
          Kernel Command:
          <input type="text" name="kernelCommand" />
        </label>
        <br />
        <label>
          Install for your Local User:
          <input type="checkbox" name="local" defaultChecked />
        </label>
        <br />
        <input type="submit" value="Install Kernel" />
      </form>
    </div>
  );
  */
};
