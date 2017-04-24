var http = require('http');

var server = http.createServer().listen(8124);

server.on('request', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

console.log('server listening on 8124');