const { EventEmitter } = require('events');

let counter = 0;

const em = new EventEmitter();

setInterval(function () {
    em.emit('timed', counter++);
}, 3000);

em.on('timed', function(data) {
    console.log(`timed ${data}`);
});