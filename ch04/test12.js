var http = require('http');

console.time('hello-timer');
http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
    console.timeEnd('hello-timer');
    console.time('hello-timer');
}).listen(8124);

console.log(`Server running at http:/127.0.0.1:8124`);