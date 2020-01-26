var React = require('react');
var render = require('react-dom').render;

class Loader {
    constructor() {
        this.containers = new Map();
    }
    register(type, component) {
        this.containers.set(type, component);
    }

    load({type, options}) {
        var Component;

        if (this.containers.has(type)) {
            Component = this.containers.get(type);
        } else {
            Component = this.containers.get('default');
        }

        render(
            <Component options={options} />,
            document.getElementById('app')
        );
    }
}

module.exports = {Loader};