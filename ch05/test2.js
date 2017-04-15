var http = require('http');

var server = http.createServer().listen(8124);

server.on('request', function (req, res) {

    console.log(req.headers);
    console.log(req.rawHeaders);
    
    // // 輸出host值
    console.log(req.headers.host);
    console.log(req.rawHeaders[0] + ' is ' + req.rawHeaders[1]);

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World!');
});
console.log(`server listening on 8124`);
