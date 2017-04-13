var net = require("net"),
    repl = require("repl");

connections = 0;

repl.start({
    prompt: "node via stdin>",
    input: process.stdin,
    output: process.stdout
});

net.createServer(function (socket) {
    connections += 1;
    repl.start({
        prompt: "node via Unix socket>",
        input: socket,
        output: socket
    }).on('exit', function() {
        socket.end();
    })
}).listen("./node-repl-sock");

net.createServer(function(socket) {
    connections+=1;
    repl.start({
        prompt: "node via TCP socket>",
        input: socket,
        input: socket
    }).on('exit', function() {
        socket.end();
    });
}).listen(5001);