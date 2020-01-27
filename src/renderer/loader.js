var React = require('react');
var render = require('react-dom').render;

class Loader {
    constructor() {
        this.containers = new Map();
    }
    register(type, component) {
        this.containers.set(type, component);
    }

    load(context) {
        var type = context.action;
        var Component;

        if (this.containers.has(type)) {
            Component = this.containers.get(type);
        } else {
            Component = this.containers.get('default');
        }

        render(
            <Component context={context} />,
            document.getElementById('app')
        );
    }
}

module.exports = {Loader};