var forever = require('forever-monitor');

var child = new (forever.Monitor)('httpserver.js', {
    max: 3,
    silent: true,
    args: []
});

child.on('exit', function() {
    console.log(`httpserver.js has exited after 3 restarts`);
});

child.start();