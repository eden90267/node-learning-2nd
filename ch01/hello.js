/**
 * Created by eden90267 on 2017/4/6.
 */
var http = require('http');

const port = 8124;

http
    .createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Hello World\n');
    })
    .listen(port, function () {
        console.log(`Server running at http://127.0.0.1:${port}`);
    });