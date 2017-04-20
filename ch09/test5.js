const http = require('http');

http.createServer((req, res) => {
    res.writeHead(200);
    res.write('Hello');
    res.end();
}).listen(8124);