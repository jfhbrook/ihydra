const { EventEmitter } = require('events').EventEmitter;

class Channel extends EventEmitter {
  constructor(snd, rcv, namespace) {
    super();

    this.snd = snd;
    this.rcv = rcv;
    this.namespace = namespace;

    this.rcv.on(this.namespace, (obj) => {
      console.log('receiving', obj);
      this.emit('message', obj);
    });
  }

  send(obj) {
    console.log('sending', this.namespace, obj);
    this.snd.send(this.namespace, obj);
  }

  kill() {
    throw new Error('not implemented');
  }
};

module.exports = Channel;